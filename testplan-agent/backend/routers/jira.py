"""JIRA API endpoints."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from services.jira_client import jira_client

router = APIRouter(prefix="/api/jira", tags=["jira"])


class TicketResponse(BaseModel):
    ticket_id: str
    title: str
    issue_type: str
    status: str
    priority: str
    labels: list
    components: list
    description: str
    acceptance_criteria: str
    comments: list
    linked_issues: list
    subtasks: list
    attachments: list


class ConnectionTestResponse(BaseModel):
    success: bool
    display_name: str = ""
    email: str = ""
    account_id: str = ""
    error: str = ""


@router.get("/ticket/{ticket_id}", response_model=TicketResponse)
async def get_ticket(ticket_id: str):
    """Fetch and parse a JIRA ticket by ID."""
    try:
        ticket = await jira_client.get_ticket(ticket_id)
        return ticket
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch ticket: {str(e)}")


@router.get("/test-connection", response_model=ConnectionTestResponse)
async def test_connection():
    """Test JIRA credentials."""
    result = await jira_client.test_connection()
    return ConnectionTestResponse(**result)
