import os
import cv2
import numpy as np
import asyncio
from typing import List, Tuple, Dict
import logging

logger = logging.getLogger(__name__)

class UltraFastProcessor:
    """Ultra-fast processor that just samples key frames"""
    
    def __init__(self):
        self.progress = 0
        self.status = "initializing"
    
    async def process_ultra_fast(self, video_path: str) -> Dict:
        """Improved processing with motion detection + sampling for long videos"""
        try:
            self.status = "analyzing"
            self.progress = 10
            
            # Get basic video info
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise ValueError("Cannot open video file")
            
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = frame_count / fps if fps > 0 else 0
            
            logger.info(f"Improved processing: {duration:.1f}s video")
            
            # For videos longer than 5 minutes, use sampling + motion detection
            # For shorter videos, use full motion detection
            if duration > 300:  # 5 minutes
                still_ranges = await self._process_long_video_with_motion_detection(cap, fps, frame_count)
            else:
                still_ranges = await self._process_short_video_with_motion_detection(cap, fps, frame_count)
            
            cap.release()
            
            self.status = "completed"
            self.progress = 100
            
            logger.info(f"Improved processing completed. Created {len(still_ranges)} pose ranges")
            
            return {
                "success": True,
                "still_ranges": still_ranges,
                "total_ranges": len(still_ranges),
                "video_info": {
                    "fps": fps,
                    "frame_count": frame_count,
                    "duration": duration,
                    "width": 0,
                    "height": 0
                },
                "processing_method": "improved_motion_detection"
            }
            
        except Exception as e:
            logger.error(f"Error in ultra-fast processing: {str(e)}")
            self.status = "error"
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _process_short_video_with_motion_detection(self, cap, fps, frame_count) -> List[Tuple[int, int]]:
        """Full motion detection for shorter videos (< 5 minutes)"""
        self.status = "motion_detection"
        self.progress = 20
        
        still_ranges = []
        prev_gray = None
        start_idx = None
        
        # Process every frame for short videos
        for idx in range(frame_count):
            ret, frame = cap.read()
            if not ret:
                break
                
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            gray = cv2.resize(gray, (320, 240))  # Resize for faster processing
            
            if prev_gray is not None:
                diff = cv2.absdiff(gray, prev_gray)
                motion = np.sum(diff > 10) / diff.size
                
                # Look for pauses - motion should be consistently low for a period
                if motion < 0.025:  # Very low motion threshold for holds
                    if start_idx is None:
                        start_idx = idx
                else:
                    # Require longer still period to confirm a meaningful pose hold
                    if start_idx is not None and idx - start_idx >= int(fps * 2.5):  # At least 2.5 seconds still
                        still_ranges.append((start_idx, idx))
                    start_idx = None
            
            prev_gray = gray
            
            # Update progress
            if idx % 100 == 0:
                self.progress = 20 + int((idx / frame_count) * 70)
                await asyncio.sleep(0.001)  # Small delay
        
        # Handle final still range
        if start_idx is not None and frame_count - start_idx >= int(fps * 2.5):
            still_ranges.append((start_idx, frame_count))
        
        return still_ranges
    
    async def _process_long_video_with_motion_detection(self, cap, fps, frame_count) -> List[Tuple[int, int]]:
        """Sampling + motion detection for long videos (> 5 minutes)"""
        self.status = "sampling"
        self.progress = 20
        
        still_ranges = []
        
        # Sample every 8 seconds for better pose detection with overlap
        sample_interval = int(fps * 8)  # Every 8 seconds
        window_size = int(fps * 10)  # 10-second window around each sample (overlapping)
        
        for i in range(0, frame_count, sample_interval):
            # Define window around sample point
            window_start = max(0, i - window_size // 2)
            window_end = min(frame_count, i + window_size // 2)
            
            # Quick motion detection in this window
            cap.set(cv2.CAP_PROP_POS_FRAMES, window_start)
            prev_gray = None
            start_idx = None
            
            for frame_idx in range(window_start, window_end, max(1, int(fps / 2))):  # Sample every 0.5 seconds
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
                ret, frame = cap.read()
                if not ret:
                    break
                
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                gray = cv2.resize(gray, (320, 240))  # Resize for faster processing
                
                if prev_gray is not None:
                    diff = cv2.absdiff(gray, prev_gray)
                    motion = np.sum(diff > 10) / diff.size
                    
                    # Look for pauses in long videos too
                    if motion < 0.03:  # Very low motion threshold for holds
                        if start_idx is None:
                            start_idx = frame_idx
                    else:
                        if start_idx is not None and frame_idx - start_idx >= int(fps * 2.0):  # At least 2.0 seconds still
                            still_ranges.append((start_idx, frame_idx))
                        start_idx = None
                
                prev_gray = gray
            
            # Handle final still range in window
            if start_idx is not None and window_end - start_idx >= int(fps * 2.0):
                still_ranges.append((start_idx, window_end))
            
            # Update progress
            self.progress = 20 + int((i / frame_count) * 70)
            await asyncio.sleep(0.001)  # Small delay
        
        # Add fallback sampling to catch any missed poses
        fallback_ranges = await self._add_fallback_sampling(cap, fps, frame_count, still_ranges)
        still_ranges.extend(fallback_ranges)
        
        # Remove duplicates and sort
        still_ranges = list(set(still_ranges))
        still_ranges.sort(key=lambda x: x[0])
        
        return still_ranges

    async def _add_fallback_sampling(self, cap, fps, frame_count, existing_ranges) -> List[Tuple[int, int]]:
        """Add fallback sampling to catch poses that might be missed between windows"""
        fallback_ranges = []
        
        # Find gaps between existing ranges and sample them
        if not existing_ranges:
            return fallback_ranges
        
        # Sort existing ranges
        sorted_ranges = sorted(existing_ranges, key=lambda x: x[0])
        
        # Check for gaps and sample them
        for i in range(len(sorted_ranges) - 1):
            current_end = sorted_ranges[i][1]
            next_start = sorted_ranges[i + 1][0]
            gap_size = next_start - current_end
            
            # If gap is significant (> 5 seconds), sample it
            if gap_size > int(fps * 5):
                gap_start = current_end + int(fps * 1)  # Start 1 second after current range
                gap_end = next_start - int(fps * 1)     # End 1 second before next range
                
                if gap_end > gap_start:
                    # Quick motion detection in the gap
                    cap.set(cv2.CAP_PROP_POS_FRAMES, gap_start)
                    prev_gray = None
                    start_idx = None
                    
                    for frame_idx in range(gap_start, gap_end, int(fps / 4)):  # Sample every 0.25 seconds
                        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
                        ret, frame = cap.read()
                        if not ret:
                            break
                        
                        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                        gray = cv2.resize(gray, (320, 240))
                        
                        if prev_gray is not None:
                            diff = cv2.absdiff(gray, prev_gray)
                            motion = np.sum(diff > 10) / diff.size
                            
                            # Look for actual pauses in gaps
                            if motion < 0.03:  # Low motion threshold for pauses
                                if start_idx is None:
                                    start_idx = frame_idx
                            else:
                                if start_idx is not None and frame_idx - start_idx >= int(fps * 1.0):  # At least 1 second pause
                                    fallback_ranges.append((start_idx, frame_idx))
                                start_idx = None
                        
                        prev_gray = gray
                    
                    # Handle final range in gap
                    if start_idx is not None and gap_end - start_idx >= int(fps * 1.0):
                        fallback_ranges.append((start_idx, gap_end))
        
        return fallback_ranges

    def get_progress(self) -> Dict:
        return {
            "status": self.status,
            "progress_percent": self.progress,
            "processed_chunks": 0,
            "total_chunks": 1,
            "current_chunk": 1,
            "error": None
        }

# Global ultra-fast processor
ultra_fast_processor = UltraFastProcessor()
