import os
import cv2
import numpy as np
import asyncio
from typing import List, Tuple, Dict
import logging

logger = logging.getLogger(__name__)

class FastVideoProcessor:
    """Ultra-fast video processor for very large files"""
    
    def __init__(self):
        self.progress = 0
        self.status = "initializing"
    
    async def process_large_video_fast(self, video_path: str) -> Dict:
        """Process a very large video using sampling technique"""
        try:
            self.status = "analyzing"
            self.progress = 10
            
            # Get video info
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise ValueError("Cannot open video file")
            
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = frame_count / fps if fps > 0 else 0
            
            cap.release()
            
            logger.info(f"Fast processing video: {duration:.1f}s, {frame_count} frames")
            
            # For very large videos, use sampling approach
            sample_rate = max(1, int(fps / 2))  # Sample every 0.5 seconds
            still_ranges = []
            
            self.status = "sampling"
            self.progress = 20
            
            # Sample frames throughout the video
            cap = cv2.VideoCapture(video_path)
            prev_gray = None
            still_start = None
            frame_idx = 0
            
            while frame_idx < frame_count:
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Resize for speed
                small_frame = cv2.resize(frame, (160, 120))
                gray = cv2.cvtColor(small_frame, cv2.COLOR_BGR2GRAY)
                
                if prev_gray is not None:
                    diff = cv2.absdiff(gray, prev_gray)
                    motion = np.sum(diff > 20) / diff.size
                    
                    if motion < 0.05:  # Still threshold
                        if still_start is None:
                            still_start = frame_idx
                    else:
                        if still_start is not None and frame_idx - still_start >= sample_rate * 2:
                            still_ranges.append((still_start, frame_idx))
                        still_start = None
                
                prev_gray = gray
                frame_idx += sample_rate
                
                # Update progress
                self.progress = 20 + int((frame_idx / frame_count) * 60)
                logger.info(f"Fast processing: {self.progress}% - frame {frame_idx}/{frame_count}")
                
                # Small delay to prevent overwhelming
                if frame_idx % (sample_rate * 10) == 0:
                    await asyncio.sleep(0.01)
            
            cap.release()
            
            # Handle final still range
            if still_start is not None and frame_idx - still_start >= sample_rate * 2:
                still_ranges.append((still_start, frame_idx))
            
            self.status = "completed"
            self.progress = 100
            
            logger.info(f"Fast processing completed. Found {len(still_ranges)} still ranges")
            
            return {
                "success": True,
                "still_ranges": still_ranges,
                "total_ranges": len(still_ranges),
                "video_info": {
                    "fps": fps,
                    "frame_count": frame_count,
                    "duration": duration,
                    "width": 0,  # Not needed for fast processing
                    "height": 0
                },
                "processing_method": "fast_sampling"
            }
            
        except Exception as e:
            logger.error(f"Error in fast processing: {str(e)}")
            self.status = "error"
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_progress(self) -> Dict:
        return {
            "status": self.status,
            "progress_percent": self.progress,
            "processed_chunks": 0,
            "total_chunks": 1,
            "current_chunk": 1,
            "error": None
        }

# Global fast processor instance
fast_processor = FastVideoProcessor()
