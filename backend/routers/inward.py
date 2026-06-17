from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import CurrentUser
from services.inward import (
    InwardEntryCreate,
    PoCreate,
    PoLineItemCreate,
)
from services import inward as svc
from utils.dependencies import get_current_user

router = APIRouter()


# ── Purchase Orders ────────────────────────────────────────────────────────────

@router.get("/purchase-orders")
def list_purchase_orders(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = svc.list_purchase_orders(current_user.factory_id, db)
    return {"success": True, "data": data, "message": ""}


@router.post("/purchase-orders")
def create_purchase_order(
    body: PoCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    po = svc.create_purchase_order(current_user.factory_id, body, db)
    return {
        "success": True,
        "data": {
            "id": po.id,
            "po_number": po.po_number,
            "deadline_date": po.deadline_date.isoformat(),
            "status": po.status,
        },
        "message": "Purchase order created",
    }


@router.get("/purchase-orders/{po_id}")
def get_purchase_order(
    po_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = svc.get_purchase_order_detail(po_id, current_user.factory_id, db)
    return {"success": True, "data": data, "message": ""}


@router.post("/purchase-orders/{po_id}/line-items")
def add_po_line_item(
    po_id: int,
    body: PoLineItemCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = svc.add_po_line_item(po_id, current_user.factory_id, body, db)
    return {
        "success": True,
        "data": {"id": item.id, "article_variant_id": item.article_variant_id, "quantity_ordered": item.quantity_ordered},
        "message": "Line item added",
    }


@router.post("/purchase-orders/{po_id}/inward-entry")
def create_inward_entry(
    po_id: int,
    body: InwardEntryCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = svc.create_inward_entry(po_id, current_user.factory_id, body, db)
    return {
        "success": True,
        "data": {"id": entry.id, "received_date": entry.received_date.isoformat()},
        "message": "Inward entry created",
    }


# ── Inward Entries ─────────────────────────────────────────────────────────────

@router.get("/inward-entries")
def list_inward_entries(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = svc.list_inward_entries(current_user.factory_id, db)
    return {"success": True, "data": data, "message": ""}
