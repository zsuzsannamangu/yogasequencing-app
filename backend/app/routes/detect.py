from fastapi import APIRouter
import os
import json
import cv2
import numpy as np
import tensorflow as tf

# Load MoveNet once
import tensorflow_hub as hub
movenet = hub.load("./models/movenet_lightning")
input_size = 192

UPLOAD_DIR = "uploads"
POSES_DIR = "poses"
os.makedirs(POSES_DIR, exist_ok=True)

router = APIRouter()

@router.post("/detect-poses")
async def detect_poses(filename: str):
    """
    Runs pose detection using MoveNet.
    Saves keypoints to a JSON file in 'poses/'.
    """
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
        img = cv2.resize(frame, (input_size, input_size)).astype(np.int32)
        img = np.expand_dims(img, axis=0)
        outputs = movenet.signatures['serving_default'](tf.convert_to_tensor(img))
        keypoints = outputs['output_0'].numpy()[0][0].tolist()
        pose_results.append({"frame": frame_count, "keypoints": keypoints})

    cap.release()

    output_path = os.path.join(POSES_DIR, f"{filename}_poses.json")
    with open(output_path, "w") as f:
        json.dump(pose_results, f)

    return {"message": f"Pose detection complete. Results saved to {output_path}"}
