-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category column to sequences table if it doesn't exist
ALTER TABLE sequences ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Add foreign key constraint (optional - for referential integrity)
-- ALTER TABLE sequences ADD CONSTRAINT fk_sequences_category 
--     FOREIGN KEY (category) REFERENCES categories(name) ON DELETE SET NULL;

-- Create index on category for better performance
CREATE INDEX IF NOT EXISTS idx_sequences_category ON sequences(category);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Insert some default categories (optional)
-- INSERT INTO categories (name, description) VALUES 
--     ('Yoga', 'Traditional yoga sequences'),
--     ('Pilates', 'Pilates exercises and flows'),
--     ('Dance', 'Dance choreography and movement'),
--     ('Fitness', 'General fitness and workout routines')
-- ON CONFLICT (name) DO NOTHING;
