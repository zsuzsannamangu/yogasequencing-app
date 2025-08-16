# backend/models.py

# SQLAlchemy table definitions for Supabase PostgreSQL
from sqlalchemy import Table, Column, Integer, String, ForeignKey, DateTime, MetaData, Boolean
from sqlalchemy.sql import func

metadata = MetaData()

# User authentication and profile data
users = Table(
    "users",
    metadata,
    Column("id", String, primary_key=True),  # UUID from Supabase auth
    Column("email", String, unique=True, nullable=False),
    Column("first_name", String, nullable=False),
    Column("last_name", String, nullable=False),
    Column("password_hash", String, nullable=False),  # Will be handled by Supabase auth
    Column("location", String),
    Column("bio", String),
    Column("business_name", String),
    Column("business_category", String),
    Column("is_active", Boolean, default=True),
    Column("created_at", DateTime, server_default=func.now()),
    Column("updated_at", DateTime, server_default=func.now(), onupdate=func.now()),
)

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
