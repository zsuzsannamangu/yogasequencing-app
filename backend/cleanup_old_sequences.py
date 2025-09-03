#!/usr/bin/env python3
"""
Simple script to clean up old sequences without user_id.
"""

import asyncio
import os
from dotenv import load_dotenv
from databases import Database

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def cleanup_old_sequences():
    """Delete old sequences that don't have a user_id."""
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found in .env file")
        return
    
    database = Database(DATABASE_URL)
    
    try:
        await database.connect()
        print("✅ Connected to database")
        
        # Check what we have before cleanup
        print("📊 Current sequences:")
        sequences = await database.fetch_all(
            "SELECT id, name, user_id, privacy FROM sequences ORDER BY created_at DESC"
        )
        
        for seq in sequences:
            user_status = "✅ Has user" if seq['user_id'] else "❌ No user"
            print(f"  {seq['name']} - {user_status} - {seq['privacy']}")
        
        # Delete sequences without user_id
        print("\n🧹 Cleaning up sequences without user_id...")
        delete_result = await database.execute(
            "DELETE FROM sequences WHERE user_id IS NULL"
        )
        print(f"✅ Deleted {delete_result} orphaned sequences")
        
        # Show what's left
        print("\n📊 Remaining sequences:")
        remaining = await database.fetch_all(
            "SELECT id, name, user_id, privacy FROM sequences ORDER BY created_at DESC"
        )
        
        for seq in remaining:
            print(f"  {seq['name']} - User: {seq['user_id'][:8]}... - {seq['privacy']}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await database.disconnect()
        print("✅ Database connection closed")

if __name__ == "__main__":
    print("🧹 Cleaning up old sequences without user_id...")
    asyncio.run(cleanup_old_sequences())
    print("\n✨ Cleanup complete!")
    print("Now test your app:")
    print("1. Login as User1 - should only see User1's sequences")
    print("2. Login as User2 - should only see User2's sequences")
    print("3. Browse page should show all public sequences")
