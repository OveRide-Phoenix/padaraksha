from datetime import date
from typing import Optional

from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.articles import Article, WorkStage
from models.inward import PurchaseOrder
from models.production import (
    QcFailure,
    QcInspection,
    ReworkAssignment,
    WorkAssignment,
    WorkCompletion,
)


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class QcFailureCreate(BaseModel):
    work_stage_id: int
    quantity_failed: int


class QcInspectionCreate(BaseModel):
    po_id: int
    article_id: int
    inspection_date: date
    total_inspected: int
    total_passed: int
    total_failed: int
    notes: Optional[str] = None
    failures: list[QcFailureCreate] = []


# ── Helpers ───────────────────────────────────────────────────────────────────

def _create_rework_for_failure(
    qc_failure_id: int,
    po_id: int,
    article_id: int,
    work_stage_id: int,
    quantity_failed: int,
    factory_id: int,
    db: Session,
) -> None:
    """
    Find the most recent non-rework assignment for this article+stage+po,
    then create a rework WorkAssignment and a ReworkAssignment link.
    """
    original_wa = (
        db.query(WorkAssignment)
        .filter(
            WorkAssignment.factory_id == factory_id,
            WorkAssignment.po_id == po_id,
            WorkAssignment.article_id == article_id,
            WorkAssignment.work_stage_id == work_stage_id,
            WorkAssignment.is_rework == False,
        )
        .order_by(WorkAssignment.created_at.desc())
        .first()
    )

    if original_wa is None:
        # No original assignment to rework against — skip silently
        return

    rework_wa = WorkAssignment(
        factory_id=factory_id,
        po_id=po_id,
        article_id=article_id,
        work_stage_id=work_stage_id,
        employee_id=original_wa.employee_id,
        quantity_assigned=quantity_failed,
        start_date=original_wa.start_date,
        is_rework=True,
        notes=f"Rework from QC failure #{qc_failure_id}",
    )
    db.add(rework_wa)
    db.flush()

    link = ReworkAssignment(
        qc_failure_id=qc_failure_id,
        assignment_id=rework_wa.id,
    )
    db.add(link)


# ── Service functions ─────────────────────────────────────────────────────────

def list_qc_inspections(
    factory_id: int, db: Session, po_id: Optional[int] = None
) -> list[dict]:
    q = db.query(QcInspection).filter(QcInspection.factory_id == factory_id)
    if po_id is not None:
        q = q.filter(QcInspection.po_id == po_id)

    inspections = q.order_by(QcInspection.inspection_date.desc()).all()
    result = []
    for insp in inspections:
        po = db.query(PurchaseOrder).filter(PurchaseOrder.id == insp.po_id).first()
        article = db.query(Article).filter(Article.id == insp.article_id).first()
        pass_rate = (
            round(insp.total_passed / insp.total_inspected * 100, 2)
            if insp.total_inspected > 0
            else 0.0
        )
        result.append({
            "id": insp.id,
            "po_id": insp.po_id,
            "po_number": po.po_number if po else None,
            "article_id": insp.article_id,
            "article_number": article.article_number if article else None,
            "inspection_date": insp.inspection_date.isoformat() if insp.inspection_date else None,
            "total_inspected": insp.total_inspected,
            "total_passed": insp.total_passed,
            "total_failed": insp.total_failed,
            "pass_rate": pass_rate,
            "notes": insp.notes,
        })
    return result


def create_qc_inspection(
    factory_id: int, data: QcInspectionCreate, db: Session
) -> QcInspection:
    # Validate PO
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

    inspection = QcInspection(
        factory_id=factory_id,
        po_id=data.po_id,
        article_id=data.article_id,
        inspection_date=data.inspection_date,
        total_inspected=data.total_inspected,
        total_passed=data.total_passed,
        total_failed=data.total_failed,
        notes=data.notes,
    )
    db.add(inspection)
    db.flush()

    for f in data.failures:
        failure = QcFailure(
            inspection_id=inspection.id,
            work_stage_id=f.work_stage_id,
            quantity_failed=f.quantity_failed,
        )
        db.add(failure)
        db.flush()

        _create_rework_for_failure(
            qc_failure_id=failure.id,
            po_id=data.po_id,
            article_id=data.article_id,
            work_stage_id=f.work_stage_id,
            quantity_failed=f.quantity_failed,
            factory_id=factory_id,
            db=db,
        )

    db.commit()
    db.refresh(inspection)
    return inspection
