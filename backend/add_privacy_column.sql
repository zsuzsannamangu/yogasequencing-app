-- Add privacy column to sequences table
ALTER TABLE sequences ADD COLUMN IF NOT EXISTS privacy VARCHAR(20) DEFAULT 'private';

-- Create index for privacy field
CREATE INDEX IF NOT EXISTS idx_sequences_privacy ON sequences(privacy);
