# Deployment Preparation Status

## ✅ Completed

### 1. Centralized API Configuration
- Created `frontend/src/lib/api.ts` with utility functions:
  - `apiUrl(path)` - constructs API URLs
  - `silhouetteUrl(filename)` - gets silhouette image URLs
  - `uploadUrl(filename)` - gets upload URLs
  - `profileImageUrl(imagePath)` - gets profile image URLs
- Automatically uses `NEXT_PUBLIC_API_URL` environment variable in production

### 2. Updated Core Files
- ✅ `frontend/src/contexts/AuthContext.tsx` - All auth API calls use `apiUrl()`
- ✅ `frontend/src/components/HomePage.tsx` - Contact form uses `apiUrl()`

### 3. Backend Configuration
- ✅ Updated `backend/app/main.py` CORS to accept environment variable `ALLOWED_ORIGINS`
- ✅ Supports multiple origins (comma-separated)
- ✅ Created `backend/railway.json` for Railway deployment configuration

### 4. Vercel Configuration
- ✅ Created `frontend/vercel.json` with build configuration
- ✅ Created `.vercelignore` to exclude unnecessary files

### 5. Documentation
- ✅ Created `QUICK_DEPLOY.md` - 5-step quick deployment guide
- ✅ Created `DEPLOYMENT.md` - Comprehensive deployment guide
- ✅ Created `frontend/VERCEL_SETUP.md` - Frontend-specific setup
- ✅ Updated `README.md` with deployment section

## ⚠️ Partially Completed

### Frontend API References
**Still using hardcoded `http://localhost:8000` in these files:**

1. `src/app/upload/page.tsx` - ~15 references
2. `src/app/sequences/page.tsx` - ~8 references
3. `src/app/browse/page.tsx` - ~6 references
4. `src/app/settings/page.tsx` - ~5 references
5. `src/app/profile/[userId]/page.tsx` - ~5 references
6. `src/components/LongVideoProcessor.tsx` - ~3 references
7. `src/components/Navbar.tsx` - ~1 reference
8. `src/app/dashboard/page.tsx` - ~2 references
9. `src/app/sequences/[id]/page.tsx` - ~10 references
10. `src/app/browse/[id]/page.tsx` - ~5 references
11. `src/components/CategorySelectionModal.tsx` - ~2 references

**Total: ~62 remaining hardcoded URLs**

### Quick Fix Options

**Option 1: Environment Variable Replacement (Quick)**
```bash
cd frontend/src
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's|http://localhost:8000|process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"|g' {} +
```

**Option 2: Use API Utility (Recommended)**
Update files to import and use the API utility:
```typescript
import { apiUrl, silhouetteUrl, profileImageUrl } from '@/lib/api';

// Replace:
'http://localhost:8000/auth/login'
// With:
apiUrl('auth/login')

// Replace:
`http://localhost:8000/silhouettes/${filename}`
// With:
silhouetteUrl(filename)
```

**Option 3: Leave as-is for Portfolio Demo**
If you're just showcasing the UI, you can:
- Update only the critical files
- Or leave hardcoded URLs (they'll still work if backend URL matches)

## 🔲 Not Yet Implemented

### 1. Cloud File Storage
- Currently files are stored locally on backend
- For production, need to set up:
  - AWS S3, or
  - Cloudinary, or
  - Vercel Blob Storage

**For Portfolio**: Can skip or use demo/pre-uploaded files

### 2. Full API Reference Updates
- See "Partially Completed" section above
- Most files still use hardcoded URLs

### 3. Production Testing
- End-to-end testing with production URLs
- CORS configuration verification
- Authentication flow testing

## 📋 Deployment Checklist

### Before Deploying

- [ ] Backend deployed to Railway/Render
- [ ] Backend URL noted and accessible
- [ ] `ALLOWED_ORIGINS` set in backend environment variables
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel environment variables
- [ ] Remaining API references updated (or quick fix applied)
- [ ] Test backend health endpoint: `https://your-backend.railway.app/health`

### After Deploying

- [ ] Frontend deployed to Vercel
- [ ] Test authentication (login/register)
- [ ] Test API calls in browser console
- [ ] Check for CORS errors
- [ ] Test image/silhouette loading
- [ ] Verify database connection
- [ ] Test on mobile device (if applicable)

## 🎯 Next Steps

1. **Quick Portfolio Deployment**:
   - Follow `QUICK_DEPLOY.md`
   - Use Option 1 (sed command) for quick URL fix
   - Deploy and test

2. **Production-Ready Deployment**:
   - Update all files to use API utility (Option 2)
   - Set up cloud storage
   - Full testing
   - Set up monitoring/logging

3. **Hybrid Approach**:
   - Update critical files manually
   - Use sed for the rest
   - Deploy and iterate

## 📝 Notes

- The API utility (`lib/api.ts`) is ready and works correctly
- Backend CORS is configured to accept production URLs
- All configuration files are in place
- The main remaining work is updating API references in frontend files

For a portfolio demo, you can deploy with minimal changes and iterate from there!


