#!/usr/bin/env python3
"""
Script to add privacy column to sequences table.
Run this to enable privacy functionality.
"""

import asyncio
import os
from dotenv import load_dotenv
from databases import Database

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def add_privacy_column():
    """Add privacy column to sequences table."""
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found in .env file")
        return
    
    database = Database(DATABASE_URL)
    
    try:
        await database.connect()
        print("✅ Connected to database")
        
        # Add privacy column
        add_privacy_query = """
        ALTER TABLE sequences ADD COLUMN IF NOT EXISTS privacy VARCHAR(20) DEFAULT 'private';
        """
        await database.execute(add_privacy_query)
        print("✅ Privacy column added to sequences table")
        
        # Create index for privacy
        create_index_query = """
        CREATE INDEX IF NOT EXISTS idx_sequences_privacy ON sequences(privacy);
        """
        await database.execute(create_index_query)
        print("✅ Privacy index created")
        
        # Update existing sequences to have privacy = 'private'
        update_existing_query = """
        UPDATE sequences SET privacy = 'private' WHERE privacy IS NULL;
        """
        await database.execute(update_existing_query)
        print("✅ Existing sequences updated with default privacy")
        
        print("🎉 Privacy column setup complete!")
        
    except Exception as e:
        print(f"❌ Error adding privacy column: {e}")
    finally:
        await database.disconnect()
        print("✅ Database connection closed")

if __name__ == "__main__":
    print("🔧 Adding privacy column to sequences table...")
    asyncio.run(add_privacy_column())
    print("✨ Privacy column setup complete!")
