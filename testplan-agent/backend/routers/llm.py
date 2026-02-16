"""LLM API endpoints for testing connections and listing models."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from services.llm_provider import get_provider, test_all_providers

router = APIRouter(prefix="/api/llm", tags=["llm"])


class ProviderResponse(BaseModel):
    name: str
    available: bool
    models: List[str]
    error: str = ""


class TestConnectionRequest(BaseModel):
    provider: str


class TestConnectionResponse(BaseModel):
    success: bool
    message: str = ""
    details: Dict[str, Any] = {}


@router.get("/providers")
async def list_providers():
    """List available providers and their status."""
    results = await test_all_providers()
    
    return {
        "providers": [
            {
                "name": "groq",
                "available": results["groq"]["success"],
                "error": results["groq"].get("error", "")
            },
            {
                "name": "ollama",
                "available": results["ollama"]["success"],
                "error": results["ollama"].get("error", "")
            }
        ]
    }


@router.get("/models/{provider}")
async def list_models(provider: str):
    """List models for a provider."""
    try:
        llm_provider = get_provider(provider)
        models = await llm_provider.list_models()
        return {"provider": provider, "models": models}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")


@router.post("/test", response_model=TestConnectionResponse)
async def test_connection(request: TestConnectionRequest):
    """Test LLM connection with a simple prompt."""
    try:
        provider = get_provider(request.provider)
        result = await provider.test_connection()
        
        if result["success"]:
            return TestConnectionResponse(
                success=True,
                message=f"{request.provider.capitalize()} connection successful",
                details=result
            )
        else:
            return TestConnectionResponse(
                success=False,
                message=result.get("error", "Connection failed"),
                details=result
            )
    except Exception as e:
        return TestConnectionResponse(
            success=False,
            message=str(e),
            details={}
        )
