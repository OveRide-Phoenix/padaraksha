from datetime import date, timedelta
from typing import Optional

from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.articles import Article, ArticleVariant
from models.inward import (
    DepartmentBill,
    DeptBillItem,
    InwardEntry,
    InwardLineItem,
    PoLineItem,
    ProviderCompany,
    PurchaseOrder,
)
from models.production import InventoryTransaction


# ── Pydantic schemas (kept in service to avoid schema sprawl) ──────────────────

class PoCreate(BaseModel):
    provider_id: int
    po_number: str
    po_date: date
    arrival_date: date
    notes: Optional[str] = None


class PoLineItemCreate(BaseModel):
    article_variant_id: int
    quantity_ordered: int


class DeptBillItemCreate(BaseModel):
    raw_material_id: int
    quantity_dispatched: float
    quantity_short: float = 0


class DeptBillCreate(BaseModel):
    bill_number: str
    department_name: str
    bill_date: date
    items: list[DeptBillItemCreate] = []


class InwardLineItemCreate(BaseModel):
    raw_material_id: int
    expected_quantity: float
    actual_quantity: float
    po_reference_price: Optional[float] = None


class InwardEntryCreate(BaseModel):
    received_date: date
    notes: Optional[str] = None
    line_items: list[InwardLineItemCreate] = []
    dept_bills: list[DeptBillCreate] = []


# ── Service helpers ────────────────────────────────────────────────────────────

def _get_po(po_id: int, factory_id: int, db: Session) -> PurchaseOrder:
    po = (
        db.query(PurchaseOrder)
        .filter(PurchaseOrder.id == po_id, PurchaseOrder.factory_id == factory_id)
        .first()
    )
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PO_NOT_FOUND")
    return po


def _days_remaining(deadline: date) -> int:
    return (deadline - date.today()).days


def _variant_label(variant_id: int, db: Session) -> Optional[dict]:
    variant = db.query(ArticleVariant).filter(ArticleVariant.id == variant_id).first()
    if not variant:
        return None
    article = db.query(Article).filter(Article.id == variant.article_id).first()
    return {
        "id": variant.id,
        "article_id": variant.article_id,
        "article_number": article.article_number if article else None,
        "colour": variant.colour,
        "size": variant.size,
        "foot": variant.foot,
    }


# ── PO service functions ───────────────────────────────────────────────────────

def list_purchase_orders(factory_id: int, db: Session) -> list[dict]:
    pos = (
        db.query(PurchaseOrder)
        .join(ProviderCompany, PurchaseOrder.provider_id == ProviderCompany.id)
        .filter(PurchaseOrder.factory_id == factory_id)
        .order_by(PurchaseOrder.arrival_date.desc())
        .all()
    )
    return [
        {
            "id": po.id,
            "po_number": po.po_number,
            "po_date": po.po_date.isoformat(),
            "arrival_date": po.arrival_date.isoformat(),
            "deadline_date": po.deadline_date.isoformat(),
            "days_remaining": _days_remaining(po.deadline_date),
            "status": po.status,
            "provider_id": po.provider_id,
            "provider_name": po.provider.name,
            "notes": po.notes,
        }
        for po in pos
    ]


def create_purchase_order(factory_id: int, data: PoCreate, db: Session) -> PurchaseOrder:
    # Validate provider belongs to factory
    provider = (
        db.query(ProviderCompany)
        .filter(ProviderCompany.id == data.provider_id, ProviderCompany.factory_id == factory_id)
        .first()
    )
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PROVIDER_NOT_FOUND")

    deadline = data.arrival_date + timedelta(days=5)
    po = PurchaseOrder(
        factory_id=factory_id,
        provider_id=data.provider_id,
        po_number=data.po_number,
        po_date=data.po_date,
        arrival_date=data.arrival_date,
        deadline_date=deadline,
        notes=data.notes,
        status="open",
    )
    db.add(po)
    db.commit()
    db.refresh(po)
    return po


def get_purchase_order_detail(po_id: int, factory_id: int, db: Session) -> dict:
    po = _get_po(po_id, factory_id, db)
    return {
        "id": po.id,
        "po_number": po.po_number,
        "po_date": po.po_date.isoformat(),
        "arrival_date": po.arrival_date.isoformat(),
        "deadline_date": po.deadline_date.isoformat(),
        "days_remaining": _days_remaining(po.deadline_date),
        "status": po.status,
        "provider_id": po.provider_id,
        "provider_name": po.provider.name,
        "notes": po.notes,
        "line_items": [
            {
                "id": li.id,
                "article_variant_id": li.article_variant_id,
                "quantity_ordered": li.quantity_ordered,
                "variant": _variant_label(li.article_variant_id, db),
            }
            for li in po.line_items
        ],
        "inward_entries": [
            {
                "id": ie.id,
                "received_date": ie.received_date.isoformat(),
                "notes": ie.notes,
            }
            for ie in po.inward_entries
        ],
    }


def add_po_line_item(po_id: int, factory_id: int, data: PoLineItemCreate, db: Session) -> PoLineItem:
    _get_po(po_id, factory_id, db)
    item = PoLineItem(
        po_id=po_id,
        article_variant_id=data.article_variant_id,
        quantity_ordered=data.quantity_ordered,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def create_inward_entry(
    po_id: int, factory_id: int, data: InwardEntryCreate, db: Session
) -> InwardEntry:
    po = _get_po(po_id, factory_id, db)

    entry = InwardEntry(
        factory_id=factory_id,
        po_id=po_id,
        received_date=data.received_date,
        notes=data.notes,
    )
    db.add(entry)
    db.flush()

    # Inward line items + inventory transactions
    for li_data in data.line_items:
        li = InwardLineItem(
            inward_entry_id=entry.id,
            raw_material_id=li_data.raw_material_id,
            expected_quantity=li_data.expected_quantity,
            actual_quantity=li_data.actual_quantity,
            po_reference_price=li_data.po_reference_price,
        )
        db.add(li)
        db.flush()

        txn = InventoryTransaction(
            factory_id=factory_id,
            raw_material_id=li_data.raw_material_id,
            transaction_type="inward",
            quantity=li_data.actual_quantity,
            reference_type="inward_entry",
            reference_id=entry.id,
        )
        db.add(txn)

    # Department bills
    for bill_data in data.dept_bills:
        bill = DepartmentBill(
            inward_entry_id=entry.id,
            bill_number=bill_data.bill_number,
            department_name=bill_data.department_name,
            bill_date=bill_data.bill_date,
        )
        db.add(bill)
        db.flush()

        for bi_data in bill_data.items:
            db.add(DeptBillItem(
                dept_bill_id=bill.id,
                raw_material_id=bi_data.raw_material_id,
                quantity_dispatched=bi_data.quantity_dispatched,
                quantity_short=bi_data.quantity_short,
            ))

    # Update PO status
    if po.status == "open":
        po.status = "in_progress"

    db.commit()
    db.refresh(entry)
    return entry


def list_inward_entries(factory_id: int, db: Session) -> list[dict]:
    entries = (
        db.query(InwardEntry)
        .filter(InwardEntry.factory_id == factory_id)
        .order_by(InwardEntry.received_date.desc())
        .all()
    )
    return [
        {
            "id": ie.id,
            "received_date": ie.received_date.isoformat(),
            "po_id": ie.po_id,
            "po_number": ie.purchase_order.po_number,
            "provider_name": ie.purchase_order.provider.name,
            "notes": ie.notes,
        }
        for ie in entries
    ]
