from datetime import date
from typing import Optional

from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from models.articles import WorkStage
from models.payroll import (
    Attendance,
    Deduction,
    Employee,
    PayrollLineItem,
    PayrollRun,
)
from models.production import WorkAssignment, WorkCompletion


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class PayrollCalculateRequest(BaseModel):
    period_start: date
    period_end: date


class PayrollRunRequest(BaseModel):
    period_start: date
    period_end: date
    notes: Optional[str] = None


# ── Core payroll computation ──────────────────────────────────────────────────

def _compute_payroll(factory_id: int, period_start: date, period_end: date, db: Session) -> list[dict]:
    employees = (
        db.query(Employee)
        .filter(Employee.factory_id == factory_id, Employee.is_active == True)
        .all()
    )

    result = []
    for emp in employees:
        # ── Piece-rate pay (non-rework completions in period) ──────────────
        piece_rate_pay = 0.0
        rework_pieces = 0
        total_pieces = 0

        # Completions for non-rework assignments in period
        non_rework_completions = (
            db.query(WorkCompletion, WorkAssignment, WorkStage)
            .join(WorkAssignment, WorkCompletion.assignment_id == WorkAssignment.id)
            .join(WorkStage, WorkAssignment.work_stage_id == WorkStage.id)
            .filter(
                WorkAssignment.factory_id == factory_id,
                WorkAssignment.employee_id == emp.id,
                WorkAssignment.is_rework == False,
                WorkCompletion.end_date >= period_start,
                WorkCompletion.end_date <= period_end,
            )
            .all()
        )
        for completion, assignment, stage in non_rework_completions:
            rate = stage.pay_rate_wfh if emp.sourcing_type == "wfh" else stage.pay_rate_in_house
            earned = float(completion.quantity_completed) * float(rate) / 100
            piece_rate_pay += earned
            total_pieces += completion.quantity_completed

        # Rework completions in period (for reporting only — no pay)
        rework_completions = (
            db.query(func.sum(WorkCompletion.quantity_completed))
            .join(WorkAssignment, WorkCompletion.assignment_id == WorkAssignment.id)
            .filter(
                WorkAssignment.factory_id == factory_id,
                WorkAssignment.employee_id == emp.id,
                WorkAssignment.is_rework == True,
                WorkCompletion.end_date >= period_start,
                WorkCompletion.end_date <= period_end,
            )
            .scalar()
        )
        rework_pieces = int(rework_completions or 0)

        # ── Attendance in period ───────────────────────────────────────────
        attendance_records = (
            db.query(Attendance)
            .filter(
                Attendance.employee_id == emp.id,
                Attendance.factory_id == factory_id,
                Attendance.date >= period_start,
                Attendance.date <= period_end,
            )
            .all()
        )
        days_present = sum(
            1 for a in attendance_records if a.status == "present"
        ) + sum(
            0.5 for a in attendance_records if a.status == "half_day"
        )
        days_absent = sum(1 for a in attendance_records if a.status == "absent")

        # ── Fixed pay (fixed / hybrid workers) ────────────────────────────
        fixed_pay = 0.0
        if emp.pay_type in ("fixed", "hybrid") and emp.fixed_wage:
            fixed_pay = float(emp.fixed_wage) * days_present

        # ── Deductions (unlinked, in period) ──────────────────────────────
        deduction_rows = (
            db.query(Deduction)
            .filter(
                Deduction.employee_id == emp.id,
                Deduction.factory_id == factory_id,
                Deduction.deduction_date >= period_start,
                Deduction.deduction_date <= period_end,
                Deduction.payroll_run_id.is_(None),
            )
            .all()
        )
        total_deductions = sum(float(d.amount) for d in deduction_rows)

        gross_pay = round(piece_rate_pay + fixed_pay, 2)
        net_pay = round(gross_pay - total_deductions, 2)

        result.append({
            "employee_id": emp.id,
            "employee_name": emp.name,
            "pay_type": emp.pay_type,
            "piece_rate_pay": round(piece_rate_pay, 2),
            "rework_pieces": rework_pieces,
            "total_pieces": total_pieces,
            "fixed_pay": round(fixed_pay, 2),
            "total_deductions": round(total_deductions, 2),
            "gross_pay": gross_pay,
            "net_pay": net_pay,
            "days_present": days_present,
            "days_absent": days_absent,
            "_deduction_ids": [d.id for d in deduction_rows],  # used internally for linking
        })

    return result


