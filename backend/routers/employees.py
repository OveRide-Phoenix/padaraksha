from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import CurrentUser
from services.employees import (
    AdvanceCreate,
    AttendanceUpsert,
    EmployeeCreate,
    EmployeeUpdate,
)
from services import employees as svc
from utils.dependencies import get_current_user

router = APIRouter()


@router.get("")
def list_employees(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = svc.list_employees(current_user.factory_id, db)
    return {"success": True, "data": data, "message": ""}


@router.post("")
def create_employee(
    body: EmployeeCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    emp = svc.create_employee(current_user.factory_id, body, db)
    return {
        "success": True,
        "data": {
            "id": emp.id,
            "name": emp.name,
            "pay_type": emp.pay_type,
        },
        "message": "Employee created",
    }


@router.put("/{employee_id}")
def update_employee(
    employee_id: int,
    body: EmployeeUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    emp = svc.update_employee(employee_id, current_user.factory_id, body, db)
    return {
        "success": True,
        "data": {
            "id": emp.id,
            "name": emp.name,
            "is_active": emp.is_active,
        },
        "message": "Employee updated",
    }


@router.post("/{employee_id}/attendance")
def log_attendance(
    employee_id: int,
    body: AttendanceUpsert,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = svc.upsert_attendance(employee_id, current_user.factory_id, body, db)
    return {
        "success": True,
        "data": {"id": record.id, "date": record.date.isoformat(), "status": record.status},
        "message": "Attendance logged",
    }


@router.get("/{employee_id}/attendance")
def get_attendance(
    employee_id: int,
    month: Optional[str] = Query(default=None, description="YYYY-MM"),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = svc.list_attendance(employee_id, current_user.factory_id, month, db)
    return {"success": True, "data": data, "message": ""}


@router.post("/{employee_id}/advances")
def log_advance(
    employee_id: int,
    body: AdvanceCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    advance = svc.create_advance(employee_id, current_user.factory_id, body, db)
    return {
        "success": True,
        "data": {
            "id": advance.id,
            "amount": float(advance.amount),
            "advance_date": advance.advance_date.isoformat(),
        },
        "message": "Advance logged",
    }


@router.get("/{employee_id}/advances")
def get_advances(
    employee_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = svc.list_advances(employee_id, current_user.factory_id, db)
    return {"success": True, "data": data, "message": ""}
