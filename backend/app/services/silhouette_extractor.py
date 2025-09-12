import os
import cv2
import numpy as np
import torch
import subprocess
import asyncio
from PIL import Image
from torchvision import models, transforms
from skimage.measure import label, regionprops
from typing import List, Tuple, Dict
import logging

logger = logging.getLogger(__name__)

class OptimizedSilhouetteExtractor:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._load_model()
        
    def _load_model(self):
        """Load DeepLabV3 model once"""
        try:
            self.deeplab_model = models.segmentation.deeplabv3_resnet101(pretrained=True)
            self.deeplab_model.to(self.device)
            self.deeplab_model.eval()
            logger.info(f"DeepLabV3 model loaded on {self.device}")
        except Exception as e:
            logger.error(f"Failed to load DeepLabV3 model: {e}")
            self.deeplab_model = None
    
    def preprocess_image(self, image: Image.Image) -> torch.Tensor:
        """Preprocess image for DeepLabV3"""
        preprocess = transforms.Compose([
            transforms.Resize(520),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        return preprocess(image).unsqueeze(0).to(self.device)
    
    def extract_person_mask(self, image: Image.Image) -> np.ndarray:
        """Extract person mask using DeepLabV3"""
        if self.deeplab_model is None:
            raise ValueError("DeepLabV3 model not loaded")
        
        input_tensor = self.preprocess_image(image)
        
        with torch.no_grad():
            output = self.deeplab_model(input_tensor)["out"][0]
        
        mask = output.argmax(0).byte().cpu().numpy()
        person_mask = (mask == 15).astype(np.uint8) * 255  # Person class = 15
        
        return person_mask
    
    def clean_mask(self, mask: np.ndarray) -> np.ndarray:
        """Clean and refine the person mask"""
        # Apply Gaussian blur to smooth edges
        blurred = cv2.GaussianBlur(mask, (5, 5), 0)
        
        # Threshold to create binary mask
        _, thresh = cv2.threshold(blurred, 30, 255, cv2.THRESH_BINARY)
        
        # Morphological operations to clean up the mask
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        
        # Find the largest connected component (the person)
        labels = label(closed, connectivity=2)
        props = regionprops(labels)
        
        if not props:
            return np.zeros_like(mask)
        
        # Get the largest component
        largest = max(props, key=lambda x: x.area)
        largest_mask = (labels == largest.label).astype(np.uint8) * 255
        
        return largest_mask
    
    async def extract_silhouette_from_frame(self, video_path: str, frame_number: int, 
                                          output_dir: str, silhouette_index: int) -> str:
        """Extract silhouette from a specific frame"""
        try:
            # Open video and seek to specific frame
            cap = cv2.VideoCapture(video_path)
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
            ret, frame = cap.read()
            cap.release()
            
            if not ret:
                raise ValueError(f"Could not read frame {frame_number}")
            
            # Convert to PIL Image
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(frame_rgb)
            
            # Extract person mask
            person_mask = self.extract_person_mask(pil_image)
            
            # Clean the mask
            cleaned_mask = self.clean_mask(person_mask)
            
            # Save as PGM for potrace
            pgm_path = os.path.join(output_dir, f"pose_{silhouette_index}.pgm")
            cv2.imwrite(pgm_path, 255 - cleaned_mask)  # Invert for potrace
            
            # Convert to SVG using potrace
            svg_path = os.path.join(output_dir, f"pose_{silhouette_index}.svg")
            result = subprocess.run([
                "potrace", pgm_path, "--svg", "-o", svg_path
            ], capture_output=True, text=True)
            
            if result.returncode != 0:
                logger.warning(f"Potrace failed for pose_{silhouette_index}: {result.stderr}")
                return None
            
            # Clean up PGM file
            if os.path.exists(pgm_path):
                os.remove(pgm_path)
            
            return f"pose_{silhouette_index}.svg"
            
        except Exception as e:
            logger.error(f"Error extracting silhouette from frame {frame_number}: {e}")
            return None
    
    async def extract_silhouettes_batch(self, video_path: str, still_ranges: List[Tuple[int, int]], 
                                      output_dir: str, max_concurrent: int = 3, 
                                      progress_callback=None) -> List[str]:
        """Extract silhouettes from multiple still ranges concurrently with progress reporting"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Create tasks for each still range
        tasks = []
        for i, (start_frame, end_frame) in enumerate(still_ranges):
            # Use middle frame of the still range
            mid_frame = (start_frame + end_frame) // 2
            task = self.extract_silhouette_from_frame(video_path, mid_frame, output_dir, i)
            tasks.append(task)
        
        total_tasks = len(tasks)
        silhouette_files = []
        
        # Process in batches to avoid overwhelming the system
        for i in range(0, len(tasks), max_concurrent):
            batch = tasks[i:i + max_concurrent]
            batch_results = await asyncio.gather(*batch, return_exceptions=True)
            
            for result in batch_results:
                if isinstance(result, str) and result:
                    silhouette_files.append(result)
                elif isinstance(result, Exception):
                    logger.error(f"Batch processing error: {result}")
            
            # Report progress
            completed = min(i + max_concurrent, total_tasks)
            progress_percent = int((completed / total_tasks) * 100)
            
            if progress_callback:
                progress_callback({
                    "progress": progress_percent,
                    "completed": completed,
                    "total": total_tasks,
                    "message": f"Extracting silhouettes... {completed}/{total_tasks} completed"
                })
            
            # Small delay between batches
            await asyncio.sleep(0.1)
        
        return silhouette_files

# Global extractor instance
silhouette_extractor = OptimizedSilhouetteExtractor()
