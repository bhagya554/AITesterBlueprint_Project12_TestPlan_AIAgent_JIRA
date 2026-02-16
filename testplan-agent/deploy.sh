#!/bin/bash

# TestPlan AI Agent - Vercel Deployment Script
# Usage: ./deploy.sh

echo "🚀 TestPlan AI Agent - Vercel Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Check if user is logged in to Vercel
echo "🔍 Checking Vercel login status..."
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Please login to Vercel first:${NC}"
    vercel login
fi

# Build frontend
echo ""
echo "📦 Building frontend..."
cd frontend
npm install
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed!${NC}"
    exit 1
fi

cd ..

# Deploy to Vercel
echo ""
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Set up environment variables in Vercel Dashboard"
echo "   2. Add your API keys (JIRA_TOKEN, GROQ_API_KEY, etc.)"
echo "   3. Redeploy if needed: vercel --prod"
