# Quick Vercel Deployment Guide

## Step 1: Deploy Backend First

You need to deploy your FastAPI backend separately. Recommended options:

1. **Railway** (easiest): https://railway.app
   - Create project → Connect GitHub → Add environment variables
   - Set root directory: `backend`
   - Set start command: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`

2. **Render**: https://render.com
   - Similar setup to Railway

3. **Fly.io**: https://fly.io
   - More complex but very reliable

**Important**: Note your backend URL (e.g., `https://your-app.railway.app`)

## Step 2: Update Backend CORS

In your backend's environment variables, add:
```
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-custom-domain.com
```

Or use wildcard for development:
```
ALLOWED_ORIGINS=http://localhost:3000,https://*.vercel.app
```

## Step 3: Deploy Frontend to Vercel

### Option A: Via Vercel CLI

```bash
cd frontend
npm install -g vercel
vercel login
vercel
```

### Option B: Via GitHub

1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `.next` (should auto-detect)

## Step 4: Set Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your backend URL (e.g., `https://your-app.railway.app`)
   - **Environment**: Production, Preview, Development (check all)

4. Redeploy your site after adding the variable

## Step 5: Update API References (Partial - More Needed)

I've updated:
- ✅ `src/contexts/AuthContext.tsx` - uses API utility
- ✅ `src/components/HomePage.tsx` - uses API utility
- ✅ Created `src/lib/api.ts` - centralized API config

**Still need to update**:
- `src/app/upload/page.tsx`
- `src/app/sequences/page.tsx`
- `src/app/browse/page.tsx`
- `src/app/settings/page.tsx`
- `src/app/profile/[userId]/page.tsx`
- `src/components/LongVideoProcessor.tsx`
- And others...

### Quick Fix Option

For a quick deployment, you can temporarily replace all instances:

```bash
cd frontend/src
# This will replace all hardcoded localhost URLs with env variable
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's|http://localhost:8000|process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"|g' {} +
```

**Better approach**: Update files to use the `apiUrl()` utility from `@/lib/api`

## Step 6: Test Deployment

1. Visit your Vercel URL
2. Check browser console for errors
3. Test login/registration
4. Check network tab for API calls

## Troubleshooting

### CORS Errors
- Verify `ALLOWED_ORIGINS` in backend includes your Vercel URL
- No trailing slash in URLs

### 404 on API Calls
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend is running
- Check browser console for the actual URL being called

### Build Failures
- Check Vercel build logs
- Ensure all TypeScript errors are resolved
- Verify all imports are correct

## File Storage Note

⚠️ **Important**: Your backend currently stores files locally. For production:
- Files won't persist on serverless/hosted backends
- You'll need cloud storage (AWS S3, Cloudinary, Vercel Blob)
- Or disable file uploads for portfolio demo

For portfolio purposes, you can:
- Use demo/pre-uploaded sequences
- Skip video upload functionality
- Show static examples

