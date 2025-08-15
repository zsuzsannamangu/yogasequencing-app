-- Add industry_label column to sequences table
-- Run this in your Supabase SQL editor

ALTER TABLE sequences 
ADD COLUMN IF NOT EXISTS industry_label VARCHAR DEFAULT 'Yoga';

-- Update existing sequences to have a default industry label
UPDATE sequences 
SET industry_label = 'Yoga' 
WHERE industry_label IS NULL;

-- Create index for better performance on industry label filtering
CREATE INDEX IF NOT EXISTS idx_sequences_industry_label ON sequences(industry_label);
