"""
Vercel Serverless API Handler
"""
from main import app
from mangum import Mangum

# Create handler for Vercel serverless
handler = Mangum(app, lifespan="off")
