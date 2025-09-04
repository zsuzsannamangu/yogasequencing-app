#!/usr/bin/env python3
"""
Set up the downloads tracking table for proper download counting.
"""

import asyncio
import os
from dotenv import load_dotenv
from databases import Database

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def setup_downloads_table():
    """Create the downloads tracking table."""
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found in .env file")
        return
    
    database = Database(DATABASE_URL)
    
    try:
        await database.connect()
        print("✅ Connected to database")
        
        # Create downloads table
        create_table_query = """
        CREATE TABLE IF NOT EXISTS downloads (
            id SERIAL PRIMARY KEY,
            sequence_id VARCHAR NOT NULL,
            downloaded_by_user_id VARCHAR,
            download_source VARCHAR NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
        
        await database.execute(create_table_query)
        print("✅ Downloads table created successfully")
        
        # Create indexes
        index_queries = [
            "CREATE INDEX IF NOT EXISTS idx_downloads_sequence_id ON downloads(sequence_id);",
            "CREATE INDEX IF NOT EXISTS idx_downloads_downloaded_by ON downloads(downloaded_by_user_id);",
            "CREATE INDEX IF NOT EXISTS idx_downloads_source ON downloads(download_source);"
        ]
        
        for query in index_queries:
            await database.execute(query)
        
        print("✅ Database indexes created successfully")
        
        # Verify table creation
        table_check = await database.fetch_all("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'downloads' 
            ORDER BY ordinal_position;
        """)
        
        print("\n📊 Downloads table structure:")
        for column in table_check:
            nullable = "NULL" if column['is_nullable'] == 'YES' else "NOT NULL"
            print(f"  {column['column_name']}: {column['data_type']} ({nullable})")
        
    except Exception as e:
        print(f"❌ Error setting up downloads table: {e}")
    finally:
        await database.disconnect()
        print("✅ Database connection closed")

if __name__ == "__main__":
    print("📊 Setting up downloads tracking table...")
    asyncio.run(setup_downloads_table())
    print("\n✨ Downloads table setup complete!")
