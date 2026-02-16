"""Template API endpoints."""
from fastapi import APIRouter, HTTPException
from services.template_parser import template_parser

router = APIRouter(prefix="/api/template", tags=["template"])


@router.get("/preview")
async def preview_template():
    """Parse and return template structure."""
    try:
        structure = template_parser.parse_template()
        return structure
    except FileNotFoundError as e:
        # Return default structure
        return template_parser.get_default_template_structure()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Template parsing failed: {str(e)}")


@router.get("/default")
async def default_template():
    """Return default template structure."""
    return template_parser.get_default_template_structure()
