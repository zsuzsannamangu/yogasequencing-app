# 🚀 Vercel Deployment Checklist

## Quick Overview

1. **Backend** → Railway (hosts your FastAPI server)
2. **Frontend** → Vercel (hosts your Next.js app)
3. **Database** → Supabase (already set up, just need credentials)

---

## ✅ Pre-Deployment Checklist

- [ ] Code is pushed to GitHub
- [ ] You have your Supabase credentials ready (from your local `.env` file)
- [ ] Optional: Run the API URL fix command (see Step 1.2 below)

---

## STEP 1: Deploy Backend to Railway (~10 min)

### 1.1 Sign Up & Create Project
- [ ] Go to https://railway.app
- [ ] Sign up with GitHub
- [ ] Click "New Project" → "Deploy from GitHub repo"
- [ ] Select your `yogasequencing-app` repository

### 1.2 Configure Service
- [ ] Click on the service that was created
- [ ] Go to **Settings** tab
- [ ] Set **Root Directory**: `backend`
- [ ] Set **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 1.3 Add Environment Variables
- [ ] Go to **Variables** tab
- [ ] Add these variables (copy from your local `.env` file):

```
SUPABASE_URL=your-actual-value
SUPABASE_ANON_KEY=your-actual-value
SUPABASE_SERVICE_ROLE_KEY=your-actual-value
SUPABASE_JWT_SECRET=your-actual-value
DATABASE_URL=your-actual-value
ALLOWED_ORIGINS=http://localhost:3000,https://*.vercel.app
```

- [ ] Optional (for contact form):
```
SENDGRID_API_KEY=your-key
SENDGRID_FROM_EMAIL=your-email
SENDGRID_TO_EMAIL=your-email
```

### 1.4 Get Backend URL
- [ ] Wait for deployment to finish (green checkmark)
- [ ] Go to **Settings** → **Networking**
- [ ] Click "Generate Domain" if needed
- [ ] **Copy the Railway URL** (e.g., `https://yoga-app.up.railway.app`)
- [ ] Test it: Visit `YOUR_RAILWAY_URL/health` - should show `{"status":"ok"}`

**✅ Save this URL!**

---

## STEP 2: Deploy Frontend to Vercel (~5 min)

### 2.1 Sign Up & Import
- [ ] Go to https://vercel.com
- [ ] Sign up with GitHub
- [ ] Click "Add New..." → "Project"
- [ ] Select "Import Git Repository"
- [ ] Choose your `yogasequencing-app` repository

### 2.2 Configure Project
- [ ] **Root Directory**: Change to `frontend` ⚠️ **CRITICAL!**
- [ ] Framework: Should auto-detect "Next.js" ✅
- [ ] Build Command: Should auto-detect `npm run build` ✅
- [ ] Output Directory: Should auto-detect `.next` ✅

### 2.3 Add Environment Variable
- [ ] Scroll to "Environment Variables"
- [ ] Click "Add"
- [ ] **Key**: `NEXT_PUBLIC_API_URL`
- [ ] **Value**: Paste your Railway URL from Step 1.4
- [ ] **Environments**: Check all (Production, Preview, Development)

### 2.4 Deploy
- [ ] Click "Deploy" button
- [ ] Wait for build (2-3 minutes)
- [ ] **Copy your Vercel URL** (e.g., `https://yoga-app.vercel.app`)

**✅ Save this URL!**

---

## STEP 3: Update Backend CORS (~2 min)

### 3.1 Update ALLOWED_ORIGINS
- [ ] Go back to Railway dashboard
- [ ] Open your backend service
- [ ] Go to **Variables** tab
- [ ] Find `ALLOWED_ORIGINS`
- [ ] Edit it to include your Vercel URL:

```
ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app
```

**Replace `your-vercel-app.vercel.app` with your actual Vercel URL!**

- [ ] Click "Save"
- [ ] Wait for Railway to redeploy

---

## STEP 4: Test Deployment (~5 min)

### 4.1 Basic Checks
- [ ] Visit your Vercel URL
- [ ] Homepage loads ✅
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab for errors
- [ ] Check Network tab for API calls

### 4.2 Test Features
- [ ] Try to register a new account
- [ ] Try to login
- [ ] Check if API calls go to Railway URL (not localhost)
- [ ] Verify no CORS errors in console

### 4.3 Common Issues

**❌ CORS Errors?**
- Verify `ALLOWED_ORIGINS` in Railway includes your Vercel URL
- Make sure no trailing slash in URLs
- Check Railway redeployed after CORS update

**❌ 404 on API Calls?**
- Check `NEXT_PUBLIC_API_URL` in Vercel matches Railway URL exactly
- Test Railway health endpoint: `YOUR_RAILWAY_URL/health`

**❌ Build Failed?**
- Check Vercel build logs for specific errors
- Check Railway deployment logs for backend errors

---

## ✅ Optional: Quick API URL Fix

Before deploying, you can update all hardcoded URLs in your frontend:

```bash
cd frontend/src
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's|http://localhost:8000|process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"|g' {} +
cd ../..
git add .
git commit -m "Update API URLs for production"
git push
```

This makes your app work in both development and production automatically.

---

## 🎉 You're Done!

Your app should now be live at your Vercel URL!

### Next Steps:
- [ ] Add screenshots to README
- [ ] Update README with live links
- [ ] Test on mobile device
- [ ] Share your portfolio link!

---

## 📚 Need More Details?

- **Step-by-step guide**: `STEP_BY_STEP_DEPLOY.md`
- **Quick reference**: `QUICK_DEPLOY.md`
- **Full documentation**: `DEPLOYMENT.md`

---

## 🆘 Getting Help

**Check Logs:**
- **Vercel**: Project → Deployments → Click deployment → View logs
- **Railway**: Service → Deployments → Click deployment → View logs

**Common Issues:**
- See troubleshooting section in `STEP_BY_STEP_DEPLOY.md`

