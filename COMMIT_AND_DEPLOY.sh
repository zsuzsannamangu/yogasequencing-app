#!/bin/bash
# Quick script to commit changes and remind you of next steps

echo "🚀 Committing deployment configuration..."

git commit -m "Add deployment configuration for Vercel and Railway

- Add centralized API configuration utility (lib/api.ts)
- Update backend CORS for production (supports ALLOWED_ORIGINS env var)
- Add Vercel configuration files (vercel.json, .vercelignore)
- Add Railway configuration (railway.json)
- Update AuthContext and HomePage to use API utility
- Add comprehensive deployment documentation"

echo ""
echo "✅ Changes committed! Now pushing to GitHub..."
echo ""

git push

echo ""
echo "✅ Pushed to GitHub!"
echo ""
echo "📋 NEXT STEP: Deploy Backend to Railway"
echo ""
echo "1. Go to https://railway.app"
echo "2. Sign up with GitHub"
echo "3. New Project → Deploy from GitHub repo"
echo "4. Select: yogasequencing-app"
echo "5. Configure:"
echo "   - Root Directory: backend"
echo "   - Start Command: python -m uvicorn app.main:app --host 0.0.0.0 --port \$PORT"
echo "6. Add environment variables from your backend/.env file"
echo ""
echo "📖 See DEPLOY_CHECKLIST.md for detailed instructions!"
echo ""


