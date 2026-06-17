from datetime import date
from typing import Optional
import calendar

from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.payroll import Advance, Attendance, Employee


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class EmployeeCreate(BaseModel):
    name: str
    role: Optional[str] = None
    pay_type: str  # fixed | piece_rate | hybrid
    fixed_wage: Optional[float] = None
    join_date: date
    phone: Optional[str] = None
    notes: Optional[str] = None


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    pay_type: Optional[str] = None
    fixed_wage: Optional[float] = None
    is_active: Optional[bool] = None
    phone: Optional[str] = None
    notes: Optional[str] = None


class AttendanceUpsert(BaseModel):
    date: date
    status: str  # present | absent | half_day
    notes: Optional[str] = None


class AdvanceCreate(BaseModel):
    amount: float
    advance_date: date
    notes: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_employee(employee_id: int, factory_id: int, db: Session) -> Employee:
    emp = (
        db.query(Employee)
        .filter(Employee.id == employee_id, Employee.factory_id == factory_id)
        .first()
    )
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="EMPLOYEE_NOT_FOUND")
    return emp


def _employee_out(e: Employee) -> dict:
    return {
        "id": e.id,
        "name": e.name,
        "role": e.role,
        "pay_type": e.pay_type,
        "fixed_wage": float(e.fixed_wage) if e.fixed_wage is not None else None,
        "join_date": e.join_date.isoformat(),
        "is_active": e.is_active,
        "phone": e.phone,
        "notes": e.notes,
    }


# ── Service functions ─────────────────────────────────────────────────────────

def list_employees(factory_id: int, db: Session) -> list[dict]:
    employees = (
        db.query(Employee)
        .filter(Employee.factory_id == factory_id, Employee.is_active == True)
        .order_by(Employee.name)
        .all()
    )
    return [_employee_out(e) for e in employees]


def create_employee(factory_id: int, data: EmployeeCreate, db: Session) -> Employee:
    emp = Employee(
        factory_id=factory_id,
        name=data.name,
        role=data.role,
        pay_type=data.pay_type,
        fixed_wage=data.fixed_wage,
        join_date=data.join_date,
        phone=data.phone,
        notes=data.notes,
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


def update_employee(
    employee_id: int, factory_id: int, data: EmployeeUpdate, db: Session
) -> Employee:
    emp = _get_employee(employee_id, factory_id, db)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(emp, field, value)
    db.commit()
    db.refresh(emp)
    return emp


def upsert_attendance(
    employee_id: int, factory_id: int, data: AttendanceUpsert, db: Session
) -> Attendance:
    _get_employee(employee_id, factory_id, db)

    existing = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee_id,
            Attendance.factory_id == factory_id,
            Attendance.date == data.date,
        )
        .first()
    )
    if existing:
        existing.status = data.status
        existing.notes = data.notes
        db.commit()
        db.refresh(existing)
        return existing

    record = Attendance(
        factory_id=factory_id,
        employee_id=employee_id,
        date=data.date,
        status=data.status,
        notes=data.notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_attendance(
    employee_id: int, factory_id: int, month: Optional[str], db: Session
) -> list[dict]:
    _get_employee(employee_id, factory_id, db)

    if month:
        try:
            year, mon = int(month[:4]), int(month[5:7])
        except (ValueError, IndexError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="INVALID_MONTH_FORMAT: expected YYYY-MM",
            )
        _, last_day = calendar.monthrange(year, mon)
        start = date(year, mon, 1)
        end = date(year, mon, last_day)
    else:
        today = date.today()
        _, last_day = calendar.monthrange(today.year, today.month)
        start = date(today.year, today.month, 1)
        end = date(today.year, today.month, last_day)

    records = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee_id,
            Attendance.factory_id == factory_id,
            Attendance.date >= start,
            Attendance.date <= end,
        )
        .order_by(Attendance.date)
        .all()
    )
    return [
        {
            "id": r.id,
            "date": r.date.isoformat(),
            "status": r.status,
            "notes": r.notes,
        }
        for r in records
    ]


def create_advance(
    employee_id: int, factory_id: int, data: AdvanceCreate, db: Session
) -> Advance:
    _get_employee(employee_id, factory_id, db)

    advance = Advance(
        factory_id=factory_id,
        employee_id=employee_id,
        amount=data.amount,
        advance_date=data.advance_date,
        notes=data.notes,
    )
    db.add(advance)
    db.commit()
    db.refresh(advance)
    return advance


def list_advances(employee_id: int, factory_id: int, db: Session) -> list[dict]:
    _get_employee(employee_id, factory_id, db)

    advances = (
        db.query(Advance)
        .filter(
            Advance.employee_id == employee_id,
            Advance.factory_id == factory_id,
            Advance.recovered == False,
        )
        .order_by(Advance.advance_date.desc())
        .all()
    )
    return [
        {
            "id": a.id,
            "amount": float(a.amount),
            "advance_date": a.advance_date.isoformat(),
            "notes": a.notes,
            "recovered": a.recovered,
        }
        for a in advances
    ]
