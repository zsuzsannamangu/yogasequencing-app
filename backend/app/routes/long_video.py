from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse
import os
import json
import asyncio
from typing import Dict, Any
import logging

from app.services.video_processor import video_processor
from app.services.silhouette_extractor import silhouette_extractor
from app.services.fast_processor import fast_processor
from app.services.ultra_fast_processor import ultra_fast_processor

logger = logging.getLogger(__name__)
router = APIRouter()

# Store processing jobs
processing_jobs: Dict[str, Dict[str, Any]] = {}

@router.post("/process-video")
async def process_video(filename: str, background_tasks: BackgroundTasks):
    """
    Start processing a video file for silhouette extraction.
    Returns a job ID for tracking progress.
    """
    video_path = os.path.join("uploads", filename)
    
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found. Please upload the video again. Videos are not stored and are deleted after a few minutes.")
    
    # Generate job ID
    import time
    job_id = f"job_{int(time.time())}_{hash(filename)}"
    
    # Initialize job status
    processing_jobs[job_id] = {
        "status": "starting",
        "progress": 0,
        "filename": filename,
        "error": None,
        "result": None
    }
    
    # Start background processing
    background_tasks.add_task(process_video_background, job_id, video_path)
    
    return {
        "job_id": job_id,
        "message": "Video processing started",
        "status_url": f"/long-video/progress/{job_id}"
    }

async def process_video_background(job_id: str, video_path: str):
    """Background task to process the video"""
    try:
        # Update job status
        processing_jobs[job_id]["status"] = "analyzing"
        processing_jobs[job_id]["progress"] = 0
        
        # Use ultra-fast processing for all videos (simplified approach)
        file_size_mb = os.path.getsize(video_path) / (1024 * 1024)
        logger.info(f"Video file size: {file_size_mb:.1f} MB - using ultra-fast processing")
        
        # Start progress updater for ultra-fast processing
        async def update_ultra_fast_progress():
            while processing_jobs[job_id]["status"] in ["analyzing", "sampling"]:
                progress_data = ultra_fast_processor.get_progress()
                processing_jobs[job_id]["progress"] = progress_data["progress_percent"]
                processing_jobs[job_id]["status"] = progress_data["status"]
                logger.info(f"Ultra-fast progress: {progress_data['progress_percent']}% - {progress_data['status']}")
                await asyncio.sleep(0.2)
        
        # Start progress updater
        progress_task = asyncio.create_task(update_ultra_fast_progress())
        
        motion_result = await ultra_fast_processor.process_ultra_fast(video_path)
        
        # Cancel progress updater
        progress_task.cancel()
        
        if not motion_result["success"]:
            processing_jobs[job_id]["status"] = "error"
            processing_jobs[job_id]["error"] = motion_result["error"]
            return
        
        still_ranges = motion_result["still_ranges"]
        logger.info(f"Found {len(still_ranges)} still ranges for job {job_id}")
        
        # Update progress
        processing_jobs[job_id]["status"] = "extracting_silhouettes"
        processing_jobs[job_id]["progress"] = 80
        
        # Step 2: Extract silhouettes from still ranges with progress callback
        silhouettes_dir = "silhouettes"
        os.makedirs(silhouettes_dir, exist_ok=True)
        
        def update_silhouette_progress(progress_data):
            # Map silhouette extraction progress from 80-95%
            silhouette_progress = 80 + int((progress_data["progress"] * 15) / 100)
            processing_jobs[job_id]["progress"] = silhouette_progress
            processing_jobs[job_id]["status"] = "extracting_silhouettes"
            logger.info(f"Silhouette extraction progress: {silhouette_progress}% - {progress_data['message']}")
        
        silhouette_files = await silhouette_extractor.extract_silhouettes_batch(
            video_path, still_ranges, silhouettes_dir, progress_callback=update_silhouette_progress
        )
        
        # Clean up temp analysis directory
        import shutil
        if os.path.exists("temp_analysis"):
            shutil.rmtree("temp_analysis")
        
        # Convert filenames to full paths
        full_silhouette_paths = [os.path.join(silhouettes_dir, filename) for filename in silhouette_files]
        
        # Update job status
        processing_jobs[job_id]["status"] = "completed"
        processing_jobs[job_id]["progress"] = 100
        processing_jobs[job_id]["result"] = {
            "silhouette_files": full_silhouette_paths,
            "total_silhouettes": len(silhouette_files),
            "still_ranges": still_ranges,
            "video_info": motion_result["video_info"]
        }
        
        logger.info(f"Completed processing job {job_id} with {len(silhouette_files)} silhouettes")
        
    except Exception as e:
        logger.error(f"Error processing video for job {job_id}: {str(e)}")
        processing_jobs[job_id]["status"] = "error"
        processing_jobs[job_id]["error"] = str(e)

@router.get("/progress/{job_id}")
async def get_progress(job_id: str):
    """Get the progress of a video processing job"""
    if job_id not in processing_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = processing_jobs[job_id]
    
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "filename": job["filename"],
        "error": job["error"],
        "result": job["result"] if job["status"] == "completed" else None
    }

@router.get("/progress/{job_id}/stream")
async def stream_progress(job_id: str):
    """Stream progress updates for a job"""
    if job_id not in processing_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    async def generate_progress():
        while True:
            job = processing_jobs.get(job_id)
            if not job:
                break
            
            progress_data = {
                "job_id": job_id,
                "status": job["status"],
                "progress": job["progress"],
                "filename": job["filename"],
                "error": job["error"]
            }
            
            if job["status"] == "completed":
                progress_data["result"] = job["result"]
                yield f"data: {json.dumps(progress_data)}\n\n"
                break
            elif job["status"] == "error":
                yield f"data: {json.dumps(progress_data)}\n\n"
                break
            else:
                yield f"data: {json.dumps(progress_data)}\n\n"
            
            await asyncio.sleep(1)  # Update every second
    
    return StreamingResponse(
        generate_progress(),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )

@router.delete("/job/{job_id}")
async def cancel_job(job_id: str):
    """Cancel a processing job"""
    if job_id not in processing_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if processing_jobs[job_id]["status"] in ["completed", "error"]:
        raise HTTPException(status_code=400, detail="Job already finished")
    
    processing_jobs[job_id]["status"] = "cancelled"
    processing_jobs[job_id]["error"] = "Job cancelled by user"
    
    return {"message": "Job cancelled successfully"}

@router.get("/jobs")
async def list_jobs():
    """List all processing jobs"""
    return {
        "jobs": [
            {
                "job_id": job_id,
                "status": job["status"],
                "progress": job["progress"],
                "filename": job["filename"],
                "error": job["error"]
            }
            for job_id, job in processing_jobs.items()
        ]
    }
