"""Generator API endpoints for test plan generation."""
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from services.jira_client import jira_client
from services.template_parser import template_parser
from services.llm_provider import get_provider
from services.prompt_builder import prompt_builder
from services.export_service import export_service

router = APIRouter(prefix="/api/generate", tags=["generator"])


class GenerateRequest(BaseModel):
    jira_ticket_id: str
    additional_context: str = ""
    llm_provider: str = "groq"
    llm_model: str = ""
    temperature: float = 0.3
    max_tokens: int = 4096


class ExportRequest(BaseModel):
    content: str
    jira_ticket_id: str
    title: str


@router.post("/stream")
async def generate_stream(request: GenerateRequest):
    """SSE endpoint for streaming test plan generation."""
    
    async def event_generator():
        try:
            # Status: Fetching JIRA
            yield f"data: {json.dumps({'type': 'status', 'message': 'Fetching JIRA ticket...'})}\n\n"
            
            try:
                jira_ticket = await jira_client.get_ticket(request.jira_ticket_id)
            except ValueError as e:
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                return
            
            # Status: Parsing template
            yield f"data: {json.dumps({'type': 'status', 'message': 'Parsing template...'})}\n\n"
            
            try:
                template_structure = template_parser.parse_template()
            except FileNotFoundError as e:
                # Use default template structure
                template_structure = template_parser.get_default_template_structure()
                yield f"data: {json.dumps({'type': 'status', 'message': 'Using default template structure...'})}\n\n"
            
            # Truncate context if needed
            jira_ticket = prompt_builder.truncate_context_if_needed(jira_ticket)
            
            # Build prompt
            prompt = prompt_builder.build_prompt(
                jira_ticket,
                template_structure,
                request.additional_context
            )
            
            # Status: Generating
            yield f"data: {json.dumps({'type': 'status', 'message': 'Generating test plan...'})}\n\n"
            
            # Get LLM provider
            try:
                provider = get_provider(request.llm_provider)
            except ValueError as e:
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                return
            
            # Stream generation
            model = request.llm_model or (
                "llama-3.3-70b-versatile" if request.llm_provider == "groq" else "llama3.1"
            )
            
            async for chunk in provider.generate_stream(
                prompt=prompt,
                model=model,
                temperature=request.temperature,
                max_tokens=request.max_tokens
            ):
                yield f"data: {json.dumps({'type': 'content', 'text': chunk})}\n\n"
            
            # Done
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'Generation failed: {str(e)}'})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.post("/export/pdf")
async def export_pdf(request: ExportRequest):
    """Generate and return test plan as PDF file."""
    try:
        pdf_bytes = export_service.generate_pdf(
            content=request.content,
            jira_ticket_id=request.jira_ticket_id,
            title=request.title
        )
        
        from fastapi.responses import Response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=test_plan_{request.jira_ticket_id}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@router.post("/export/docx")
async def export_docx(request: ExportRequest):
    """Generate and return test plan as DOCX file."""
    try:
        docx_bytes = export_service.generate_docx(
            content=request.content,
            jira_ticket_id=request.jira_ticket_id,
            title=request.title
        )
        
        from fastapi.responses import Response
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename=test_plan_{request.jira_ticket_id}.docx"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DOCX generation failed: {str(e)}")
