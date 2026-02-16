"""FastAPI main application entry point."""
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from routers import jira, generator, history, settings, llm, template

# Create FastAPI app
app = FastAPI(
    title="TestPlan Agent",
    description="AI-powered test plan generator for JIRA tickets",
    version="1.0.0"
)

# Configure CORS - allow all origins in production for flexibility
import os

# Dynamic CORS origins
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# Add VERCEL_URL if available (for preview deployments)
vercel_url = os.environ.get('VERCEL_URL')
if vercel_url:
    ALLOWED_ORIGINS.append(f"https://{vercel_url}")

# Allow any vercel.app domain in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if not os.environ.get('VERCEL_ENV') else ["*"],
    allow_credentials=True if not os.environ.get('VERCEL_ENV') else False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "TestPlan Agent"}


# Include routers
app.include_router(jira.router)
app.include_router(generator.router)
app.include_router(history.router)
app.include_router(settings.router)
app.include_router(llm.router)
app.include_router(template.router)


# Serve static files (React build) - ONLY if not running in dev mode
# Static files must be mounted LAST to not interfere with API routes
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir) and os.environ.get("DEV_MODE") != "true":
    # Use a catch-all route for SPA - but only for non-API routes
    from fastapi.responses import FileResponse
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't serve static files for API routes
        if full_path.startswith("api/"):
            return {"detail": "Not Found"}
        index_path = os.path.join(static_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"detail": "Not Found"}


# Vercel serverless handler
from fastapi.responses import JSONResponse
from mangum import Mangum

# Create handler for AWS Lambda / Vercel
try:
    handler = Mangum(app, lifespan="off")
except ImportError:
    # Mangum not installed, skip for local dev
    handler = None

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
