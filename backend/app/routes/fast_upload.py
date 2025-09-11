from fastapi import APIRouter, UploadFile, File
import os
import shutil
import time
from typing import Optional

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/fast-upload")
async def fast_upload_file(file: UploadFile = File(...)):
    """
    Ultra-fast file upload with minimal processing.
    Just saves the file and returns basic info.
    """
    try:
        # Generate clean filename
        timestamp = int(time.time())
        clean_filename = f"{timestamp}_{file.filename.replace(' ', '_').replace(',', '').replace('(', '').replace(')', '')}"
        file_location = os.path.join(UPLOAD_DIR, clean_filename)

        # Save file with large buffer for speed
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer, length=2*1024*1024)  # 2MB chunks

        # Quick validation
        if not os.path.exists(file_location) or os.path.getsize(file_location) == 0:
            raise ValueError("File upload failed")

        file_size = os.path.getsize(file_location)
        
        return {
            "success": True,
            "filename": clean_filename,
            "file_size": file_size,
            "message": f"File uploaded successfully ({file_size / 1024 / 1024:.1f} MB)"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Upload failed"
        }
