@echo off
chcp 65001 >nul

:: TestPlan AI Agent - Vercel Deployment Script (Windows)
:: Usage: deploy.bat

echo 🚀 TestPlan AI Agent - Vercel Deployment
echo ==========================================
echo.

:: Check if Vercel CLI is installed
where vercel >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ⚠️  Vercel CLI not found. Installing...
    npm install -g vercel
)

:: Check if user is logged in to Vercel
echo 🔍 Checking Vercel login status...
vercel whoami >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ⚠️  Please login to Vercel first:
    vercel login
)

:: Build frontend
echo.
echo 📦 Building frontend...
cd frontend
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ npm install failed!
    exit /b 1
)

call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ Frontend build failed!
    exit /b 1
)

cd ..

:: Deploy to Vercel
echo.
echo 🚀 Deploying to Vercel...
vercel --prod

echo.
echo ✅ Deployment complete!
echo.
echo 📋 Next steps:
echo    1. Set up environment variables in Vercel Dashboard
echo    2. Add your API keys (JIRA_TOKEN, GROQ_API_KEY, etc.)
echo    3. Redeploy if needed: vercel --prod

pause
