# 🚀 Deploy to Vercel - Complete Guide

This guide walks you through deploying your Yoga Sequencing App to Vercel.

## Architecture Overview

- **Frontend (Next.js)** → Deploy to **Vercel** ✅
- **Backend (FastAPI)** → Deploy to **Render** (separate service needed)
- **Database** → Already using Supabase (no changes needed)

---

## Quick Start (3 Steps)

### STEP 1: Deploy Backend to Render (~10 min)

Your FastAPI backend needs to be hosted separately. Render is free and easy:

1. **Go to https://render.com** and sign up with GitHub
2. **New** → **Web Service** → **Connect your GitHub repo**
3. **Configure:**
   - **Name**: `yoga-app-backend` (or any name)
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Add Environment Variables** (from your `backend/.env` file):
   ```
   SUPABASE_URL=your-value
   SUPABASE_ANON_KEY=your-value
   SUPABASE_SERVICE_ROLE_KEY=your-value
   SUPABASE_JWT_SECRET=your-value
   DATABASE_URL=your-value
   ALLOWED_ORIGINS=http://localhost:3000,https://*.vercel.app
   ```
5. **Click "Create Web Service"**
6. **Copy your Render URL** when it's deployed (e.g., `https://yoga-app-backend.onrender.com`)
7. **Test it**: Visit `YOUR_RENDER_URL/health` - should show `{"status":"ok"}`

**✅ Save this Render URL - you'll need it for Step 2!**

---

### STEP 2: Deploy Frontend to Vercel (~5 min)

1. **Go to https://vercel.com** and sign up with GitHub

2. **Add New Project:**
   - Click **"Add New..."** → **"Project"**
   - Select **"Import Git Repository"**
   - Choose your `yogasequencing-app` repository

3. **Configure Project:**
   - **Framework Preset**: Should auto-detect "Next.js" ✅
   - **Root Directory**: Change to `frontend` ⚠️ **IMPORTANT!**
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `.next` (should auto-detect)
   - **Install Command**: `npm install` (should auto-detect)

4. **Add Environment Variable:**
   - Scroll to **"Environment Variables"**
   - Click **"Add"**
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your Render backend URL from Step 1
   - **Environments**: Check all (Production, Preview, Development)

5. **Deploy:**
   - Click **"Deploy"** button
   - Wait 2-3 minutes for build to complete
   - **Copy your Vercel URL** (e.g., `https://yoga-sequencing-app.vercel.app`)

**✅ Save this Vercel URL!**

---

### STEP 3: Update Backend CORS (~2 min)

1. **Go back to Render dashboard**
2. **Open your backend service**
3. **Go to "Environment" tab**
4. **Edit `ALLOWED_ORIGINS`** to include your Vercel URL:
   ```
   ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app
   ```
   Replace `your-vercel-app.vercel.app` with your actual Vercel URL!
5. **Save changes** - Render will automatically redeploy

---

## ✅ Test Your Deployment

1. **Visit your Vercel URL**
2. **Open browser DevTools (F12)** → Console tab
3. **Try to register/login**
4. **Check Network tab** - API calls should go to your Render URL (not localhost)
5. **Verify no CORS errors**

---

## 🎉 You're Live!

Your app should now be accessible at your Vercel URL!

- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://your-backend.onrender.com/health`

---

## 📋 Checklist

- [ ] Backend deployed to Render
- [ ] Backend URL copied and tested
- [ ] Frontend deployed to Vercel
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel environment variables
- [ ] Backend CORS updated with Vercel URL
- [ ] Tested login/registration
- [ ] No errors in browser console

---

## 🐛 Troubleshooting

### CORS Errors?
- Check `ALLOWED_ORIGINS` in Render includes your Vercel URL (no trailing slash)
- Verify Render redeployed after CORS update

### 404 on API Calls?
- Verify `NEXT_PUBLIC_API_URL` in Vercel matches your Render URL exactly
- Check Render service is running (visit Render dashboard)

### Build Failed?
- **Vercel**: Check build logs in Vercel dashboard
- **Render**: Check deployment logs in Render dashboard
- Ensure all dependencies are in `package.json` (frontend) and `requirements.txt` (backend)

### Authentication Not Working?
- Check browser console for errors
- Verify database connection (check Render logs)
- Ensure Supabase credentials are correct in Render

---

## 💡 Alternative: Railway for Backend

If you prefer Railway over Render for backend:

1. Go to https://railway.app
2. New Project → Deploy from GitHub repo
3. Configure:
   - Root Directory: `backend`
   - Start Command: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add same environment variables as above
5. Get Railway URL and use it in Vercel's `NEXT_PUBLIC_API_URL`

Everything else remains the same!

---

## 📚 Additional Resources

- **Detailed Step-by-Step**: See `STEP_BY_STEP_DEPLOY.md`
- **Quick Checklist**: See `DEPLOY_CHECKLIST.md`
- **Full Documentation**: See `DEPLOYMENT.md`

