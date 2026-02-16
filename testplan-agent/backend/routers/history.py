"""History API endpoints for saved test plans."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from database import get_db, save_test_plan, get_all_test_plans, get_test_plan_by_id, delete_test_plan

router = APIRouter(prefix="/api/history", tags=["history"])


class TestPlanCreate(BaseModel):
    jira_ticket_id: str
    ticket_title: str
    test_plan_content: str
    llm_provider: str
    llm_model: str


class TestPlanResponse(BaseModel):
    id: int
    jira_ticket_id: str
    ticket_title: str
    llm_provider: str
    llm_model: str
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True


class TestPlanDetailResponse(TestPlanResponse):
    test_plan_content: str


@router.get("", response_model=List[TestPlanResponse])
def list_history(db: Session = Depends(get_db)):
    """List all saved test plans."""
    plans = get_all_test_plans(db)
    return [
        {
            "id": p.id,
            "jira_ticket_id": p.jira_ticket_id,
            "ticket_title": p.ticket_title,
            "llm_provider": p.llm_provider,
            "llm_model": p.llm_model,
            "created_at": p.created_at.isoformat() if p.created_at else "",
            "updated_at": p.updated_at.isoformat() if p.updated_at else ""
        }
        for p in plans
    ]


@router.get("/{plan_id}", response_model=TestPlanDetailResponse)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    """Get a specific saved test plan."""
    plan = get_test_plan_by_id(db, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Test plan not found")
    
    return {
        "id": plan.id,
        "jira_ticket_id": plan.jira_ticket_id,
        "ticket_title": plan.ticket_title,
        "test_plan_content": plan.test_plan_content,
        "llm_provider": plan.llm_provider,
        "llm_model": plan.llm_model,
        "created_at": plan.created_at.isoformat() if plan.created_at else "",
        "updated_at": plan.updated_at.isoformat() if plan.updated_at else ""
    }


@router.post("", response_model=TestPlanResponse)
def create_plan(request: TestPlanCreate, db: Session = Depends(get_db)):
    """Save a new test plan to history."""
    plan = save_test_plan(
        db=db,
        jira_ticket_id=request.jira_ticket_id,
        ticket_title=request.ticket_title,
        test_plan_content=request.test_plan_content,
        llm_provider=request.llm_provider,
        llm_model=request.llm_model
    )
    
    return {
        "id": plan.id,
        "jira_ticket_id": plan.jira_ticket_id,
        "ticket_title": plan.ticket_title,
        "llm_provider": plan.llm_provider,
        "llm_model": plan.llm_model,
        "created_at": plan.created_at.isoformat() if plan.created_at else "",
        "updated_at": plan.updated_at.isoformat() if plan.updated_at else ""
    }


@router.delete("/{plan_id}")
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    """Delete a saved test plan."""
    success = delete_test_plan(db, plan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Test plan not found")
    return {"message": "Test plan deleted successfully"}
