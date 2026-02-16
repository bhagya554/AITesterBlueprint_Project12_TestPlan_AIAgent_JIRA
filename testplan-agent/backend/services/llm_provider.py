"""LLM Provider abstraction for Groq and Ollama."""
import asyncio
from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Dict, Any
import httpx
from groq import Groq
from ollama import AsyncClient as OllamaClient
from config import settings


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""
    
    @abstractmethod
    async def generate_stream(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int
    ) -> AsyncGenerator[str, None]:
        """Generate text with streaming."""
        pass
    
    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        """Test connection to the provider."""
        pass
    
    @abstractmethod
    async def list_models(self) -> List[str]:
        """List available models."""
        pass


class GroqProvider(LLMProvider):
    """Groq cloud LLM provider."""
    
    GROQ_MODELS = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768",
        "gemma2-9b-it"
    ]
    
    def __init__(self):
        self.api_key = settings.groq_api_key
        self.client = Groq(api_key=self.api_key) if self.api_key else None
    
    async def generate_stream(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int
    ) -> AsyncGenerator[str, None]:
        """Generate text using Groq with streaming."""
        if not self.client:
            raise ValueError("Groq API key not configured")
        
        try:
            stream = self.client.chat.completions.create(
                model=model or settings.groq_default_model,
                messages=[
                    {"role": "system", "content": self._get_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True
            )
            
            for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    yield content
        
        except Exception as e:
            error_msg = str(e).lower()
            if "rate limit" in error_msg or "rate_limit" in error_msg:
                # Implement retry with exponential backoff
                for attempt in range(3):
                    await asyncio.sleep(2 ** attempt)
                    try:
                        async for text in self.generate_stream(prompt, model, temperature, max_tokens):
                            yield text
                        return
                    except Exception:
                        if attempt == 2:
                            raise ValueError(f"Groq rate limit hit. Please try again later.")
            elif "authentication" in error_msg or "api key" in error_msg:
                raise ValueError("Groq API key is invalid. Update it in Settings.")
            else:
                raise ValueError(f"Groq error: {str(e)}")
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test Groq connection."""
        if not self.api_key:
            return {"success": False, "error": "API key not configured"}
        
        try:
            response = self.client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": "Say 'Connection successful'"}],
                max_tokens=10
            )
            return {
                "success": True,
                "model_used": response.model,
                "response": response.choices[0].message.content
            }
        except Exception as e:
            error_msg = str(e)
            if "authentication" in error_msg.lower():
                return {"success": False, "error": "API key is invalid"}
            return {"success": False, "error": error_msg}
    
    async def list_models(self) -> List[str]:
        """List available Groq models."""
        return self.GROQ_MODELS
    
    def _get_system_prompt(self) -> str:
        """Get system prompt for test plan generation."""
        return """You are an expert QA Engineer and Test Architect with 15+ years of experience. 
Your task is to generate comprehensive, detailed test plans based on the provided JIRA ticket context. 
You must strictly follow the template structure provided.

Rules:
1. Fill EVERY section of the template with relevant, specific content derived from the JIRA context
2. Generate concrete, actionable test cases (not vague descriptions)
3. Include positive tests, negative tests, edge cases, and boundary conditions
4. Specify clear expected results for each test case
5. Identify risks specific to the described feature/change
6. Use professional QA terminology
7. If information for a section is not available from the JIRA context, state what assumptions you made and provide reasonable defaults
8. Format output in clean Markdown with proper headings matching the template structure"""


class OllamaProvider(LLMProvider):
    """Ollama local LLM provider."""
    
    def __init__(self):
        self.base_url = settings.ollama_base_url
        self.client = OllamaClient(host=self.base_url)
    
    async def generate_stream(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int
    ) -> AsyncGenerator[str, None]:
        """Generate text using Ollama with streaming."""
        try:
            stream = await self.client.generate(
                model=model or settings.ollama_default_model,
                prompt=prompt,
                system=self._get_system_prompt(),
                options={
                    "temperature": temperature,
                    "num_predict": max_tokens
                },
                stream=True
            )
            
            async for chunk in stream:
                if 'response' in chunk:
                    yield chunk['response']
        
        except Exception as e:
            error_msg = str(e).lower()
            if "connection" in error_msg or "refused" in error_msg:
                raise ValueError("Cannot connect to Ollama. Make sure it's running: `ollama serve`")
            elif "not found" in error_msg:
                raise ValueError(f"Model {model} not found. Pull it first: `ollama pull {model}`")
            else:
                raise ValueError(f"Ollama error: {str(e)}")
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test Ollama connection."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/tags",
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                models = [m.get("name", "") for m in data.get("models", [])]
                return {
                    "success": True,
                    "models": models,
                    "model_count": len(models)
                }
        except httpx.ConnectError:
            return {"success": False, "error": "Cannot connect to Ollama. Make sure it's running: `ollama serve`"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def list_models(self) -> List[str]:
        """List available Ollama models."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/tags",
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                return [m.get("name", "") for m in data.get("models", [])]
        except Exception:
            return []
    
    def _get_system_prompt(self) -> str:
        """Get system prompt for test plan generation."""
        return """You are an expert QA Engineer and Test Architect with 15+ years of experience. 
Your task is to generate comprehensive, detailed test plans based on the provided JIRA ticket context. 
You must strictly follow the template structure provided.

Rules:
1. Fill EVERY section of the template with relevant, specific content derived from the JIRA context
2. Generate concrete, actionable test cases (not vague descriptions)
3. Include positive tests, negative tests, edge cases, and boundary conditions
4. Specify clear expected results for each test case
5. Identify risks specific to the described feature/change
6. Use professional QA terminology
7. If information for a section is not available from the JIRA context, state what assumptions you made and provide reasonable defaults
8. Format output in clean Markdown with proper headings matching the template structure"""


def get_provider(provider_name: str) -> LLMProvider:
    """Factory function to get the appropriate LLM provider."""
    provider_name = provider_name.lower()
    if provider_name == "groq":
        return GroqProvider()
    elif provider_name == "ollama":
        return OllamaProvider()
    else:
        raise ValueError(f"Unknown provider: {provider_name}")


async def test_all_providers() -> Dict[str, Any]:
    """Test all configured providers."""
    results = {}
    
    # Test Groq
    groq = GroqProvider()
    results["groq"] = await groq.test_connection()
    
    # Test Ollama
    ollama = OllamaProvider()
    results["ollama"] = await ollama.test_connection()
    
    return results
