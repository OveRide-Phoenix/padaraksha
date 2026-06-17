from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import CurrentUser
from services.qc import QcInspectionCreate
from services import qc as svc
from utils.dependencies import get_current_user

router = APIRouter()


@router.get("")
def list_qc_inspections(
    po_id: Optional[int] = Query(default=None),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = svc.list_qc_inspections(current_user.factory_id, db, po_id=po_id)
    return {"success": True, "data": data, "message": ""}


@router.post("")
def create_qc_inspection(
    body: QcInspectionCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inspection = svc.create_qc_inspection(current_user.factory_id, body, db)
    return {
        "success": True,
        "data": {
            "id": inspection.id,
            "total_inspected": inspection.total_inspected,
            "total_passed": inspection.total_passed,
            "total_failed": inspection.total_failed,
        },
        "message": "QC inspection created",
    }
