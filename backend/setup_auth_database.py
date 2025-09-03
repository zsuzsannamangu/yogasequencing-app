#!/usr/bin/env python3
"""
Complete database setup script for the Movement Sequencing App.
Creates all necessary tables including users, sequences, and categories.
"""

import asyncio
import os
from dotenv import load_dotenv
from databases import Database

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def setup_auth_database():
    """Create all necessary tables for the app including authentication."""
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found in .env file")
        print("Please create a .env file with your Supabase database URL")
        return
    
    database = Database(DATABASE_URL)
    
    try:
        await database.connect()
        print("✅ Connected to database")
        
        # Create users table for authentication
        create_users_table_query = """
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR PRIMARY KEY,
            email VARCHAR UNIQUE NOT NULL,
            first_name VARCHAR NOT NULL,
            last_name VARCHAR NOT NULL,
            password_hash VARCHAR NOT NULL,
            location VARCHAR,
            bio TEXT,
            business_name VARCHAR,
            business_category VARCHAR,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        await database.execute(create_users_table_query)
        print("✅ Users table created successfully")
        
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
        
        # Create sequences table
        create_sequences_table_query = """
        CREATE TABLE IF NOT EXISTS sequences (
            id VARCHAR PRIMARY KEY,
            name VARCHAR NOT NULL,
            description TEXT,
            duration VARCHAR,
            pose_count INTEGER,
            poses JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            user_id VARCHAR,
            category VARCHAR(100),
            privacy VARCHAR(20) DEFAULT 'private',
            industry_label VARCHAR(50) DEFAULT 'Yoga'
        );
        """
        
        await database.execute(create_sequences_table_query)
        print("✅ Sequences table created successfully")
        
        # Create indexes for better performance
        index_queries = [
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",
            "CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);",
            "CREATE INDEX IF NOT EXISTS idx_sequences_user_id ON sequences(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_sequences_category ON sequences(category);",
            "CREATE INDEX IF NOT EXISTS idx_sequences_privacy ON sequences(privacy);",
            "CREATE INDEX IF NOT EXISTS idx_sequences_created_at ON sequences(created_at);",
            "CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);"
        ]
        
        for query in index_queries:
            await database.execute(query)
        
        print("✅ Database indexes created successfully")
        
        # Insert some default categories
        default_categories = [
            ('Yoga', 'Traditional yoga sequences and flows'),
            ('Pilates', 'Pilates exercises and movement patterns'),
            ('Dance', 'Dance choreography and movement sequences'),
            ('Fitness', 'General fitness and workout routines'),
            ('Physical Therapy', 'Therapeutic movement sequences'),
            ('Occupational Therapy', 'Occupational therapy exercises'),
            ('Martial Arts', 'Martial arts forms and techniques'),
            ('Sports Training', 'Sports-specific training sequences')
        ]
        
        for name, description in default_categories:
            try:
                await database.execute(
                    "INSERT INTO categories (name, description) VALUES (:name, :description) ON CONFLICT (name) DO NOTHING",
                    {"name": name, "description": description}
                )
            except Exception as e:
                print(f"ℹ️ Category '{name}' already exists or couldn't be inserted: {e}")
        
        print("✅ Default categories inserted successfully")
        
    except Exception as e:
        print(f"❌ Error setting up database: {e}")
    finally:
        await database.disconnect()
        print("✅ Database connection closed")

if __name__ == "__main__":
    print("🚀 Setting up complete database for Yoga Sequencing App...")
    print("This will create users, sequences, and categories tables")
    asyncio.run(setup_auth_database())
    print("✨ Database setup complete!")
    print("\n📝 Next steps:")
    print("1. Make sure your .env file has the correct Supabase credentials")
    print("2. Start your backend server: python -m uvicorn app.main:app --reload --port 8000")
    print("3. Test the authentication endpoints")
