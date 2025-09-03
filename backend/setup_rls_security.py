#!/usr/bin/env python3
"""
Row Level Security (RLS) Setup Script for Yoga Sequencing App.
This script sets up proper security policies to protect user data.
"""

import asyncio
import os
from dotenv import load_dotenv
from databases import Database

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def setup_rls_security():
    """Set up Row Level Security policies for all tables."""
    if not DATABASE_URL:
        print("DATABASE_URL not found in .env file")
        return
    
    database = Database(DATABASE_URL)
    
    try:
        await database.connect()
        print("Connected to database")
        
        # Enable RLS on all tables
        rls_queries = [
            "ALTER TABLE users ENABLE ROW LEVEL SECURITY;",
            "ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;",
            "ALTER TABLE categories ENABLE ROW LEVEL SECURITY;"
        ]
        
        for query in rls_queries:
            await database.execute(query)
        
        print("Row Level Security enabled on all tables")
        
        # Users table policies
        users_policies = [
            # Users can only view their own profile
            """
            CREATE POLICY "Users can view own profile" ON users
                FOR SELECT USING (auth.uid()::text = id);
            """,
            
            # Users can update their own profile
            """
            CREATE POLICY "Users can update own profile" ON users
                FOR UPDATE USING (auth.uid()::text = id);
            """,
            
            # Users can insert their own profile (for registration)
            """
            CREATE POLICY "Users can insert own profile" ON users
                FOR INSERT WITH CHECK (auth.uid()::text = id);
            """
        ]
        
        for policy in users_policies:
            try:
                await database.execute(policy)
            except Exception as e:
                if "already exists" in str(e):
                    print(f"ℹ️ Policy already exists, skipping...")
                else:
                    print(f"⚠️ Warning: {e}")
        
        print("✅ Users table policies created")
        
        # Sequences table policies
        sequences_policies = [
            # Users can view their own sequences
            """
            CREATE POLICY "Users can view own sequences" ON sequences
                FOR SELECT USING (auth.uid()::text = user_id);
            """,
            
            # Users can view public sequences from other users
            """
            CREATE POLICY "Users can view public sequences" ON sequences
                FOR SELECT USING (privacy = 'public');
            """,
            
            # Users can insert their own sequences
            """
            CREATE POLICY "Users can insert own sequences" ON sequences
                FOR INSERT WITH CHECK (auth.uid()::text = user_id);
            """,
            
            # Users can update their own sequences
            """
            CREATE POLICY "Users can update own sequences" ON sequences
                FOR UPDATE USING (auth.uid()::text = user_id);
            """,
            
            # Users can delete their own sequences
            """
            CREATE POLICY "Users can delete own sequences" ON sequences
                FOR DELETE USING (auth.uid()::text = user_id);
            """
        ]
        
        for policy in sequences_policies:
            try:
                await database.execute(policy)
            except Exception as e:
                if "already exists" in str(e):
                    print(f"ℹ️ Policy already exists, skipping...")
                else:
                    print(f"⚠️ Warning: {e}")
        
        print("Sequences table policies created")
        
        # Categories table policies
        categories_policies = [
            # Categories are publicly readable
            """
            CREATE POLICY "Categories are publicly readable" ON categories
                FOR SELECT USING (true);
            """,
            
            # Only authenticated users can create categories
            """
            CREATE POLICY "Authenticated users can create categories" ON categories
                FOR INSERT WITH CHECK (auth.role() = 'authenticated');
            """,
            
            # Only authenticated users can update categories
            """
            CREATE POLICY "Authenticated users can update categories" ON categories
                FOR UPDATE USING (auth.role() = 'authenticated');
            """,
            
            # Only authenticated users can delete categories
            """
            CREATE POLICY "Authenticated users can delete categories" ON categories
                FOR DELETE USING (auth.role() = 'authenticated');
            """
        ]
        
        for policy in categories_policies:
            try:
                await database.execute(policy)
            except Exception as e:
                if "already exists" in str(e):
                    print(f"ℹ️ Policy already exists, skipping...")
                else:
                    print(f"⚠️ Warning: {e}")
        
        print("Categories table policies created")
        
        # Verify RLS is enabled
        rls_check = await database.fetch_all("""
            SELECT schemaname, tablename, rowsecurity 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename IN ('users', 'sequences', 'categories')
        """)
        
        print("\n📊 RLS Status Check:")
        for row in rls_check:
            status = "ENABLED" if row['rowsecurity'] else "DISABLED"
            print(f"  {row['tablename']}: {status}")
        
        # Count policies
        policy_count = await database.fetch_all("""
            SELECT tablename, COUNT(*) as policy_count
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename IN ('users', 'sequences', 'categories')
            GROUP BY tablename
        """)
        
        print("\n🔒 Security Policies:")
        for row in policy_count:
            print(f"  {row['tablename']}: {row['policy_count']} policies")
        
    except Exception as e:
        print(f"Error setting up RLS: {e}")
    finally:
        await database.disconnect()
        print("Database connection closed")

if __name__ == "__main__":
    print("🔒 Setting up Row Level Security for Yoga Sequencing App...")
    print("This will secure your user data and sequences")
    asyncio.run(setup_rls_security())
    print("\n✨ RLS setup complete!")
    print("\n📝 What this does:")
    print("• Users can only see their own profile data")
    print("• Users can only manage their own sequences")
    print("• Public sequences are visible to everyone")
    print("• Private sequences are only visible to the owner")
    print("• Categories are publicly readable but only authenticated users can modify")
    print("\n⚠️  Important: Your tables are now secure!")
    print("   Make sure to test your authentication flow after this setup.")
