# Quick Deployment Checklist for Portfolio

## ✅ What's Already Done

1. ✅ Centralized API configuration (`frontend/src/lib/api.ts`)
2. ✅ Updated AuthContext to use API utility
3. ✅ Updated HomePage to use API utility  
4. ✅ Backend CORS configured for production URLs
5. ✅ Vercel configuration files created
6. ✅ Deployment documentation created

## 🚀 Quick Start (5 Steps)

### 1. Deploy Backend to Railway (5 minutes)

1. Go to https://railway.app and sign up
2. "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add these environment variables in Railway:
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_JWT_SECRET=your-jwt-secret
   DATABASE_URL=your-database-url
   ALLOWED_ORIGINS=http://localhost:3000,https://*.vercel.app
   SENDGRID_API_KEY=your-key (optional)
   SENDGRID_FROM_EMAIL=your-email (optional)
   SENDGRID_TO_EMAIL=your-email (optional)
   ```
5. Set in Railway settings:
   - Root Directory: `backend`
   - Start Command: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Copy the Railway URL (e.g., `https://your-app.up.railway.app`)

### 2. Deploy Frontend to Vercel (3 minutes)

1. Go to https://vercel.com and sign up
2. "Add New Project" → Import your GitHub repository
3. Configure:
   - Framework: Next.js (auto-detected)
   - Root Directory: **frontend** ⚠️ Important!
   - Build Command: `npm run build`
4. Add environment variable:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: Your Railway backend URL
5. Click "Deploy"

### 3. Update Backend CORS

In Railway, update `ALLOWED_ORIGINS` to include your Vercel URL:
```
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app
```

### 4. Quick Fix Remaining API Calls (Optional)

For a quick portfolio demo, you can temporarily update remaining hardcoded URLs:

Run this in your terminal (one-time fix):
```bash
cd frontend/src
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -print0 | xargs -0 sed -i '' 's|http://localhost:8000|process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"|g'
```

**OR** manually update key files to use the API utility (better practice):
- Import: `import { apiUrl, silhouetteUrl } from '@/lib/api';`
- Replace URLs: `apiUrl('auth/login')`, `silhouetteUrl(filename)`, etc.

### 5. Test & Share

1. Visit your Vercel URL
2. Test login/registration
3. Check browser console for errors
4. Share your portfolio link!

## 📝 Files Still Using Hardcoded URLs

These files still have `http://localhost:8000` hardcoded. For portfolio, you can:
- Update them manually using the API utility
- Or use the sed command above for a quick fix
- Or leave as-is if you're just showing static UI

**Main files**:
- `src/app/upload/page.tsx`
- `src/app/sequences/page.tsx`
- `src/app/browse/page.tsx`
- `src/app/settings/page.tsx`
- `src/app/profile/[userId]/page.tsx`
- `src/components/LongVideoProcessor.tsx`
- `src/components/Navbar.tsx`
- `src/app/dashboard/page.tsx`

## ⚠️ Important Notes

### File Storage
Your backend stores videos/images locally. For production:
- **Option 1**: Disable uploads, use demo data (easiest for portfolio)
- **Option 2**: Set up cloud storage (AWS S3, Cloudinary, Vercel Blob)

### Database
Your Supabase database should work as-is. Just make sure:
- Environment variables in Railway match your Supabase project
- Database is accessible from Railway's IP (check Supabase settings)

### Authentication
JWT tokens should work across domains if:
- Backend CORS is configured correctly
- `ALLOWED_ORIGINS` includes your Vercel URL

## 🐛 Troubleshooting

**CORS errors?**
- Check `ALLOWED_ORIGINS` in Railway includes Vercel URL
- No trailing slashes in URLs

**404 on API calls?**
- Verify `NEXT_PUBLIC_API_URL` in Vercel matches Railway URL
- Check Railway is running (visit Railway URL + `/health`)

**Build fails?**
- Check Vercel build logs
- Ensure all TypeScript errors are resolved
- Verify imports are correct

**Images not loading?**
- For portfolio: Use static images or CDN
- For production: Set up cloud storage

## 🎯 Portfolio-Specific Tips

1. **Demo Mode**: Consider adding a demo mode that doesn't require full functionality
2. **Static Examples**: Pre-populate with example sequences
3. **Video Disabled**: Disable video uploads, show UI only
4. **Screenshots**: Add screenshots/GIFs of the app in action

## 📚 Full Documentation

See `DEPLOYMENT.md` for comprehensive deployment guide with all options.

## ✨ Next Steps

1. ✅ Deploy backend (Railway)
2. ✅ Deploy frontend (Vercel)
3. ✅ Set environment variables
4. ✅ Test deployment
5. 📸 Add screenshots to README
6. 🔗 Share your portfolio link!

