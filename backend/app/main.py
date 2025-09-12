"""
Main FastAPI entry point for the Yoga Sequencing App.

Handles:
- File uploads (via app.routes.upload)
- Pose detection (via app.routes.detect)
- Silhouette extraction (via app.routes.silhouettes)
- Serves static SVG files

Database connects to Supabase on startup and disconnects on shutdown.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import database
from app.routes import upload, detect, silhouettes, sequences, auth, contact, long_video, fast_upload

# ──────────────────────────────────────────────────────────────
# Global Constants & Directory Setup
# ──────────────────────────────────────────────────────────────

UPLOAD_DIR = "uploads"
FRAMES_DIR = "frames"
SILHOUETTES_DIR = "silhouettes"
POSES_DIR = "poses"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(FRAMES_DIR, exist_ok=True)
os.makedirs(SILHOUETTES_DIR, exist_ok=True)
os.makedirs(POSES_DIR, exist_ok=True)

# ──────────────────────────────────────────────────────────────
# FastAPI App Setup
# ──────────────────────────────────────────────────────────────

app = FastAPI()

@app.get("/health")
async def health_check():
    """Simple health check endpoint"""
    return {"status": "ok", "message": "Backend is running"}

# Enable CORS FIRST (before mounting static files)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth.router)
app.include_router(sequences.router)
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(fast_upload.router, prefix="/fast", tags=["fast-upload"])
app.include_router(detect.router)
app.include_router(silhouettes.router)
app.include_router(contact.router)
app.include_router(long_video.router, prefix="/long-video", tags=["long-video"])

# Mount static files AFTER CORS is configured
app.mount("/sequence-assets", StaticFiles(directory="sequences"), name="sequence-assets")
app.mount("/silhouettes", StaticFiles(directory=SILHOUETTES_DIR), name="silhouettes")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ──────────────────────────────────────────────────────────────
# Database Lifecycle Events
# ──────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()
