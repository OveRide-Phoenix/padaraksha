from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import CurrentUser
from services.production import WorkAssignmentCreate, WorkCompletionCreate
from services import production as svc
from utils.dependencies import get_current_user

router = APIRouter()


@router.get("/work-assignments")
def list_work_assignments(
    po_id: Optional[int] = Query(default=None),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = svc.list_work_assignments(current_user.factory_id, db, po_id=po_id)
    return {"success": True, "data": data, "message": ""}


@router.post("/work-assignments")
def create_work_assignment(
    body: WorkAssignmentCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wa = svc.create_work_assignment(current_user.factory_id, body, db)
    return {
        "success": True,
        "data": {
            "id": wa.id,
            "is_rework": wa.is_rework,
            "quantity_assigned": wa.quantity_assigned,
        },
        "message": "Work assignment created",
    }


@router.post("/work-assignments/{assignment_id}/completions")
def log_completion(
    assignment_id: int,
    body: WorkCompletionCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    completion = svc.log_completion(assignment_id, current_user.factory_id, body, db)
    return {
        "success": True,
        "data": {
            "id": completion.id,
            "quantity_completed": completion.quantity_completed,
            "end_date": completion.end_date.isoformat() if completion.end_date else None,
        },
        "message": "Completion logged",
    }
