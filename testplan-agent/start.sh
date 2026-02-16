#!/bin/bash

echo ""
echo "=========================================="
echo "   TestPlan Agent - Starting Server"
echo "=========================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "Error: Python is not installed"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

PYTHON_CMD=$(command -v python3 || command -v python)

echo "[1/5] Installing backend dependencies..."
cd backend
$PYTHON_CMD -m pip install -r requirements.txt || {
    echo "Error: Failed to install backend dependencies"
    exit 1
}

echo ""
echo "[2/5] Installing frontend dependencies..."
cd ../frontend
npm install || {
    echo "Error: Failed to install frontend dependencies"
    exit 1
}

echo ""
echo "[3/5] Building frontend..."
npm run build || {
    echo "Error: Failed to build frontend"
    exit 1
}

echo ""
echo "[4/5] Copying build to backend..."
cd ..
rm -rf backend/static
cp -r frontend/dist backend/static

echo ""
echo "[5/5] Starting server..."
echo ""
echo "=========================================="
echo "   TestPlan Agent is starting..."
echo ""
echo "   Open http://localhost:8000 in your browser"
echo "=========================================="
echo ""

cd backend
$PYTHON_CMD -m uvicorn main:app --host 0.0.0.0 --port 8000
