from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import CurrentUser
from services import dashboard as svc
from utils.dependencies import get_current_user

router = APIRouter()


@router.get("/stats")
def get_dashboard_stats(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = svc.get_dashboard_stats(current_user.factory_id, db)
    return {"success": True, "data": data, "message": ""}
