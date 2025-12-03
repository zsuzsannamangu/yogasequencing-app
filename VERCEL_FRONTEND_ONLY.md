# 🚀 Deploy Frontend to Vercel (Frontend Only)

This guide shows you how to deploy just the frontend to Vercel for your portfolio. The backend can be added later.

---

## STEP 1: Prepare Your Code (2 minutes)

### 1.1 Commit and Push to GitHub

Make sure all your changes are committed and pushed:

```bash
cd /Users/zsuzsi/Documents/My_Apps/yogasequencing-app

git add .
git commit -m "Prepare frontend for Vercel deployment"
git push
```

---

## STEP 2: Deploy to Vercel (5 minutes)

### 2.1 Sign Up for Vercel

1. Go to **https://vercel.com**
2. Click **"Sign Up"**
3. Sign up with **GitHub** (recommended - easiest way)

### 2.2 Import Your Project

1. Click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. Find and select **`yogasequencing-app`**
4. Click **"Import"**

### 2.3 Configure Project

**Important Settings:**

- **Framework Preset**: Should auto-detect "Next.js" ✅
- **Root Directory**: **`frontend`** ⚠️ **IMPORTANT - Change this!**
- **Build Command**: `npm run build` (should auto-detect)
- **Output Directory**: `.next` (should auto-detect)
- **Install Command**: `npm install` (should auto-detect)

### 2.4 Add Environment Variable (Optional)

If you want to connect to a backend later, add this now:

1. Scroll to **"Environment Variables"** section
2. Click **"Add"** button
3. Add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your backend URL (or `http://localhost:8000` as placeholder)
   - **Environments**: Check all (Production, Preview, Development)

**Note**: You can skip this for now and add it later when you deploy the backend.

### 2.5 Deploy!

1. Click **"Deploy"** button
2. Wait 2-3 minutes for build to complete
3. Vercel will show you a URL like: `https://yoga-sequencing-app.vercel.app`

**✅ That's it! Your frontend is live!**

---

## ✅ What Works Now

- ✅ All UI components
- ✅ Navigation and routing
- ✅ Static pages
- ⚠️ Features requiring backend (login, upload, etc.) will show errors or fail gracefully

This is perfect for showcasing your frontend design and UI/UX!

---

## 🔗 Adding Backend Later

When you're ready to add the backend:

1. **Deploy backend to Render** (see `NEXT_STEPS_VERCEL.md` for instructions)
2. **Update Vercel environment variable:**
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Update `NEXT_PUBLIC_API_URL` with your backend URL
3. **Redeploy** - Vercel will automatically redeploy with new settings

---

## 🎨 Portfolio Tips

Since you're showcasing the frontend:

1. **Add Screenshots**: Take screenshots of key pages and add them to your README
2. **Demo Mode**: Consider adding a demo mode or mock data
3. **Static Examples**: Pre-populate pages with example content
4. **Documentation**: Update README to mention backend coming soon

---

## 🐛 Troubleshooting

### Build Failed?

- Check build logs in Vercel dashboard
- Look for TypeScript or import errors
- Ensure all dependencies are in `package.json`

### Page Not Loading?

- Check if there are any runtime errors in browser console
- Verify routes are set up correctly
- Check Vercel deployment logs

### API Calls Failing?

- This is expected without a backend!
- You can add error handling to show friendly messages
- Or set up a demo/mock mode

---

## 📋 Checklist

- [ ] Code pushed to GitHub
- [ ] Signed up for Vercel
- [ ] Imported project from GitHub
- [ ] Set Root Directory to `frontend`
- [ ] Clicked Deploy
- [ ] Frontend is live at Vercel URL! ✅

---

## 🎉 You're Done!

Your frontend is now live on Vercel and ready to share in your portfolio!

**Next steps:**
- Share your Vercel URL
- Add screenshots to README
- When ready, add backend using `NEXT_STEPS_VERCEL.md`


