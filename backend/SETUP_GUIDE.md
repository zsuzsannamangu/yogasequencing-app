# 🚀 Authentication Setup Guide

This guide will help you set up the complete authentication system for your Yoga Sequencing App.

## 📋 Prerequisites

1. **Supabase Account**: You need a Supabase project set up
2. **Python Environment**: Make sure your backend virtual environment is activated

## 🔧 Step 1: Environment Variables Setup

### 1.1 Create `.env` file
Create a `.env` file in the `backend/` directory with the following content:

```env
# Supabase Configuration
# Get these values from your Supabase project dashboard

# Project URL (found in Settings > API)
SUPABASE_URL=https://your-project-id.supabase.co

# Anon/Public key (found in Settings > API)
SUPABASE_ANON_KEY=your-anon-key-here

# Service Role key (found in Settings > API) - Keep this secret!
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Secret (found in Settings > API > JWT Settings)
SUPABASE_JWT_SECRET=your-jwt-secret-here

# Database Connection (found in Settings > Database)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres
```

### 1.2 Get Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
   - **JWT Secret** → `SUPABASE_JWT_SECRET`

5. Go to **Settings** → **Database**
6. Copy the **Connection string** → `DATABASE_URL`
   - Replace `[YOUR-PASSWORD]` with your database password
   - Replace `[YOUR-PROJECT-ID]` with your project ID

## 🗄️ Step 2: Database Migration

### 2.1 Run the Database Setup Script

```bash
# Make sure you're in the backend directory
cd backend

# Activate your virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run the database setup script
python setup_auth_database.py
```

This script will:
- ✅ Create the `users` table for authentication
- ✅ Create the `sequences` table for storing yoga sequences
- ✅ Create the `categories` table for organizing sequences
- ✅ Add all necessary indexes for performance
- ✅ Insert default categories

### 2.2 Set Up Row Level Security (RLS)

**IMPORTANT**: By default, Supabase tables are publicly accessible. Run this to secure your data:

```bash
# Set up Row Level Security policies
python setup_rls_security.py
```

This script will:
- ✅ Enable RLS on all tables
- ✅ Create policies so users can only see their own data
- ✅ Allow public sequences to be visible to everyone
- ✅ Keep private sequences secure
- ✅ Make categories publicly readable

### 2.3 Verify Database Setup

You can verify the setup by checking your Supabase dashboard:
1. Go to **Table Editor**
2. You should see these tables:
   - `users`
   - `sequences` 
   - `categories`

## 🚀 Step 3: Start the Backend Server

```bash
# Make sure you're in the backend directory with venv activated
python -m uvicorn app.main:app --reload --port 8000
```

## 🧪 Step 4: Test Authentication

### 4.1 Test Registration
1. Go to `http://localhost:3000/register`
2. Fill out the registration form
3. Complete the multi-step registration process
4. Check your Supabase dashboard to see the new user in the `users` table

### 4.2 Test Login
1. Go to `http://localhost:3000/login`
2. Use the credentials you just created
3. You should be redirected to the home page with your name in the navbar

### 4.3 Test API Endpoints Directly

You can also test the API endpoints directly:

```bash
# Test registration
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User",
    "password": "testpassword123",
    "business_name": "Test Studio",
    "business_category": "Yoga"
  }'

# Test login
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

## 🔍 Troubleshooting

### Common Issues:

1. **"DATABASE_URL not found"**
   - Make sure your `.env` file is in the `backend/` directory
   - Check that the file is named exactly `.env` (not `.env.txt`)

2. **"Connection refused"**
   - Verify your `DATABASE_URL` is correct
   - Make sure your Supabase project is active
   - Check that your database password is correct

3. **"Table already exists"**
   - This is normal if you've run the setup before
   - The script uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times

4. **"Invalid JWT token"**
   - Make sure your `SUPABASE_JWT_SECRET` is correct
   - Check that it matches the JWT secret in your Supabase dashboard

## ✅ Success Checklist

- [ ] `.env` file created with correct Supabase credentials
- [ ] Database setup script ran successfully
- [ ] **RLS security policies applied** (IMPORTANT!)
- [ ] Backend server starts without errors
- [ ] Registration form works and creates users in database
- [ ] Login form works and shows user in navbar
- [ ] Logout functionality works

## 🎉 You're All Set!

Your authentication system is now fully functional! Users can:
- Register with a beautiful multi-step flow
- Login with email/password
- Stay logged in across sessions
- Logout securely
- See their profile in the navbar

The system includes:
- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ User session management
- ✅ Protected API endpoints
- ✅ Beautiful error handling
- ✅ Responsive UI components
