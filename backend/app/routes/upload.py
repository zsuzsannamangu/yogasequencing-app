from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os, shutil, subprocess
from app.database import database
from app.models import videos
from app.auth import get_current_user_id
import asyncio
import uuid
import aiofiles
from PIL import Image
import io

router = APIRouter()
security = HTTPBearer()

UPLOAD_DIR = "uploads"
PROFILE_IMAGES_DIR = "uploads/profile_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROFILE_IMAGES_DIR, exist_ok=True)

# Profile image upload constants
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB

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

    # Schedule deletion of the final file after 3 minutes
    asyncio.create_task(delete_file_later(final_path, 180))

    return {
        "message": f"File '{filename}' uploaded successfully.",
        "filename": filename,
        "video_id": video_id
    }

async def delete_file_later(path, delay=300):
    await asyncio.sleep(delay)
    if os.path.exists(path):
        os.remove(path)

# Profile Image Upload Functions

def validate_image_file(file: UploadFile) -> bool:
    """Validate uploaded image file"""
    if not file.filename:
        return False
    
    # Check file extension
    file_ext = os.path.splitext(file.filename.lower())[1]
    if file_ext not in ALLOWED_IMAGE_EXTENSIONS:
        return False
    
    return True

async def process_image(file_content: bytes) -> bytes:
    """Process and optimize the uploaded image"""
    try:
        # Open image with PIL
        image = Image.open(io.BytesIO(file_content))
        
        # Convert to RGB if necessary (for JPEG compatibility)
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        
        # Resize image if it's too large (max 800x800)
        max_size = (800, 800)
        if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save as JPEG with quality optimization
        output = io.BytesIO()
        image.save(output, format="JPEG", quality=85, optimize=True)
        return output.getvalue()
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image file: {str(e)}"
        )

@router.post("/profile-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Upload a profile image for the authenticated user"""
    try:
        # Get current user ID
        user_id = get_current_user_id(credentials.credentials)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        # Validate file
        if not validate_image_file(file):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only JPG, PNG, GIF, and WebP files are allowed."
            )
        
        # Read file content
        file_content = await file.read()
        
        # Check file size
        if len(file_content) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size too large. Maximum size is 5MB."
            )
        
        # Process and optimize image
        processed_content = await process_image(file_content)
        
        # Generate unique filename
        file_ext = ".jpg"  # Always save as JPEG after processing
        unique_filename = f"{user_id}_{uuid.uuid4().hex}{file_ext}"
        file_path = os.path.join(PROFILE_IMAGES_DIR, unique_filename)
        
        # Save file
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(processed_content)
        
        # Update user's profile_image in database
        relative_path = f"uploads/profile_images/{unique_filename}"
        await database.execute(
            "UPDATE users SET profile_image = :profile_image WHERE id = :user_id",
            {"profile_image": relative_path, "user_id": user_id}
        )
        
        return {
            "message": "Profile image uploaded successfully",
            "image_path": relative_path,
            "filename": unique_filename
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.delete("/profile-image")
async def delete_profile_image(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Delete the current user's profile image"""
    try:
        # Get current user ID
        user_id = get_current_user_id(credentials.credentials)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        # Get current profile image path
        user = await database.fetch_one(
            "SELECT profile_image FROM users WHERE id = :user_id",
            {"user_id": user_id}
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Delete file if it exists
        if user["profile_image"]:
            file_path = user["profile_image"]
            if os.path.exists(file_path):
                os.remove(file_path)
        
        # Update database to remove profile image
        await database.execute(
            "UPDATE users SET profile_image = NULL WHERE id = :user_id",
            {"user_id": user_id}
        )
        
        return {"message": "Profile image deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Delete failed: {str(e)}"
        )
