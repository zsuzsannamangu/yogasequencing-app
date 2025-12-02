# 🚀 Next Steps - Right Now!

## Step 1: Update API URLs (Recommended - 2 minutes)

This will make all API calls work in both development and production automatically.

Run this command in your terminal:

```bash
cd frontend/src
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's|http://localhost:8000|process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"|g' {} +
cd ../..
```

This updates all hardcoded `http://localhost:8000` URLs to use environment variables.

---

## Step 2: Commit & Push Everything (2 minutes)

Commit all the deployment configuration and changes:

```bash
cd /Users/zsuzsi/Documents/My_Apps/yogasequencing-app

# Add all new files and changes
git add .

# Commit with a descriptive message
git commit -m "Add deployment configuration for Vercel and Railway

- Add centralized API configuration utility
- Update backend CORS for production
- Add Vercel configuration files
- Add Railway configuration
- Update AuthContext and HomePage to use API utility
- Add comprehensive deployment documentation"

# Push to GitHub
git push
```

---

## Step 3: Start Deploying Backend to Railway (10 minutes)

### 3.1 Open Railway
1. Go to **https://railway.app**
2. Click **"Start a New Project"** or **"Login"**
3. Sign up with **GitHub** (connect your GitHub account)

### 3.2 Create Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: **`yogasequencing-app`**
4. Railway will start detecting your project

### 3.3 Configure Backend Service
1. Railway should auto-detect Python
2. Click on the service that was created
3. Go to **Settings** tab
4. Scroll down and find:
   - **Root Directory**: Change to `backend`
   - **Start Command**: Change to `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 3.4 Add Environment Variables
1. Go to **Variables** tab (in the service settings)
2. Click **"New Variable"** and add these one by one:

**Required Variables** (get these from your local `backend/.env` file):

```
SUPABASE_URL=your-supabase-url-from-env-file
SUPABASE_ANON_KEY=your-anon-key-from-env-file
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-env-file
SUPABASE_JWT_SECRET=your-jwt-secret-from-env-file
DATABASE_URL=your-database-url-from-env-file
ALLOWED_ORIGINS=http://localhost:3000,https://*.vercel.app
```

**Optional Variables** (for contact form):

```
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=your-email
SENDGRID_TO_EMAIL=your-email
```

3. After adding each variable, Railway will automatically redeploy

### 3.5 Get Your Backend URL
1. Wait for deployment to finish (look for green checkmark ✅)
2. Go to **Settings** → **Networking** tab
3. Click **"Generate Domain"** if no domain exists
4. **Copy the Railway URL** (e.g., `https://yoga-app-production.up.railway.app`)

**✅ IMPORTANT: Save this URL somewhere - you'll need it for Vercel!**

### 3.6 Test Backend
1. Open your Railway URL in a browser
2. Add `/health` to the end: `https://your-app.railway.app/health`
3. Should see: `{"status":"ok","message":"Backend is running"}`
4. If you see this, backend is working! ✅

---

## Step 4: Deploy Frontend to Vercel (5 minutes)

Once backend is deployed, come back here for Step 4 instructions!

---

## Quick Commands Reference

### Update API URLs:
```bash
cd frontend/src && find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's|http://localhost:8000|process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"|g' {} + && cd ../..
```

### Commit & Push:
```bash
git add . && git commit -m "Add deployment configuration" && git push
```

---

## Need Your Local .env File?

Your backend environment variables are in:
```
backend/.env
```

If you don't have them, you can find them in:
- **Supabase Dashboard** → Settings → API (for Supabase credentials)
- **Supabase Dashboard** → Settings → Database (for DATABASE_URL)

