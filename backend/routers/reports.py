from datetime import date as date_type
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import CurrentUser
from services import reports as svc
from utils.dependencies import get_current_user

router = APIRouter()


@router.get("/daily-workers")
def daily_workers_report(
    date: Optional[date_type] = Query(default=None),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report_date = date or date_type.today()
    data = svc.get_daily_workers_report(current_user.factory_id, report_date, db)
    return {"success": True, "data": data, "message": ""}


@router.get("/inventory")
def inventory_report(
    date: Optional[date_type] = Query(default=None),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report_date = date or date_type.today()
    data = svc.get_inventory_report(current_user.factory_id, report_date, db)
    return {"success": True, "data": data, "message": ""}


@router.get("/damage")
def damage_report(
    start_date: date_type = Query(...),
    end_date: date_type = Query(...),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = svc.get_damage_report(current_user.factory_id, start_date, end_date, db)
    return {"success": True, "data": data, "message": ""}


@router.get("/po-status")
def po_status_report(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = svc.get_po_status_report(current_user.factory_id, db)
    return {"success": True, "data": data, "message": ""}


@router.get("/completed")
def completed_report(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = svc.get_completed_report(current_user.factory_id, year, month, db)
    return {"success": True, "data": data, "message": ""}
