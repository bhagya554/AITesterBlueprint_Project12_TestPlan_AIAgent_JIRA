"""Configuration management for TestPlan Agent."""
import os
from pathlib import Path
from typing import Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings
from dotenv import load_dotenv, set_key

# Load .env file
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)


def strip_quotes(value: str) -> str:
    """Strip surrounding quotes from a string value."""
    if isinstance(value, str):
        value = value.strip()
        if (value.startswith("'") and value.endswith("'")) or \
           (value.startswith('"') and value.endswith('"')):
            print(f"[DEBUG] Stripping quotes from: {value[:30]}...")
            value = value[1:-1]
            print(f"[DEBUG] Result: {value[:30]}... (length: {len(value)})")
    return value


class Settings(BaseSettings):
    """Application settings loaded from .env file."""
    
    # JIRA Configuration
    jira_base_url: str = ""
    jira_email: str = ""
    jira_api_token: str = ""
    
    # Groq Configuration
    groq_api_key: str = ""
    groq_default_model: str = "llama-3.3-70b-versatile"
    
    # Ollama Configuration
    ollama_base_url: str = "http://localhost:11434"
    ollama_default_model: str = "llama3.1"
    
    # LLM Settings
    default_provider: str = "groq"
    llm_temperature: float = 0.3
    llm_max_tokens: int = 4096
    
    # Template
    template_path: str = "../testplan.pdf"
    
    # Validators to strip quotes from all string fields
    _validate_jira_base_url = field_validator('jira_base_url', mode='before')(strip_quotes)
    _validate_jira_email = field_validator('jira_email', mode='before')(strip_quotes)
    _validate_jira_api_token = field_validator('jira_api_token', mode='before')(strip_quotes)
    _validate_groq_api_key = field_validator('groq_api_key', mode='before')(strip_quotes)
    _validate_groq_default_model = field_validator('groq_default_model', mode='before')(strip_quotes)
    _validate_ollama_base_url = field_validator('ollama_base_url', mode='before')(strip_quotes)
    _validate_ollama_default_model = field_validator('ollama_default_model', mode='before')(strip_quotes)
    _validate_default_provider = field_validator('default_provider', mode='before')(strip_quotes)
    _validate_template_path = field_validator('template_path', mode='before')(strip_quotes)
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()


def update_settings(key: str, value: str) -> None:
    """Update a setting in the .env file."""
    set_key(env_path, key.upper(), value)
    # Reload settings
    load_dotenv(env_path, override=True)
    # Update current settings object
    setattr(settings, key.lower(), value)


def get_settings_dict(mask_secrets: bool = True) -> dict:
    """Get settings as a dictionary."""
    result = {
        "jira": {
            "base_url": settings.jira_base_url,
            "email": settings.jira_email,
            "api_token": "***" if mask_secrets and settings.jira_api_token else settings.jira_api_token,
        },
        "groq": {
            "api_key": "***" if mask_secrets and settings.groq_api_key else settings.groq_api_key,
            "default_model": settings.groq_default_model,
        },
        "ollama": {
            "base_url": settings.ollama_base_url,
            "default_model": settings.ollama_default_model,
        },
        "llm": {
            "default_provider": settings.default_provider,
            "temperature": settings.llm_temperature,
            "max_tokens": settings.llm_max_tokens,
        },
        "template": {
            "path": settings.template_path,
        },
    }
    return result
