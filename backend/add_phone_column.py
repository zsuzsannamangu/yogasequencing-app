#!/usr/bin/env python3
"""
Script to add the phone column to the users table if it doesn't exist.
This ensures the column is available for profile updates.
"""

import asyncio
import databases
import os
from dotenv import load_dotenv

load_dotenv()

async def add_phone_column():
    """Add phone column to users table if it doesn't exist."""
    database = databases.Database(os.getenv('DATABASE_URL'))
    await database.connect()
    
    try:
        # Add the phone column if it doesn't exist
        await database.execute('''
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS phone TEXT
        ''')
        print('✅ Phone column added successfully!')
        
        # Verify it exists
        result = await database.fetch_all('''
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'phone'
        ''')
        
        if result:
            print('✅ Phone column confirmed to exist:')
            for row in result:
                print(f'   {row["column_name"]}: {row["data_type"]}')
        else:
            print('❌ Phone column still not found')
            
    except Exception as e:
        print(f'❌ Error adding phone column: {e}')
    
    await database.disconnect()

if __name__ == "__main__":
    asyncio.run(add_phone_column())
