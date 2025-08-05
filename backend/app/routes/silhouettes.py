from fastapi import APIRouter
import os
import glob
import subprocess
import cv2
import numpy as np
import torch
from PIL import Image
from torchvision import models, transforms
from skimage.measure import label, regionprops

router = APIRouter()

UPLOAD_DIR = "uploads"
FRAMES_DIR = "frames"
SILHOUETTES_DIR = "silhouettes"

os.makedirs(FRAMES_DIR, exist_ok=True)
os.makedirs(SILHOUETTES_DIR, exist_ok=True)

device = "cuda" if torch.cuda.is_available() else "cpu"
deeplab_model = models.segmentation.deeplabv3_resnet101(pretrained=True).to(device).eval()

#Cleans up frames directory after processing
def clean_frames():
    for file in glob.glob("frames/*"):
        os.remove(file)

@router.post("/extract-silhouettes")
def extract_silhouettes(filename: str):
    """
    Extracts held poses as silhouettes from a video using DeepLabV3 and potrace.
    Saves SVGs to the 'silhouettes/' directory.
    """
    original_path = os.path.join(UPLOAD_DIR, filename)
    base, _ = os.path.splitext(original_path)
    video_path = f"{base}.mp4" if os.path.exists(f"{base}.mp4") else original_path

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Unsupported video format or corrupted file")

    prev_gray, still_ranges = None, []
    start_idx, idx = None, 0

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

        frame_path = os.path.join(FRAMES_DIR, f"frame_{i}.png")
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

        pgm_path = os.path.join(FRAMES_DIR, f"pose_{i}.pgm")
        cv2.imwrite(pgm_path, 255 - largest_mask)

        svg_path = os.path.join(SILHOUETTES_DIR, f"pose_{i}.svg")
        subprocess.run(["potrace", pgm_path, "--svg", "-o", svg_path])

        silhouette_files.append(svg_path)

    # Clean up temporary frames
    clean_frames()

    return {"message": "Silhouettes created", "files": silhouette_files}