-- Row Level Security (RLS) Setup for Yoga Sequencing App
-- Run this in your Supabase SQL Editor to secure your tables

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USERS TABLE POLICIES
-- =============================================

-- Users can only view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id);

-- Users can insert their own profile (for registration)
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id);

-- =============================================
-- SEQUENCES TABLE POLICIES
-- =============================================

-- Users can view their own sequences
CREATE POLICY "Users can view own sequences" ON sequences
    FOR SELECT USING (auth.uid()::text = user_id);

-- Users can view public sequences from other users
CREATE POLICY "Users can view public sequences" ON sequences
    FOR SELECT USING (privacy = 'public');

-- Users can insert their own sequences
CREATE POLICY "Users can insert own sequences" ON sequences
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own sequences
CREATE POLICY "Users can update own sequences" ON sequences
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Users can delete their own sequences
CREATE POLICY "Users can delete own sequences" ON sequences
    FOR DELETE USING (auth.uid()::text = user_id);

-- =============================================
-- CATEGORIES TABLE POLICIES
-- =============================================

-- Categories are publicly readable (for dropdowns, etc.)
CREATE POLICY "Categories are publicly readable" ON categories
    FOR SELECT USING (true);

-- Only authenticated users can create categories
CREATE POLICY "Authenticated users can create categories" ON categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can update categories
CREATE POLICY "Authenticated users can update categories" ON categories
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Only authenticated users can delete categories
CREATE POLICY "Authenticated users can delete categories" ON categories
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- HELPFUL QUERIES FOR TESTING
-- =============================================

-- Test queries (run these to verify RLS is working):

-- 1. Check if RLS is enabled
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('users', 'sequences', 'categories');

-- 2. Check existing policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('users', 'sequences', 'categories');

-- 3. Test as authenticated user (replace with actual user ID)
-- SET LOCAL "request.jwt.claims" TO '{"sub": "your-user-id-here"}';
-- SELECT * FROM users;
-- SELECT * FROM sequences;
