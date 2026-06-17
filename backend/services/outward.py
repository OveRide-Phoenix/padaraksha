from datetime import date
from typing import Optional

from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.articles import Article, ArticleVariant, BomItem
from models.inward import PurchaseOrder, ProviderCompany
from models.production import (
    InventoryTransaction,
    OutwardDelivery,
    OutwardLineItem,
    ProviderQcFailure,
    ProviderReturn,
    ReworkAssignment,
    WorkAssignment,
)


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class OutwardLineItemCreate(BaseModel):
    article_variant_id: int
    quantity_dispatched: int
    quantity_shortage: int = 0
    quantity_spoiled: int = 0


class OutwardDeliveryCreate(BaseModel):
    po_id: int
    dispatch_date: date
    total_dispatched: int
    total_shortage: int = 0
    total_spoiled: int = 0
    notes: Optional[str] = None
    line_items: list[OutwardLineItemCreate] = []


class ProviderQcFailureCreate(BaseModel):
    work_stage_id: int
    quantity_failed: int


class ProviderReturnCreate(BaseModel):
    return_date: date
    total_returned: int
    full_return: bool = False
    reason: Optional[str] = None
    failures: list[ProviderQcFailureCreate] = []


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_delivery(delivery_id: int, factory_id: int, db: Session) -> OutwardDelivery:
    delivery = (
        db.query(OutwardDelivery)
        .filter(
            OutwardDelivery.id == delivery_id,
            OutwardDelivery.factory_id == factory_id,
        )
        .first()
    )
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="DELIVERY_NOT_FOUND"
        )
    return delivery


def _create_rework_for_provider_failure(
    pqc_failure_id: int,
    po_id: int,
    work_stage_id: int,
    quantity_failed: int,
    factory_id: int,
    db: Session,
) -> None:
    """
    Find the most recent non-rework assignment for this po+stage,
    create a rework assignment and link it.
    """
    original_wa = (
        db.query(WorkAssignment)
        .filter(
            WorkAssignment.factory_id == factory_id,
            WorkAssignment.po_id == po_id,
            WorkAssignment.work_stage_id == work_stage_id,
            WorkAssignment.is_rework == False,
        )
        .order_by(WorkAssignment.created_at.desc())
        .first()
    )

    if original_wa is None:
        return

    rework_wa = WorkAssignment(
        factory_id=factory_id,
        po_id=po_id,
        article_id=original_wa.article_id,
        work_stage_id=work_stage_id,
        employee_id=original_wa.employee_id,
        quantity_assigned=quantity_failed,
        start_date=original_wa.start_date,
        is_rework=True,
        notes=f"Rework from provider QC return #{pqc_failure_id}",
    )
    db.add(rework_wa)
    db.flush()

    link = ReworkAssignment(
        qc_failure_id=pqc_failure_id,
        assignment_id=rework_wa.id,
    )
    db.add(link)


# ── Service functions ─────────────────────────────────────────────────────────

def list_outward_deliveries(factory_id: int, db: Session) -> list[dict]:
    deliveries = (
        db.query(OutwardDelivery)
        .filter(OutwardDelivery.factory_id == factory_id)
        .order_by(OutwardDelivery.dispatch_date.desc())
        .all()
    )
    result = []
    for d in deliveries:
        po = db.query(PurchaseOrder).filter(PurchaseOrder.id == d.po_id).first()
        provider = (
            db.query(ProviderCompany)
            .filter(ProviderCompany.id == po.provider_id)
            .first()
            if po
            else None
        )
        days_from_arrival = (
            (d.dispatch_date - po.arrival_date).days if po else None
        )
        result.append({
            "id": d.id,
            "po_id": d.po_id,
            "po_number": po.po_number if po else None,
            "provider_name": provider.name if provider else None,
            "dispatch_date": d.dispatch_date.isoformat(),
            "total_dispatched": d.total_dispatched,
            "total_shortage": d.total_shortage,
            "total_spoiled": d.total_spoiled,
            "days_from_po_arrival": days_from_arrival,
            "notes": d.notes,
        })
    return result


def create_outward_delivery(
    factory_id: int, data: OutwardDeliveryCreate, db: Session
) -> OutwardDelivery:
    po = (
        db.query(PurchaseOrder)
        .filter(PurchaseOrder.id == data.po_id, PurchaseOrder.factory_id == factory_id)
        .first()
    )
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PO_NOT_FOUND")

    delivery = OutwardDelivery(
        factory_id=factory_id,
        po_id=data.po_id,
        dispatch_date=data.dispatch_date,
        total_dispatched=data.total_dispatched,
        total_shortage=data.total_shortage,
        total_spoiled=data.total_spoiled,
        notes=data.notes,
    )
    db.add(delivery)
    db.flush()

    for li_data in data.line_items:
        li = OutwardLineItem(
            outward_delivery_id=delivery.id,
            article_variant_id=li_data.article_variant_id,
            quantity_dispatched=li_data.quantity_dispatched,
            quantity_shortage=li_data.quantity_shortage,
            quantity_spoiled=li_data.quantity_spoiled,
        )
        db.add(li)
        db.flush()

        # Create damage inventory transactions for spoiled items
        if li_data.quantity_spoiled > 0:
            # Find article for the variant to look up BOM
            variant = (
                db.query(ArticleVariant)
                .filter(ArticleVariant.id == li_data.article_variant_id)
                .first()
            )
            if variant:
                bom_items = (
                    db.query(BomItem)
                    .filter(
                        BomItem.article_id == variant.article_id,
                        BomItem.valid_to.is_(None),
                    )
                    .all()
                )
                for bom in bom_items:
                    damage_qty = float(bom.quantity) * li_data.quantity_spoiled
                    db.add(InventoryTransaction(
                        factory_id=factory_id,
                        raw_material_id=bom.raw_material_id,
                        transaction_type="damage",
                        quantity=damage_qty,
                        reference_type="outward_delivery",
                        reference_id=delivery.id,
                    ))

    # Update PO status
    if data.total_dispatched > 0:
        po.status = "delivered"

    # Flag incentive eligibility: dispatch within 5 days of arrival
    days_diff = (data.dispatch_date - po.arrival_date).days
    if days_diff <= 5:
        po.incentive_at_risk = True

    db.commit()
    db.refresh(delivery)
    return delivery


def create_provider_return(
    delivery_id: int, factory_id: int, data: ProviderReturnCreate, db: Session
) -> ProviderReturn:
    delivery = _get_delivery(delivery_id, factory_id, db)
    po = (
        db.query(PurchaseOrder)
        .filter(PurchaseOrder.id == delivery.po_id)
        .first()
    )

    prov_return = ProviderReturn(
        factory_id=factory_id,
        outward_delivery_id=delivery_id,
        return_date=data.return_date,
        total_returned=data.total_returned,
        full_return=data.full_return,
        reason=data.reason,
    )
    db.add(prov_return)
    db.flush()

    for f in data.failures:
        pqc = ProviderQcFailure(
            return_id=prov_return.id,
            work_stage_id=f.work_stage_id,
            quantity_failed=f.quantity_failed,
        )
        db.add(pqc)
        db.flush()

        if po:
            _create_rework_for_provider_failure(
                pqc_failure_id=pqc.id,
                po_id=po.id,
                work_stage_id=f.work_stage_id,
                quantity_failed=f.quantity_failed,
                factory_id=factory_id,
                db=db,
            )

    db.commit()
    db.refresh(prov_return)
    return prov_return
