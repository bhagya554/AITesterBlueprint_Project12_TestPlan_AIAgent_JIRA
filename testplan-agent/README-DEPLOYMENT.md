# TestPlan AI Agent - Deployment Guide

## Overview
This project consists of:
- **Frontend**: React + Vite (deployed to Vercel)
- **Backend**: FastAPI + SQLite (needs separate hosting)

---

## GitHub Repository
Code is hosted at:
```
https://github.com/bhagya554/AITesterBlueprint_Project12_TestPlan_AIAgent_JIRA
```

---

## Frontend Deployment (Vercel)

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import from GitHub: Select `AITesterBlueprint_Project12_TestPlan_AIAgent_JIRA`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `testplan-agent/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   ```
   VITE_API_BASE_URL=https://your-backend-url.com/api
   ```
6. Click **Deploy**

### Option 2: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd testplan-agent/frontend

# Deploy
vercel --prod
```

---

## Backend Deployment Options

Since Vercel doesn't support SQLite and long-running Python processes well, use one of these alternatives:

### Option 1: Render (Recommended - Free Tier)

1. Go to [Render](https://render.com)
2. Create a new **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `testplan-agent/backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables from your `.env` file:
   ```
   JIRA_BASE_URL=https://your-domain.atlassian.net
   JIRA_EMAIL=your-email@example.com
   JIRA_API_TOKEN=your-token
   GROQ_API_KEY=your-groq-key
   ```
6. Deploy

### Option 2: Railway

1. Go to [Railway](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Add variables from `.env` file
4. Deploy

### Option 3: Fly.io

```bash
# Install flyctl
winget install FlyIo.flyctl

# Navigate to backend
cd testplan-agent/backend

# Launch
flyctl launch

# Set secrets
flyctl secrets set JIRA_BASE_URL=https://your-domain.atlassian.net
flyctl secrets set JIRA_EMAIL=your-email@example.com
flyctl secrets set JIRA_API_TOKEN=your-token
flyctl secrets set GROQ_API_KEY=your-groq-key

# Deploy
flyctl deploy
```

---

## Environment Variables

### Frontend (.env.production)
```env
VITE_API_BASE_URL=https://your-backend-url.com/api
```

### Backend (set in hosting platform)
```env
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-token
GROQ_API_KEY=your-groq-key
GROQ_DEFAULT_MODEL=llama-3.3-70b-versatile
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama3.1
DEFAULT_PROVIDER=groq
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=4096
TEMPLATE_PATH=../testplan.pdf
```

---

## Local Development

### Start Backend
```bash
cd testplan-agent/backend
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Start Frontend
```bash
cd testplan-agent/frontend
npm install
npm run dev
```

Open: http://localhost:5173

---

## Troubleshooting

### Frontend can't connect to backend
- Update `VITE_API_BASE_URL` in Vercel environment variables
- Ensure CORS is configured on backend

### Backend deployment issues
- Check that all environment variables are set
- Ensure SQLite database directory is writable
- Verify Python version (3.10+)

---

## Project Structure
```
testplan-agent/
├── backend/           # FastAPI backend
│   ├── main.py
│   ├── routers/
│   ├── services/
│   └── requirements.txt
├── frontend/          # React frontend
│   ├── src/
│   ├── dist/
│   └── package.json
├── vercel.json        # Vercel configuration
└── README.md
```
