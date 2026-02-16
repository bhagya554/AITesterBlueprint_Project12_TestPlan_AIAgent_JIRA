# TestPlan AI Agent - Deployment Guide

## Architecture
This app has two parts:
1. **Frontend** (React + Vite) → Deployed to Vercel
2. **Backend** (FastAPI + Python) → Deploy separately (Render/Railway/Fly.io)

---

## Step 1: Deploy Frontend to Vercel ✅

Your frontend is configured for Vercel deployment.

**Live URL:** https://testplan-agent.vercel.app

---

## Step 2: Deploy Backend (Choose One)

### Option A: Render.com (Recommended - Free)

1. Go to https://dashboard.render.com
2. Click **"New Web Service"**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `testplan-agent-api`
   - **Root Directory**: `testplan-agent/backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables (from your `.env` file):
   ```
   JIRA_BASE_URL=https://your-domain.atlassian.net
   JIRA_EMAIL=your-email@example.com
   JIRA_API_TOKEN=your-token
   GROQ_API_KEY=your-groq-key
   GROQ_DEFAULT_MODEL=llama-3.3-70b-versatile
   DEFAULT_PROVIDER=groq
   LLM_TEMPERATURE=0.3
   LLM_MAX_TOKENS=4096
   TEMPLATE_PATH=../testplan.pdf
   ```
6. Click **Create Web Service**

Your backend will be at: `https://testplan-agent-api.onrender.com`

---

### Option B: Railway.app

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Add your environment variables
4. Deploy

---

### Option C: Fly.io

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

## Step 3: Connect Frontend to Backend

After deploying your backend, update the frontend environment variable:

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   ```
   VITE_API_BASE_URL=https://your-backend-url.com/api
   ```
   (Replace with your actual backend URL)
5. Click **Save**
6. Redeploy the frontend (or push a new commit)

---

## URLs After Deployment

| Service | URL Example |
|---------|-------------|
| Frontend | https://testplan-agent.vercel.app |
| Backend | https://testplan-agent-api.onrender.com |

---

## Local Development

```bash
# Terminal 1 - Backend
cd testplan-agent/backend
pip install -r requirements.txt
uvicorn main:app --reload

# Terminal 2 - Frontend
cd testplan-agent/frontend
npm install
npm run dev
```

---

## Troubleshooting

### CORS Errors
Update `backend/main.py` CORS origins with your Vercel URL:
```python
allow_origins=["https://testplan-agent.vercel.app", "http://localhost:5173"]
```

### API Connection Failed
Check that `VITE_API_BASE_URL` is set correctly in Vercel environment variables.

---

## Summary

| What | Where |
|------|-------|
| Frontend | ✅ Vercel (Auto-deployed) |
| Backend | ⚠️ You need to deploy separately |
| Database | SQLite (included with backend) |
| API Keys | Set in backend hosting platform |
