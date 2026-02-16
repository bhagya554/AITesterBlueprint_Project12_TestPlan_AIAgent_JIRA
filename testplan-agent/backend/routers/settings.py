"""Settings API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from config import settings, update_settings, get_settings_dict
from database import get_db, save_setting_to_db

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SettingsUpdate(BaseModel):
    jira_base_url: Optional[str] = None
    jira_email: Optional[str] = None
    jira_api_token: Optional[str] = None
    groq_api_key: Optional[str] = None
    groq_default_model: Optional[str] = None
    ollama_base_url: Optional[str] = None
    ollama_default_model: Optional[str] = None
    default_provider: Optional[str] = None
    llm_temperature: Optional[float] = None
    llm_max_tokens: Optional[int] = None
    template_path: Optional[str] = None


class SettingsResponse(BaseModel):
    jira: dict
    groq: dict
    ollama: dict
    llm: dict
    template: dict


@router.get("", response_model=SettingsResponse)
def get_settings():
    """Get current settings (with secrets masked)."""
    return get_settings_dict(mask_secrets=True)


@router.put("")
def update_settings_endpoint(request: SettingsUpdate, db: Session = Depends(get_db)):
    """Update settings (writes to both .env and database)."""
    import traceback
    
    settings_mapping = {
        "jira_base_url": request.jira_base_url,
        "jira_email": request.jira_email,
        "jira_api_token": request.jira_api_token,
        "groq_api_key": request.groq_api_key,
        "groq_default_model": request.groq_default_model,
        "ollama_base_url": request.ollama_base_url,
        "ollama_default_model": request.ollama_default_model,
        "default_provider": request.default_provider,
        "llm_temperature": str(request.llm_temperature) if request.llm_temperature is not None else None,
        "llm_max_tokens": str(request.llm_max_tokens) if request.llm_max_tokens is not None else None,
        "template_path": request.template_path,
    }
    
    updated = []
    errors = []
    
    for key, value in settings_mapping.items():
        if value is not None:
            try:
                # Update .env file
                update_settings(key, value)
                # Update database
                save_setting_to_db(db, key, value)
                updated.append(key)
            except Exception as e:
                error_msg = f"Failed to update {key}: {str(e)}"
                errors.append(error_msg)
                print(f"[ERROR] {error_msg}")
                traceback.print_exc()
    
    if errors and not updated:
        raise HTTPException(status_code=500, detail={
            "message": "Failed to update settings",
            "errors": errors
        })
    
    return {
        "message": "Settings updated successfully" if not errors else "Settings updated with some errors",
        "updated_fields": updated,
        "errors": errors if errors else None,
        "settings": get_settings_dict(mask_secrets=True)
    }
