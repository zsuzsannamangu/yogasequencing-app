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
from app.routes import upload, detect, silhouettes, sequences

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

# 1) Register API router FIRST (order won’t matter now that prefixes differ)
app.include_router(sequences.router)

# 2) Mount static files under a distinct prefix
app.mount("/sequence-assets", StaticFiles(directory="sequences"), name="sequence-assets")

# Register routers from modular route files
app.include_router(upload.router)
app.include_router(detect.router)
app.include_router(silhouettes.router)
app.include_router(sequences.router)

# Enable CORS for local frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static SVG files (silhouette results)
app.mount("/silhouettes", StaticFiles(directory=SILHOUETTES_DIR), name="silhouettes")

# ──────────────────────────────────────────────────────────────
# Database Lifecycle Events
# ──────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()
