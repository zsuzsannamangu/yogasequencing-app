# 🚀 Next Steps: Deploy to Vercel

## Quick Overview

1. **Frontend** → Vercel (Next.js app)
2. **Backend** → Render (FastAPI server)
3. **Database** → Supabase (already set up)

---

## STEP 1: Deploy Backend to Render (10 minutes)

### 1.1 Sign Up
1. Go to **https://render.com**
2. Click **"Get Started"** or **"Sign Up"**
3. Sign up with **GitHub** (easiest way)

### 1.2 Create Web Service
1. Click **"New +"** button → **"Web Service"**
2. Connect your GitHub repository: **`yogasequencing-app`**
3. Click **"Connect"**

### 1.3 Configure Service
Fill in the configuration:

- **Name**: `yoga-app-backend` (or any name you like)
- **Environment**: **Python 3**
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main` (or your default branch)

**Build & Deploy:**
- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 1.4 Add Environment Variables
Scroll down to **"Environment Variables"** section and add these (get values from your local `backend/.env` file):

**Required:**
```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
DATABASE_URL=your-database-url
ALLOWED_ORIGINS=http://localhost:3000,https://*.vercel.app
```

**Optional** (for contact form):
```
SENDGRID_API_KEY=your-key
SENDGRID_FROM_EMAIL=your-email
SENDGRID_TO_EMAIL=your-email
```

### 1.5 Create Service
1. Scroll down and click **"Create Web Service"**
2. Wait for deployment to complete (3-5 minutes)
3. Render will show you a URL like: `https://yoga-app-backend.onrender.com`

**✅ Copy and save this URL!**

### 1.6 Test Backend
1. Visit: `YOUR_RENDER_URL/health`
2. Should see: `{"status":"ok","message":"Backend is running"}`
3. If you see this, backend is working! ✅

---

## STEP 2: Deploy Frontend to Vercel (5 minutes)

### 2.1 Sign Up
1. Go to **https://vercel.com**
2. Click **"Sign Up"**
3. Sign up with **GitHub** (same account)

### 2.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. Find and select **`yogasequencing-app`**
4. Click **"Import"**

### 2.3 Configure Project
**Important Settings:**

- **Framework Preset**: Should auto-detect "Next.js" ✅
- **Root Directory**: **`frontend`** ⚠️ **Change this!**
- **Build Command**: `npm run build` (should auto-detect)
- **Output Directory**: `.next` (should auto-detect)
- **Install Command**: `npm install` (should auto-detect)

### 2.4 Add Environment Variable
**Before clicking Deploy:**

1. Scroll to **"Environment Variables"** section
2. Click **"Add"** button
3. Add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your Render backend URL from Step 1 (e.g., `https://yoga-app-backend.onrender.com`)
   - **Environments**: Check all three (Production, Preview, Development)

### 2.5 Deploy
1. Click **"Deploy"** button
2. Wait 2-3 minutes for build to complete
3. Vercel will show you a URL like: `https://yoga-sequencing-app.vercel.app`

**✅ Copy and save this URL!**

---

## STEP 3: Update Backend CORS (2 minutes)

Now we need to tell the backend to accept requests from your Vercel URL.

### 3.1 Go Back to Render
1. Go to **https://dashboard.render.com**
2. Click on your backend service (**`yoga-app-backend`**)

### 3.2 Update CORS Settings
1. Go to **"Environment"** tab
2. Find **`ALLOWED_ORIGINS`** variable
3. Click the **pencil icon** to edit
4. Update the value to include your Vercel URL:

```
ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app
```

**Replace `your-vercel-app.vercel.app` with your actual Vercel URL!**

5. Click **"Save Changes"**
6. Render will automatically redeploy with new settings

---

## STEP 4: Test Everything (5 minutes)

### 4.1 Test Frontend
1. Visit your Vercel URL
2. Homepage should load ✅

### 4.2 Test Backend Connection
1. Open browser **Developer Tools** (Press `F12`)
2. Go to **Console** tab
3. Try to **register** a new account or **login**
4. Check **Network** tab - API calls should go to your Render URL (not localhost)

### 4.3 Check for Errors
- **No CORS errors** in console ✅
- **No 404 errors** on API calls ✅
- **Authentication works** ✅

---

## ✅ You're Live!

Your app should now be accessible at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`

---

## 🐛 Troubleshooting

### CORS Errors?
- Make sure `ALLOWED_ORIGINS` in Render includes your Vercel URL
- No trailing slash in URLs
- Wait for Render to finish redeploying

### 404 on API Calls?
- Check `NEXT_PUBLIC_API_URL` in Vercel matches Render URL exactly
- Test Render backend: Visit `YOUR_RENDER_URL/health`

### Build Failed?
- **Vercel**: Check build logs in Vercel dashboard
- **Render**: Check deployment logs in Render dashboard
- Look for specific error messages

### Authentication Not Working?
- Check browser console for errors
- Verify database connection in Render logs
- Check Supabase credentials are correct

---

## 📋 Quick Checklist

- [ ] Backend deployed to Render
- [ ] Backend URL copied and tested (`/health` endpoint works)
- [ ] Frontend deployed to Vercel
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel with Render URL
- [ ] Backend CORS updated with Vercel URL
- [ ] Tested login/registration - works!
- [ ] No errors in browser console

---

## 📚 Additional Guides

- **Detailed Step-by-Step**: `VERCEL_DEPLOY.md`
- **Full Documentation**: `DEPLOYMENT.md`
- **Quick Checklist**: `DEPLOY_CHECKLIST.md`

---

## 💡 Note About File Storage

Your backend currently stores videos/images locally. For production:
- **Option 1**: Use demo/pre-uploaded sequences (easiest for portfolio)
- **Option 2**: Set up cloud storage (AWS S3, Cloudinary, Vercel Blob)
- See `DEPLOYMENT.md` for cloud storage setup instructions

