# Yoga Sequencing App

## Features
- Upload yoga videos via frontend
- Automatically detects held yoga poses
- Extracts and cleans silhouettes using DeepLabV3 + OpenCV
- Converts silhouettes into SVG vector images
- Displays all poses in a responsive grid
- Allows exporting the sequence as a printable PDF

## Technologies used
- React:                    Frontend UI Library (TypeScript)
- Next.js:                  React framework for routing and rendering
- Python:	                Runs server-side backend code
- FastAPI:	                Defines backend API endpoints (e.g., upload videos, pose detection)
- Uvicorn:	                ASGI server that runs FastAPI
- PostgreSQL (planned):     Database to store user-generated data
- MoveNet + Tensorflow:     Detects human keypoints (pose estimation)
- OpenCV (cv2):             Video processing (frame capture, motion detection)
- PyTorch + DeepLabV3:      Semantic segmentation for background removal
- potrace:                  Converts binary masks into scalable vector images (SVGs)

## How does it work?
- The program detects moments of stillness in the video, captures a frame of the person holding a pose, removes the background, and converts the image into a clean vector silhouette.

- The program detects a "held pose" using motion detection between video frames:
    - Video is split into frames using OpenCV.
    - Each frame is converted to grayscale.
    - The difference between the current and previous frame is computed: diff = cv2.absdiff(current_gray_frame, previous_gray_frame)
    - It calculates the percentage of pixels that changed (i.e., motion): motion = np.sum(diff > 10) / diff.size
    - If motion is below a certain threshold (e.g., motion < 0.02) for multiple consecutive frames, we assume: "The person is holding still, so they’re in a pose."
    - It collects all frames that meet this "stillness" rule and selects the middle one as the best representative of the pose.
    
    - This works because when someone transitions into a yoga pose there is motion, but when they pause and hold the posture, motion between frames drops.
    - This natural drop in motion is used to identify 'held' poses. These are the moments captured and included in the final printed yoga sequence.

- The background is removed using DeepLabV3 from torchvision.models.segmentation, here is how it works:
    - You extract a single frame from the still part of the video (after motion detection).
    - You pass it through DeepLabV3, a deep learning model trained for semantic segmentation: model = models.segmentation.deeplabv3_resnet101(pretrained=True).eval()
    - It outputs a pixel-wise mask where each pixel belongs to a class (e.g., person, background, etc.).
    - You isolate the "person" class (class 15 in the COCO dataset): person_mask = (mask == 15).astype(np.uint8) * 255
    - Then you clean up the mask using: Gaussian blur, Morphological closing and Largest connected component filtering
    - Finally, the cleaned mask is converted to SVG using potrace
    - DeepLabV3 is a PyTorch model that runs locally (on the computer) in the FastAPI backend using torch and torchvision libraries

- Vectorization:
    - The final binary mask is converted to SVG using potrace.
    - The result is a clean, scalable vector silhouette of the pose.

- Frontend Display:
    - SVG images are rendered in a responsive grid using Tailwind CSS
    - Users can: upload new videos, generate silhouettes, download sequences as PDF for printing

## Getting started
- Backend:
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    uvicorn main:app --reload

- Frontend:
    cd frontend
    npm install
    npm run dev

## Project Structure
    backend/
    ├── main.py               # FastAPI backend
    ├── uploads/              # Uploaded videos
    ├── frames/               # Processed frames
    ├── silhouettes/          # Generated SVGs
    ├── poses/                # Pose keypoints JSON

    frontend/
    ├── src/app/upload/       # Upload video page
    ├── src/app/silhouettes/  # View + export silhouettes
    ├── src/components/       # Shared React components

## Future improvements
- Train a custom yoga pose classifier
- Add user authentication + pose library
- Enable sequence editing with drag & drop
- Add pose labels and annotation tools
- Improve silhouette precision (OpenPose or MediaPipe custom model)

## License
[MIT License](LICENSE)

## Contact
zsuzsannamangu@gmail.com