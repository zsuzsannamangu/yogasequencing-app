#!/usr/bin/env python3
"""
Script to add industry_label column to sequences table.
Run this after updating your database schema.
"""

import asyncio
import os
from dotenv import load_dotenv
from app.database import database

async def add_industry_label_column():
    """Add industry_label column to sequences table"""
    try:
        # Connect to database
        await database.connect()
        print("Connected to database")
        
        # Add industry_label column
        add_column_query = """
        ALTER TABLE sequences 
        ADD COLUMN IF NOT EXISTS industry_label VARCHAR DEFAULT 'Yoga';
        """
        
        await database.execute(add_column_query)
        print("Added industry_label column")
        
        # Update existing sequences to have default industry label
        update_query = """
        UPDATE sequences 
        SET industry_label = 'Yoga' 
        WHERE industry_label IS NULL;
        """
        
        await database.execute(update_query)
        print("Updated existing sequences with default industry label")
        
        # Create index for better performance
        index_query = """
        CREATE INDEX IF NOT EXISTS idx_sequences_industry_label 
        ON sequences(industry_label);
        """
        
        await database.execute(index_query)
        print("Created index on industry_label column")
        
        print("✅ Successfully added industry_label column to sequences table")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await database.disconnect()
        print("Disconnected from database")

if __name__ == "__main__":
    # Load environment variables
    load_dotenv()
    
    # Run the migration
    asyncio.run(add_industry_label_column())
