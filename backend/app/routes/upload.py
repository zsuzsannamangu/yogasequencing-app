from fastapi import APIRouter, UploadFile, File
import os, shutil, subprocess
from app.database import database
from app.models import videos
import asyncio

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def convert_to_mp4(input_path):
    base, _ = os.path.splitext(input_path)
    output_path = f"{base}.mp4"
    counter = 1

    # Generate unique filename if needed
    while os.path.exists(output_path):
        output_path = f"{base}_{counter}.mp4"
        counter += 1

    subprocess.run([
        'ffmpeg', '-i', input_path,
        '-vcodec', 'libx264', '-preset', 'fast',
        '-acodec', 'aac', '-strict', 'experimental',
        output_path
    ])

    return output_path

"""
@app.post("/upload") below handles video file upload from frontend.
- Saves file to 'uploads/' directory
- Converts non-MP4 files to MP4 using ffmpeg
- Returns cleaned-up filename
"""

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Saves uploaded video file to 'uploads/' and inserts metadata into Supabase.
    Converts to .mp4 if necessary.
    Returns saved filename and video_id.
    """
    file_location = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Convert to .mp4 if needed
    if not file_location.lower().endswith(".mp4"):
        mp4_path = convert_to_mp4(file_location)
        if not os.path.exists(mp4_path):
            raise ValueError("FFmpeg conversion failed.")
        os.remove(file_location)
        filename = os.path.basename(mp4_path)
        final_path = mp4_path
    else:
        filename = file.filename
        final_path = file_location

    # Insert into Supabase
    query = videos.insert().values(
        filename=filename,
        status="uploaded",
        total_frames=None
    )
    video_id = await database.execute(query)

    # Schedule deletion of the final file after 5 minutes
    asyncio.create_task(delete_file_later(final_path))

    return {
        "message": f"File '{filename}' uploaded successfully.",
        "filename": filename,
        "video_id": video_id
    }

async def delete_file_later(path, delay=300):
    await asyncio.sleep(delay)
    if os.path.exists(path):
        os.remove(path)
