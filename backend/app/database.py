# Initializes the database connection using Supabase credentials from .env

import os
from databases import Database
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

DATABASE_URL = os.getenv("DATABASE_URL")
database = Database(DATABASE_URL)
