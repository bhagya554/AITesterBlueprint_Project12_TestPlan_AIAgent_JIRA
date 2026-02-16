"""
Vercel Serverless API Handler
This file serves as the entry point for Vercel serverless functions.
"""
import os
import sys

# Add backend to path
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)

# Import after adding to path
from main import app
from mangum import Mangum

# Create handler for Vercel serverless
handler = Mangum(app, lifespan="off")
