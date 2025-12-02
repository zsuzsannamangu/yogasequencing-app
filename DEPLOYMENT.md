# Deployment Guide for Vercel

This guide will help you deploy the Yoga Sequencing App to Vercel for your portfolio.

## Architecture Overview

- **Frontend**: Next.js app deployed to Vercel
- **Backend**: FastAPI app (needs separate hosting - see options below)
- **Database**: Supabase PostgreSQL (already configured)
- **File Storage**: Need cloud storage for videos/images (currently local)

## Prerequisites

1. Vercel account (free tier is fine)
2. Supabase account with database already set up
3. Backend hosting service account (Railway, Render, or Fly.io)
4. Optional: Cloud storage account (AWS S3, Cloudinary, or Vercel Blob)

## Step 1: Prepare Backend for Production

### Option A: Deploy Backend to Railway (Recommended)

1. Sign up at [railway.app](https://railway.app)
2. Create a new project
3. Connect your GitHub repository
4. Add a new service → "Empty Service"
5. Add environment variables in Railway dashboard:
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_JWT_SECRET=your-jwt-secret
   DATABASE_URL=your-database-url
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-custom-domain.com
   SENDGRID_API_KEY=your-sendgrid-key
   SENDGRID_FROM_EMAIL=your-email
   SENDGRID_TO_EMAIL=your-email
   ```
6. Set build command: `cd backend && pip install -r requirements.txt`
7. Set start command: `cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
8. Set root directory to: `/backend`
9. Railway will automatically assign a URL like: `https://your-app.railway.app`

### Option B: Deploy Backend to Render

1. Sign up at [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure:
   - Build Command: `cd backend && pip install -r requirements.txt`
   - Start Command: `cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Root Directory: `backend`
5. Add all environment variables (same as Railway)
6. Render will assign a URL like: `https://your-app.onrender.com`

## Step 2: Set Up File Storage (Important!)

Your backend currently stores files locally. For production, you need cloud storage:

### Option A: Vercel Blob Storage (Easiest)

1. Install Vercel Blob: `npm install @vercel/blob`
2. Create a Vercel Blob store in your Vercel dashboard
3. Update backend to use blob storage for uploads/silhouettes

### Option B: AWS S3

1. Create an S3 bucket
2. Set up IAM credentials
3. Install `boto3`: `pip install boto3`
4. Update backend upload/silhouette routes to use S3

### Option C: Cloudinary

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Install: `pip install cloudinary`
3. Update backend to upload files to Cloudinary

**For now, if you're just showing the portfolio, you can skip file uploads in production or use a demo mode.**

## Step 3: Deploy Frontend to Vercel

### 3.1: Update Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following:

   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   ```

   Replace `your-backend-url.railway.app` with your actual backend URL from Step 1.

### 3.2: Deploy via Vercel CLI

```bash
cd frontend
npm install -g vercel
vercel login
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? (Select your account)
- Link to existing project? **No**
- Project name? (e.g., `yoga-sequencing-app`)
- Directory? **./** (current directory)
- Override settings? **No**

### 3.3: Or Deploy via GitHub

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Configure:
   - Framework Preset: **Next.js**
   - Root Directory: **frontend**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
5. Add environment variable: `NEXT_PUBLIC_API_URL` (your backend URL)
6. Click "Deploy"

## Step 4: Update Frontend API References

I've created a centralized API utility at `frontend/src/lib/api.ts`. However, there are still many hardcoded `http://localhost:8000` references in the frontend.

### Quick Fix Script

Run this script to update remaining API references:

```bash
cd frontend/src
find . -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|http://localhost:8000|process.env.NEXT_PUBLIC_API_URL \|\| "http://localhost:8000"|g'
```

**However, the better approach is to use the API utility:**

1. Import the utility in each file:
   ```typescript
   import { apiUrl, silhouetteUrl, profileImageUrl } from '@/lib/api';
   ```

2. Replace hardcoded URLs:
   - `http://localhost:8000/auth/login` → `apiUrl('auth/login')`
   - `http://localhost:8000/silhouettes/${filename}` → `silhouetteUrl(filename)`
   - `http://localhost:8000/${imagePath}` → `profileImageUrl(imagePath)`

### Files That Still Need Updates

- `frontend/src/app/upload/page.tsx`
- `frontend/src/app/sequences/page.tsx`
- `frontend/src/app/browse/page.tsx`
- `frontend/src/app/settings/page.tsx`
- `frontend/src/app/profile/[userId]/page.tsx`
- `frontend/src/components/LongVideoProcessor.tsx`
- And several others...

**For a quick portfolio deployment, you can:**
1. Use environment variable replacement as shown above
2. Or manually update the most critical files first
3. Deploy and test incrementally

## Step 5: Verify Deployment

1. **Check Frontend**: Visit your Vercel URL
2. **Check Backend Health**: Visit `https://your-backend-url.railway.app/health`
3. **Test Authentication**: Try logging in
4. **Test API Connection**: Open browser console, check for CORS errors

## Step 6: Custom Domain (Optional)

1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `ALLOWED_ORIGINS` in backend with your custom domain

## Troubleshooting

### CORS Errors
- Make sure `ALLOWED_ORIGINS` in backend includes your Vercel URL
- Format: `https://your-app.vercel.app` (no trailing slash)

### 401 Authentication Errors
- Check that `NEXT_PUBLIC_API_URL` is set correctly in Vercel
- Verify backend is running and accessible
- Check browser console for API errors

### Images Not Loading
- Verify backend URL is correct
- Check that silhouette files are accessible via backend URL
- For production, consider using CDN or cloud storage

### Build Failures
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify TypeScript errors are resolved

## Quick Start Checklist

- [ ] Backend deployed (Railway/Render)
- [ ] Backend URL noted
- [ ] Frontend environment variable `NEXT_PUBLIC_API_URL` set in Vercel
- [ ] Backend `ALLOWED_ORIGINS` includes Vercel URL
- [ ] Frontend code updated to use environment variables (or API utility)
- [ ] Test deployment locally with production URL
- [ ] Deploy to Vercel
- [ ] Test authentication flow
- [ ] Test video upload (if file storage is set up)

## Notes for Portfolio

For a portfolio demonstration:
- You can disable video uploads in production
- Use demo data or pre-uploaded sequences
- Focus on showcasing the UI/UX
- Add a demo mode that doesn't require authentication

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check backend logs (Railway/Render dashboard)
3. Check browser console for errors
4. Verify all environment variables are set correctly

