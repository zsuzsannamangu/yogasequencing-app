from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import tensorflow as tf
import tensorflow_hub as hub
import json
import os, shutil, subprocess, glob
import torch, cv2
import numpy as np
from torchvision import models, transforms
from PIL import Image
from skimage.measure import label, regionprops

app = FastAPI()

# CORS setup
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs("frames", exist_ok=True)
os.makedirs("silhouettes", exist_ok=True)

device = "cuda" if torch.cuda.is_available() else "cpu"
deeplab_model = models.segmentation.deeplabv3_resnet101(pretrained=True).to(device).eval()

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"info": f"file '{file.filename}' saved at '{file_location}'"}

#movenet = hub.load("https://tfhub.dev/google/movenet/singlepose/lightning/4")
movenet = hub.load("./models/movenet_lightning")


input_size = 192

@app.post("/detect-poses")
async def detect_poses(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        return {"error": "File not found."}

    cap = cv2.VideoCapture(file_path)
    frame_count = 0
    pose_results = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        frame_count += 1
        img = cv2.resize(frame, (input_size, input_size))
        img = img.astype(np.int32)
        img = np.expand_dims(img, axis=0)
        outputs = movenet.signatures['serving_default'](tf.convert_to_tensor(img))
        keypoints = outputs['output_0'].numpy()
        keypoints_list = keypoints[0][0].tolist()
        pose_results.append({"frame": frame_count, "keypoints": keypoints_list})

    cap.release()
    os.makedirs("poses", exist_ok=True)
    output_path = os.path.join("poses", f"{filename}_poses.json")
    with open(output_path, "w") as f:
        json.dump(pose_results, f)

    return {"message": f"Pose detection complete. Results saved to {output_path}"}

@app.post("/extract-silhouettes")
def extract_silhouettes(filename: str):
    video_path = os.path.join(UPLOAD_DIR, filename)
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"error": "Could not open video."}

    # Detect stillness sequences
    prev_gray, still_ranges = None, []
    start_idx = None
    idx = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        if prev_gray is not None:
            diff = cv2.absdiff(gray, prev_gray)
            motion = np.sum(diff > 10) / diff.size
            if motion < 0.02:
                if start_idx is None:
                    start_idx = idx
            else:
                if start_idx is not None and idx - start_idx >= 5:
                    still_ranges.append((start_idx, idx))
                start_idx = None
        prev_gray = gray
        idx += 1

    if start_idx is not None and idx - start_idx >= 5:
        still_ranges.append((start_idx, idx))

    cap.release()
    if not still_ranges:
        return {"error": "No still frames detected."}

    silhouette_files = []

    for i, (start, end) in enumerate(still_ranges):
        cap = cv2.VideoCapture(video_path)
        mid_frame = (start + end) // 2
        cap.set(cv2.CAP_PROP_POS_FRAMES, mid_frame)
        ret, frame = cap.read()
        cap.release()

        frame_path = f"frames/frame_{i}.png"
        cv2.imwrite(frame_path, frame)

        input_image = Image.open(frame_path).convert("RGB")
        preprocess = transforms.Compose([
            transforms.Resize(520),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        input_tensor = preprocess(input_image).unsqueeze(0).to(device)

        with torch.no_grad():
            output = deeplab_model(input_tensor)["out"][0]
        mask = output.argmax(0).byte().cpu().numpy()
        person_mask = (mask == 15).astype(np.uint8) * 255

        blurred = cv2.GaussianBlur(person_mask, (5, 5), 0)
        _, thresh = cv2.threshold(blurred, 30, 255, cv2.THRESH_BINARY)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

        labels = label(closed, connectivity=2)
        props = regionprops(labels)
        if not props:
            continue
        largest = max(props, key=lambda x: x.area)
        largest_mask = (labels == largest.label).astype(np.uint8) * 255

        pgm_path = f"frames/pose_{i}.pgm"
        cv2.imwrite(pgm_path, 255 - largest_mask)

        svg_path = f"silhouettes/pose_{i}.svg"
        subprocess.run(["potrace", pgm_path, "--svg", "-o", svg_path])
        silhouette_files.append(svg_path)

    return {"message": "Silhouettes created", "files": silhouette_files}

app.mount("/silhouettes", StaticFiles(directory="silhouettes"), name="silhouettes")

