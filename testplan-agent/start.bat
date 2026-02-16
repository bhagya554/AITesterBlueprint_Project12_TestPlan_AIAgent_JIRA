@echo off
echo.
echo ==========================================
echo    TestPlan Agent - Starting Server
echo ==========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo [1/5] Installing backend dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo Error: Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo [2/5] Installing frontend dependencies...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo Error: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo [3/5] Building frontend...
call npm run build
if errorlevel 1 (
    echo Error: Failed to build frontend
    pause
    exit /b 1
)

echo.
echo [4/5] Copying build to backend...
cd ..
if exist backend\static rmdir /s /q backend\static
xcopy /e /i /q frontend\dist backend\static >nul

echo.
echo [5/5] Starting server...
echo.
echo ==========================================
echo    TestPlan Agent is starting...
echo.
echo    Open http://localhost:8000 in your browser
echo ==========================================
echo.

cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000

pause
