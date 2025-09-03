#!/usr/bin/env python3
"""
Fix RLS policies to handle sequences without user_id properly.
"""

import asyncio
import os
from dotenv import load_dotenv
from databases import Database

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def fix_rls_policies():
    """Fix RLS policies to properly handle sequences without user_id."""
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found in .env file")
        return
    
    database = Database(DATABASE_URL)
    
    try:
        await database.connect()
        print("✅ Connected to database")
        
        # First, let's clean up old sequences without user_id
        print("🧹 Cleaning up old sequences without user_id...")
        
        # Delete sequences that have no user_id (these are old/orphaned)
        delete_result = await database.execute(
            "DELETE FROM sequences WHERE user_id IS NULL"
        )
        print(f"✅ Deleted {delete_result} orphaned sequences")
        
        # Drop the old "Users can view public sequences" policy
        print("🔄 Updating RLS policies...")
        
        try:
            await database.execute(
                'DROP POLICY IF EXISTS "Users can view public sequences" ON sequences'
            )
            print("✅ Dropped old public sequences policy")
        except Exception as e:
            print(f"ℹ️ Policy might not exist: {e}")
        
        # Create a new policy that allows viewing public sequences from anyone
        new_public_policy = """
        CREATE POLICY "Users can view public sequences from anyone" ON sequences
            FOR SELECT USING (
                privacy = 'public' AND user_id IS NOT NULL
            );
        """
        
        await database.execute(new_public_policy)
        print("✅ Created policy for public sequences from anyone")
        
        # Verify the fix
        print("\n📊 Verifying the fix...")
        
        # Check remaining sequences
        sequences = await database.fetch_all(
            "SELECT id, name, user_id, privacy FROM sequences ORDER BY created_at DESC LIMIT 5"
        )
        
        print("Remaining sequences:")
        for seq in sequences:
            print(f"  ID: {seq['id']}, Name: {seq['name']}, User ID: {seq['user_id']}, Privacy: {seq['privacy']}")
        
        # Check policies
        policies = await database.fetch_all('''
            SELECT policyname, cmd, qual 
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'sequences'
            AND cmd = 'SELECT'
        ''')
        
        print("\nCurrent SELECT policies:")
        for policy in policies:
            print(f"  {policy['policyname']}: {policy['qual']}")
        
    except Exception as e:
        print(f"❌ Error fixing RLS policies: {e}")
    finally:
        await database.disconnect()
        print("✅ Database connection closed")

if __name__ == "__main__":
    print("🔧 Fixing RLS policies for sequences...")
    print("This will:")
    print("1. Delete old sequences without user_id")
    print("2. Update RLS policy to only show public sequences with valid user_id")
    asyncio.run(fix_rls_policies())
    print("\n✨ RLS policies fixed!")
    print("Now users should only see their own sequences + public sequences from other users.")