# ── Public service functions ──────────────────────────────────────────────────

def preview_payroll(
    factory_id: int, data: PayrollCalculateRequest, db: Session
) -> list[dict]:
    rows = _compute_payroll(factory_id, data.period_start, data.period_end, db)
    # Strip internal keys before returning
    return [{k: v for k, v in row.items() if not k.startswith("_")} for row in rows]


def run_payroll(factory_id: int, data: PayrollRunRequest, db: Session) -> PayrollRun:
    rows = _compute_payroll(factory_id, data.period_start, data.period_end, db)

    payroll_run = PayrollRun(
        factory_id=factory_id,
        period_start=data.period_start,
        period_end=data.period_end,
        notes=data.notes,
        finalized=True,
    )
    db.add(payroll_run)
    db.flush()

    for row in rows:
        line_item = PayrollLineItem(
            payroll_run_id=payroll_run.id,
            employee_id=row["employee_id"],
            gross_pay=row["gross_pay"],
            piece_rate_pay=row["piece_rate_pay"],
            fixed_pay=row["fixed_pay"],
            total_deductions=row["total_deductions"],
            net_pay=row["net_pay"],
            total_pieces=row["total_pieces"],
            rework_pieces=row["rework_pieces"],
            days_present=int(row["days_present"]),
            days_absent=row["days_absent"],
        )
        db.add(line_item)

        # Link deductions to this run
        if row["_deduction_ids"]:
            db.query(Deduction).filter(
                Deduction.id.in_(row["_deduction_ids"])
            ).update({"payroll_run_id": payroll_run.id}, synchronize_session=False)

    db.commit()
    db.refresh(payroll_run)
    return payroll_run


def list_payroll_runs(factory_id: int, db: Session) -> list[dict]:
    runs = (
        db.query(PayrollRun)
        .filter(PayrollRun.factory_id == factory_id)
        .order_by(PayrollRun.created_at.desc())
        .all()
    )
    result = []
    for run in runs:
        total_net = sum(float(li.net_pay) for li in run.line_items)
        result.append({
            "id": run.id,
            "period_start": run.period_start.isoformat(),
            "period_end": run.period_end.isoformat(),
            "finalized": run.finalized,
            "created_at": run.created_at.isoformat(),
            "total_net_pay": round(total_net, 2),
            "notes": run.notes,
        })
    return result


def get_payroll_run_detail(run_id: int, factory_id: int, db: Session) -> dict:
    run = (
        db.query(PayrollRun)
        .filter(PayrollRun.id == run_id, PayrollRun.factory_id == factory_id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PAYROLL_RUN_NOT_FOUND")

    line_items = []
    for li in run.line_items:
        emp = db.query(Employee).filter(Employee.id == li.employee_id).first()
        line_items.append({
            "id": li.id,
            "employee_id": li.employee_id,
            "employee_name": emp.name if emp else None,
            "gross_pay": float(li.gross_pay),
            "piece_rate_pay": float(li.piece_rate_pay),
            "fixed_pay": float(li.fixed_pay),
            "total_deductions": float(li.total_deductions),
            "net_pay": float(li.net_pay),
            "total_pieces": li.total_pieces,
            "rework_pieces": li.rework_pieces,
            "days_present": li.days_present,
            "days_absent": li.days_absent,
        })

    return {
        "id": run.id,
        "period_start": run.period_start.isoformat(),
        "period_end": run.period_end.isoformat(),
        "finalized": run.finalized,
        "created_at": run.created_at.isoformat(),
        "notes": run.notes,
        "line_items": line_items,
    }
