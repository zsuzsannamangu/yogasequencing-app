import os
import cv2
import numpy as np
import json
import asyncio
from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class VideoChunk:
    start_frame: int
    end_frame: int
    start_time: float
    end_time: float
    chunk_index: int

@dataclass
class ProcessingProgress:
    total_chunks: int
    processed_chunks: int
    current_chunk: int
    status: str
    error: Optional[str] = None

class LongVideoProcessor:
    def __init__(self, chunk_duration_seconds: int = 60):  # 1-minute chunks for faster processing
        self.chunk_duration_seconds = chunk_duration_seconds
        self.progress = ProcessingProgress(0, 0, 0, "initializing")
    
    def get_video_info(self, video_path: str) -> Dict:
        """Get video metadata without loading entire file"""
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError("Cannot open video file")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        cap.release()
        
        return {
            "fps": fps,
            "frame_count": frame_count,
            "duration": duration,
            "width": width,
            "height": height
        }
    
    def create_video_chunks(self, video_path: str) -> List[VideoChunk]:
        """Split video into manageable chunks"""
        video_info = self.get_video_info(video_path)
        fps = video_info["fps"]
        frame_count = video_info["frame_count"]
        duration = video_info["duration"]
        
        if fps <= 0:
            raise ValueError("Invalid video FPS")
        
        chunks = []
        frames_per_chunk = int(fps * self.chunk_duration_seconds)
        
        for i in range(0, frame_count, frames_per_chunk):
            start_frame = i
            end_frame = min(i + frames_per_chunk, frame_count)
            start_time = start_frame / fps
            end_time = end_frame / fps
            
            chunks.append(VideoChunk(
                start_frame=start_frame,
                end_frame=end_frame,
                start_time=start_time,
                end_time=end_time,
                chunk_index=len(chunks)
            ))
        
        self.progress.total_chunks = len(chunks)
        return chunks
    
    async def process_chunk_for_motion(self, video_path: str, chunk: VideoChunk) -> List[Tuple[int, int]]:
        """Process a single chunk to find still ranges - optimized for speed"""
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError("Cannot open video file")
        
        # Set to start of chunk
        cap.set(cv2.CAP_PROP_POS_FRAMES, chunk.start_frame)
        
        still_ranges = []
        prev_gray = None
        start_idx = None
        frame_idx = chunk.start_frame
        
        # Skip frames for faster processing (every 3rd frame)
        frame_skip = 3
        
        # Process only this chunk with frame skipping
        while frame_idx < chunk.end_frame:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Skip frames for faster processing
            if (frame_idx - chunk.start_frame) % frame_skip != 0:
                frame_idx += 1
                continue
            
            # Resize frame for faster processing
            small_frame = cv2.resize(frame, (320, 240))
            gray = cv2.cvtColor(small_frame, cv2.COLOR_BGR2GRAY)
            
            if prev_gray is not None:
                diff = cv2.absdiff(gray, prev_gray)
                motion = np.sum(diff > 15) / diff.size  # Higher threshold for resized frame
                
                if motion < 0.03:  # Still threshold (adjusted for resized frame)
                    if start_idx is None:
                        start_idx = frame_idx
                else:
                    if start_idx is not None and frame_idx - start_idx >= 15:  # Longer minimum still duration
                        still_ranges.append((start_idx, frame_idx))
                    start_idx = None
            
            prev_gray = gray
            frame_idx += 1
        
        # Handle case where video ends while still
        if start_idx is not None and frame_idx - start_idx >= 15:
            still_ranges.append((start_idx, frame_idx))
        
        cap.release()
        return still_ranges
    
    async def process_long_video(self, video_path: str, output_dir: str) -> Dict:
        """Process a long video in chunks"""
        try:
            self.progress.status = "analyzing_video"
            self.progress.progress = 5
            
            # Create output directory
            os.makedirs(output_dir, exist_ok=True)
            
            # Get video info and create chunks
            video_info = self.get_video_info(video_path)
            chunks = self.create_video_chunks(video_path)
            
            logger.info(f"Processing {len(chunks)} chunks for video: {video_path}")
            self.progress.status = "processing_chunks"
            self.progress.progress = 10
            
            all_still_ranges = []
            
            # Process each chunk with better progress tracking
            for i, chunk in enumerate(chunks):
                self.progress.current_chunk = i + 1
                logger.info(f"Processing chunk {i + 1}/{len(chunks)}")
                
                # Update progress based on chunk completion
                chunk_progress = 10 + (i / len(chunks)) * 70  # 10% to 80%
                self.progress.progress = int(chunk_progress)
                
                still_ranges = await self.process_chunk_for_motion(video_path, chunk)
                all_still_ranges.extend(still_ranges)
                
                self.progress.processed_chunks = i + 1
                logger.info(f"Chunk {i + 1} completed. Found {len(still_ranges)} still ranges. Progress: {int(chunk_progress)}%")
                
                # Small delay to prevent overwhelming the system
                await asyncio.sleep(0.1)
            
            # Merge overlapping ranges
            self.progress.progress = 85
            self.progress.status = "merging_ranges"
            merged_ranges = self._merge_still_ranges(all_still_ranges)
            
            self.progress.status = "completed"
            self.progress.progress = 100
            
            logger.info(f"Video processing completed. Found {len(merged_ranges)} total still ranges")
            
            return {
                "success": True,
                "still_ranges": merged_ranges,
                "total_ranges": len(merged_ranges),
                "video_info": video_info,
                "chunks_processed": len(chunks)
            }
            
        except Exception as e:
            logger.error(f"Error processing long video: {str(e)}")
            self.progress.status = "error"
            self.progress.error = str(e)
            return {
                "success": False,
                "error": str(e)
            }
    
    def _merge_still_ranges(self, ranges: List[Tuple[int, int]]) -> List[Tuple[int, int]]:
        """Merge overlapping still ranges"""
        if not ranges:
            return []
        
        # Sort by start frame
        sorted_ranges = sorted(ranges, key=lambda x: x[0])
        merged = [sorted_ranges[0]]
        
        for current in sorted_ranges[1:]:
            last = merged[-1]
            
            # If ranges overlap or are close (within 30 frames), merge them
            if current[0] <= last[1] + 30:
                merged[-1] = (last[0], max(last[1], current[1]))
            else:
                merged.append(current)
        
        return merged
    
    def get_progress(self) -> Dict:
        """Get current processing progress"""
        progress_percent = 0
        if self.progress.total_chunks > 0:
            progress_percent = (self.progress.processed_chunks / self.progress.total_chunks) * 100
        
        return {
            "status": self.progress.status,
            "progress_percent": round(progress_percent, 2),
            "processed_chunks": self.progress.processed_chunks,
            "total_chunks": self.progress.total_chunks,
            "current_chunk": self.progress.current_chunk,
            "error": self.progress.error
        }

# Global processor instance
video_processor = LongVideoProcessor()
