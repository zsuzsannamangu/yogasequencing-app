# backend/models.py

# SQLAlchemy table definitions for Supabase PostgreSQL
from sqlalchemy import Table, Column, Integer, String, ForeignKey, DateTime, MetaData
from sqlalchemy.sql import func

metadata = MetaData()

# Stores each uploaded video and its processing status
videos = Table(
    "videos",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("filename", String, nullable=False),
    Column("status", String, default="uploaded"),  # e.g., uploaded, processing, done
    Column("total_frames", Integer),
    Column("created_at", DateTime, server_default=func.now()),
)

# Stores each detected pose for a video
poses = Table(
    "poses",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("video_id", ForeignKey("videos.id")),
    Column("timestamp", String),
    Column("pose_svg_url", String),  # if you upload to storage
    Column("keypoints_json", String),
    Column("created_at", DateTime, server_default=func.now()),
)
