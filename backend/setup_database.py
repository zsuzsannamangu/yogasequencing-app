#!/usr/bin/env python3
"""
Database setup script for the Movement Sequencing App.
Creates the sequences and categories tables if they don't exist.
"""

import asyncio
import os
from dotenv import load_dotenv
from databases import Database

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def setup_database():
    """Create the sequences and categories tables if they don't exist."""
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found in .env file")
        return
    
    database = Database(DATABASE_URL)
    
    try:
        await database.connect()
        print("✅ Connected to database")
        
        # Create categories table
        create_categories_table_query = """
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
        
        await database.execute(create_categories_table_query)
        print("✅ Categories table created successfully")
        
        # Create sequences table with category column
        create_sequences_table_query = """
        CREATE TABLE IF NOT EXISTS sequences (
            id VARCHAR PRIMARY KEY,
            name VARCHAR NOT NULL,
            description TEXT,
            duration VARCHAR,
            pose_count INTEGER,
            poses JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            category VARCHAR(100)
        );
        """
        
        await database.execute(create_sequences_table_query)
        print("✅ Sequences table created successfully")
        
        # Add category column to existing sequences table if it doesn't exist
        try:
            add_category_column_query = """
            ALTER TABLE sequences ADD COLUMN IF NOT EXISTS category VARCHAR(100);
            """
            await database.execute(add_category_column_query)
            print("✅ Category column added to sequences table")
        except Exception as e:
            print(f"ℹ️ Category column already exists or couldn't be added: {e}")
        
        # Create indexes
        index_queries = [
            "CREATE INDEX IF NOT EXISTS idx_sequences_category ON sequences(category);",
            "CREATE INDEX IF NOT EXISTS idx_sequences_created_at ON sequences(created_at);",
            "CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);"
        ]
        
        for query in index_queries:
            await database.execute(query)
        
        print("✅ Database indexes created successfully")
        
    except Exception as e:
        print(f"❌ Error setting up database: {e}")
    finally:
        await database.disconnect()
        print("✅ Database connection closed")

if __name__ == "__main__":
    print("🚀 Setting up database for Yoga Sequencing App...")
    asyncio.run(setup_database())
    print("✨ Database setup complete!")
