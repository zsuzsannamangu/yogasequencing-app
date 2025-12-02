# Step-by-Step Vercel Deployment Guide

Follow these steps in order to deploy your Yoga Sequencing App to Vercel.

## Prerequisites Checklist

Before starting, make sure you have:
- [ ] Your code pushed to GitHub (required for both Railway and Vercel)
- [ ] Supabase account and project credentials ready
- [ ] Your local `.env` file from `backend/env_example.txt` with real values

---

## STEP 1: Prepare Your Code (5 minutes)

### 1.1: Push to GitHub (if not already done)

```bash
# If you haven't initialized git yet
cd /Users/zsuzsi/Documents/My_Apps/yogasequencing-app
git init
git add .
git commit -m "Prepare for deployment"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

**OR** if already on GitHub, just make sure latest changes are pushed:
```bash
git add .
git commit -m "Add deployment configuration"
git push
```

### 1.2: Quick Fix for API URLs (Recommended)

Run this command to update all hardcoded `http://localhost:8000` URLs:

```bash
cd frontend/src
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's|http://localhost:8000|process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"|g' {} +
cd ../..
git add .
git commit -m "Update API URLs for production"
git push
```

This makes all API calls work in both development and production.

---

## STEP 2: Deploy Backend to Railway (10 minutes)

### 2.1: Sign up for Railway

1. Go to https://railway.app
2. Click "Start a New Project" or "Login"
3. Sign up with GitHub (easiest way)

### 2.2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `yogasequencing-app` repository
4. Railway will start detecting your project

### 2.3: Configure Backend Service

1. Railway should detect Python automatically
2. Click on the service that was created
3. Go to **Settings** tab
4. Set these values:
   - **Root Directory**: `backend`
   - **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Watch Paths**: Leave default

### 2.4: Add Environment Variables

1. In Railway, go to the **Variables** tab
2. Click "New Variable" and add each of these (get values from your local `.env` file):

```
SUPABASE_URL=your-actual-supabase-url
SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
SUPABASE_JWT_SECRET=your-actual-jwt-secret
DATABASE_URL=your-actual-database-url
ALLOWED_ORIGINS=http://localhost:3000,https://*.vercel.app
```

**Note**: For `ALLOWED_ORIGINS`, you'll update this later with your actual Vercel URL.

3. Optional (for contact form):
```
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=your-email
SENDGRID_TO_EMAIL=your-email
```

### 2.5: Deploy and Get Backend URL

1. Railway will automatically deploy when you save settings
2. Wait for deployment to complete (green checkmark)
3. Go to **Settings** → **Networking**
4. Click "Generate Domain" if no domain exists
5. **Copy the Railway URL** (e.g., `https://yoga-app-production.up.railway.app`)
6. Test it: Visit `YOUR_RAILWAY_URL/health` - should show `{"status":"ok"}`

**✅ Save this Railway URL - you'll need it in Step 3!**

---

## STEP 3: Deploy Frontend to Vercel (5 minutes)

### 3.1: Sign up for Vercel

1. Go to https://vercel.com
2. Click "Sign Up" or "Login"
3. Sign up with GitHub (same account is easiest)

### 3.2: Import Your Project

1. Click "Add New..." → "Project"
2. Select "Import Git Repository"
3. Choose your `yogasequencing-app` repository
4. Click "Import"

### 3.3: Configure Project

In the configuration screen:

1. **Framework Preset**: Should auto-detect "Next.js" ✅
2. **Root Directory**: Change to `frontend` ⚠️ **IMPORTANT!**
3. **Build Command**: `npm run build` (should auto-detect)
4. **Output Directory**: `.next` (should auto-detect)
5. **Install Command**: `npm install` (should auto-detect)

### 3.4: Add Environment Variable

**Before clicking Deploy**, add environment variable:

1. Scroll down to "Environment Variables" section
2. Click "Add" button
3. Add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your Railway backend URL from Step 2 (e.g., `https://yoga-app-production.up.railway.app`)
   - **Environment**: Check all (Production, Preview, Development)

### 3.5: Deploy!

1. Click "Deploy" button
2. Wait for build to complete (takes 2-3 minutes)
3. **Copy your Vercel URL** (e.g., `https://yoga-sequencing-app.vercel.app`)

**✅ Save this Vercel URL - you need it for Step 4!**

---

## STEP 4: Update Backend CORS (2 minutes)

### 4.1: Update ALLOWED_ORIGINS in Railway

1. Go back to Railway dashboard
2. Open your backend service
3. Go to **Variables** tab
4. Find `ALLOWED_ORIGINS` variable
5. Click "Edit"
6. Update the value to include your Vercel URL:

```
ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app
```

**Replace `your-vercel-app.vercel.app` with your actual Vercel URL!**

7. Click "Save"
8. Railway will automatically redeploy with the new CORS settings

---

## STEP 5: Test Your Deployment (5 minutes)

### 5.1: Test Frontend

1. Visit your Vercel URL (e.g., `https://yoga-sequencing-app.vercel.app`)
2. The homepage should load

### 5.2: Test Backend Connection

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for any errors
4. Try to register or login
5. Check Network tab to see if API calls are going to your Railway URL

### 5.3: Check for Common Issues

**CORS Errors?**
- Verify `ALLOWED_ORIGINS` includes your Vercel URL (no trailing slash)
- Check Railway redeployed after CORS update

**404 on API Calls?**
- Verify `NEXT_PUBLIC_API_URL` in Vercel matches Railway URL exactly
- Check Railway URL is accessible: `YOUR_RAILWAY_URL/health`

**Authentication Not Working?**
- Check browser console for errors
- Verify database connection in Railway logs
- Check Supabase credentials are correct

**Build Failed?**
- Check Vercel build logs for specific errors
- Ensure TypeScript errors are resolved
- Verify all dependencies are in `package.json`

---

## STEP 6: Update README (Optional but Recommended)

Add your live links to your README:

```markdown
## 🌐 Live Demo

- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://your-backend.railway.app/health
```

---

## ✅ Deployment Complete!

Your app should now be live! 

### Quick Links:
- **Frontend**: Your Vercel URL
- **Backend Health Check**: `YOUR_RAILWAY_URL/health`

### Next Steps:
1. Test all major features (login, upload, sequences)
2. Add screenshots to your README
3. Share your portfolio link!

---

## 🐛 Troubleshooting

### "Module not found" errors
- Check Railway logs to see what's missing
- Verify all dependencies are in `backend/requirements.txt`

### Database connection errors
- Verify `DATABASE_URL` in Railway matches your Supabase connection string
- Check Supabase allows connections from Railway IPs (usually allowed by default)

### Images not loading
- Currently files are stored locally on backend
- For portfolio: Use demo/pre-uploaded images
- For production: Need to set up cloud storage (see DEPLOYMENT.md)

### Token expiration errors
- This should be handled automatically
- If issues persist, check JWT configuration in backend

---

## 📚 Additional Resources

- **Full Deployment Guide**: See `DEPLOYMENT.md`
- **Deployment Status**: See `DEPLOYMENT_STATUS.md`
- **Quick Reference**: See `QUICK_DEPLOY.md`

## 💡 Tips for Portfolio

1. **Demo Mode**: Consider adding a demo mode for portfolio visitors
2. **Screenshots**: Add app screenshots to README
3. **Static Examples**: Pre-populate with example sequences
4. **Video Upload**: For portfolio, you might want to disable or show demo version

---

**Need Help?** Check the logs:
- **Vercel**: Project → Deployments → Click on deployment → View logs
- **Railway**: Service → Deployments → Click on deployment → View logs

