-- Create sequences table for the Yoga Sequencing App
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS sequences (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    duration VARCHAR,
    pose_count INTEGER,
    poses JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id VARCHAR
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_sequences_user_id ON sequences(user_id);
CREATE INDEX IF NOT EXISTS idx_sequences_created_at ON sequences(created_at);

-- Add some sample data for testing (optional)
-- INSERT INTO sequences (id, name, description, duration, pose_count, poses, user_id) VALUES
-- ('seq_20241201_120000_12345', 'Sample Morning Flow', 'A gentle morning yoga sequence', '15 min', 8, '[]', NULL);
