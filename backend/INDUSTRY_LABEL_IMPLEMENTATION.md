# Industry Label Implementation Guide

This guide explains how to implement industry labels for sequences in the Yoga Sequencing App.

## 🗄️ Database Changes

### 1. Run the SQL Migration
Execute the following SQL in your Supabase SQL editor:

```sql
-- Add industry_label column to sequences table
ALTER TABLE sequences 
ADD COLUMN IF NOT EXISTS industry_label VARCHAR DEFAULT 'Yoga';

-- Update existing sequences to have a default industry label
UPDATE sequences 
SET industry_label = 'Yoga' 
WHERE industry_label IS NULL;

-- Create index for better performance on industry label filtering
CREATE INDEX IF NOT EXISTS idx_sequences_industry_label ON sequences(industry_label);
```

### 2. Or Run the Python Script
```bash
cd backend
python add_industry_label_column.py
```

## 🔧 Backend Changes

### Updated Models
- `SequenceCreate` now includes `industryLabel: Optional[str] = 'Yoga'`
- `SequenceResponse` now includes `industryLabel: Optional[str] = 'Yoga'`

### New API Endpoints
- `GET /sequences/industry-labels/` - Get all available industry labels
- `GET /sequences/by-industry/{industry_label}` - Get sequences filtered by industry label

### Updated Endpoints
- `POST /sequences/` - Now saves industry_label to database
- `GET /sequences/` - Now returns industry_label in response
- `GET /sequences/public/` - Now returns industry_label in response
- `GET /sequences/{sequence_id}` - Now returns industry_label in response

## 📱 Frontend Integration

The frontend upload page already includes the industry label field. When a user uploads a video:

1. **Industry Label Selection**: User chooses from predefined labels (Yoga, Pilates, Physical Therapy, etc.)
2. **Data Submission**: The `label` field is sent as `industryLabel` to the backend
3. **Storage**: The industry label is saved in the database alongside other sequence data
4. **Retrieval**: The industry label is returned when fetching sequences

## 🎯 Available Industry Labels

The system currently supports these predefined industry labels:
- Yoga
- Pilates
- Physical Therapy
- Chiropractic
- Dance
- Martial Arts
- Personal Training
- Occupational Therapy

## 🚀 Testing

### Test the New Endpoints
```bash
# Get all industry labels
curl http://localhost:8000/sequences/industry-labels/

# Get sequences by industry
curl http://localhost:8000/sequences/by-industry/Yoga

# Create a sequence with industry label
curl -X POST http://localhost:8000/sequences/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Sequence",
    "description": "Test description",
    "duration": "5m",
    "poseCount": 10,
    "poses": [],
    "industryLabel": "Pilates"
  }'
```

## 🔄 Migration Notes

- **Backward Compatible**: Existing sequences will default to 'Yoga' industry label
- **No Data Loss**: All existing sequence data is preserved
- **Performance**: New index on industry_label for efficient filtering

## 🎉 What's Next?

With industry labels implemented, you can now:
1. **Filter Sequences**: Users can browse sequences by industry
2. **Better Organization**: Content is properly categorized by professional field
3. **Enhanced Search**: More targeted sequence discovery
4. **Analytics**: Track which industries are most popular

The foundation is now in place for more advanced features like industry-specific recommendations and analytics!
