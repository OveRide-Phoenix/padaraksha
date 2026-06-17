from datetime import date
from typing import Optional

from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from models.articles import Article, BomItem, WorkStage
from models.payroll import Employee
from models.inward import PurchaseOrder
from models.production import InventoryTransaction, WorkAssignment, WorkCompletion


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class WorkAssignmentCreate(BaseModel):
    po_id: int
    article_id: int
    work_stage_id: int
    employee_id: int
    quantity_assigned: int
    start_date: date
    notes: Optional[str] = None
    is_rework: bool = False


class WorkCompletionCreate(BaseModel):
    quantity_completed: int
    end_date: date
    notes: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_assignment(assignment_id: int, factory_id: int, db: Session) -> WorkAssignment:
    wa = (
        db.query(WorkAssignment)
        .filter(
            WorkAssignment.id == assignment_id,
            WorkAssignment.factory_id == factory_id,
        )
        .first()
    )
    if not wa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ASSIGNMENT_NOT_FOUND")
    return wa


# ── Service functions ─────────────────────────────────────────────────────────

def list_work_assignments(factory_id: int, db: Session, po_id: Optional[int] = None) -> list[dict]:
    # Subquery: total completed per assignment
    completed_sq = (
        db.query(
            WorkCompletion.assignment_id.label("assignment_id"),
            func.sum(WorkCompletion.quantity_completed).label("total_completed"),
        )
        .group_by(WorkCompletion.assignment_id)
        .subquery()
    )

    q = (
        db.query(WorkAssignment)
        .filter(WorkAssignment.factory_id == factory_id)
    )
    if po_id is not None:
        q = q.filter(WorkAssignment.po_id == po_id)

    assignments = q.order_by(WorkAssignment.start_date.desc()).all()

    # Build employee + stage + PO lookup in bulk
    result = []
    for wa in assignments:
        employee = db.query(Employee).filter(Employee.id == wa.employee_id).first()
        stage = db.query(WorkStage).filter(WorkStage.id == wa.work_stage_id).first()
        article = db.query(Article).filter(Article.id == wa.article_id).first()
        po = db.query(PurchaseOrder).filter(PurchaseOrder.id == wa.po_id).first()

        total_completed = (
            db.query(func.sum(WorkCompletion.quantity_completed))
            .filter(WorkCompletion.assignment_id == wa.id)
            .scalar()
            or 0
        )

        result.append({
            "id": wa.id,
            "po_id": wa.po_id,
            "po_number": po.po_number if po else None,
            "article_id": wa.article_id,
            "article_number": article.article_number if article else None,
            "work_stage_id": wa.work_stage_id,
            "stage_name": stage.name if stage else None,
            "employee_id": wa.employee_id,
            "employee_name": employee.name if employee else None,
            "quantity_assigned": wa.quantity_assigned,
            "total_completed": int(total_completed),
            "start_date": wa.start_date.isoformat() if wa.start_date else None,
            "is_rework": wa.is_rework,
            "notes": wa.notes,
        })
    return result


def create_work_assignment(
    factory_id: int, data: WorkAssignmentCreate, db: Session
) -> WorkAssignment:
    # Validate PO belongs to factory
    po = (
        db.query(PurchaseOrder)
        .filter(PurchaseOrder.id == data.po_id, PurchaseOrder.factory_id == factory_id)
        .first()
    )
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PO_NOT_FOUND")

    # Validate article
    article = (
        db.query(Article)
        .filter(Article.id == data.article_id, Article.factory_id == factory_id)
        .first()
    )
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ARTICLE_NOT_FOUND")

    # Validate work stage belongs to article
    stage = (
        db.query(WorkStage)
        .filter(WorkStage.id == data.work_stage_id, WorkStage.article_id == data.article_id)
        .first()
    )
    if not stage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="WORK_STAGE_NOT_FOUND")

    # Validate employee belongs to factory
    employee = (
        db.query(Employee)
        .filter(Employee.id == data.employee_id, Employee.factory_id == factory_id)
        .first()
    )
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="EMPLOYEE_NOT_FOUND")

    wa = WorkAssignment(
        factory_id=factory_id,
        po_id=data.po_id,
        article_id=data.article_id,
        work_stage_id=data.work_stage_id,
        employee_id=data.employee_id,
        quantity_assigned=data.quantity_assigned,
        start_date=data.start_date,
        notes=data.notes,
        is_rework=data.is_rework,
    )
    db.add(wa)
    db.flush()

    # Deduct inventory only for non-rework assignments
    if not data.is_rework:
        bom_items = (
            db.query(BomItem)
            .filter(BomItem.article_id == data.article_id, BomItem.valid_to.is_(None))
            .all()
        )
        for bom in bom_items:
            consumed_qty = float(bom.quantity) * data.quantity_assigned
            txn = InventoryTransaction(
                factory_id=factory_id,
                raw_material_id=bom.raw_material_id,
                transaction_type="consumed",
                quantity=consumed_qty,
                reference_type="work_assignment",
                reference_id=wa.id,
            )
            db.add(txn)

    db.commit()
    db.refresh(wa)
    return wa


def log_completion(
    assignment_id: int, factory_id: int, data: WorkCompletionCreate, db: Session
) -> WorkCompletion:
    wa = _get_assignment(assignment_id, factory_id, db)

    if data.quantity_completed > wa.quantity_assigned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="QUANTITY_EXCEEDS_ASSIGNED",
        )

    completion = WorkCompletion(
        assignment_id=assignment_id,
        quantity_completed=data.quantity_completed,
        end_date=data.end_date,
        notes=data.notes,
    )
    db.add(completion)
    db.commit()
    db.refresh(completion)
    return completion
