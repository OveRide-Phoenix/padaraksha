from datetime import date

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from models.articles import RawMaterial
from models.inward import ProviderCompany, PurchaseOrder
from models.payroll import Attendance
from models.production import InventoryTransaction, QcInspection, WorkAssignment, WorkCompletion


def get_dashboard_stats(factory_id: int, db: Session) -> dict:
    today = date.today()

    # ── Today's attendance ────────────────────────────────────────────────────
    attendance_rows = (
        db.query(Attendance.status, func.count(Attendance.id).label("cnt"))
        .filter(Attendance.factory_id == factory_id, Attendance.date == today)
        .group_by(Attendance.status)
        .all()
    )
    att_map = {row.status: row.cnt for row in attendance_rows}
    today_attendance = {
        "present": att_map.get("present", 0),
        "absent": att_map.get("absent", 0),
        "half_day": att_map.get("half_day", 0),
    }

    # ── Low inventory (stock ≤ 10) ────────────────────────────────────────────
    stock_expr = func.sum(
        case(
            (InventoryTransaction.transaction_type.in_(["inward", "repurchase"]),
             InventoryTransaction.quantity),
            else_=-InventoryTransaction.quantity,
        )
    ).label("stock")

    inventory_rows = (
        db.query(
            RawMaterial.id.label("raw_material_id"),
            RawMaterial.name.label("name"),
            RawMaterial.unit.label("unit"),
            stock_expr,
        )
        .join(InventoryTransaction, InventoryTransaction.raw_material_id == RawMaterial.id)
        .filter(
            RawMaterial.factory_id == factory_id,
            InventoryTransaction.factory_id == factory_id,
        )
        .group_by(RawMaterial.id, RawMaterial.name, RawMaterial.unit)
        .having(stock_expr <= 10)
        .order_by(stock_expr.asc())
        .limit(5)
        .all()
    )
    inventory_low = [
        {
            "raw_material_id": row.raw_material_id,
            "name": row.name,
            "unit": row.unit,
            "stock": float(row.stock) if row.stock is not None else 0.0,
        }
        for row in inventory_rows
    ]

    # ── Open POs (not delivered) ──────────────────────────────────────────────
    open_po_rows = (
        db.query(PurchaseOrder, ProviderCompany.name.label("provider_name"))
        .join(ProviderCompany, PurchaseOrder.provider_id == ProviderCompany.id)
        .filter(
            PurchaseOrder.factory_id == factory_id,
            PurchaseOrder.status != "delivered",
        )
        .order_by(PurchaseOrder.deadline_date.asc())
        .limit(5)
        .all()
    )
    open_pos = [
        {
            "id": po.id,
            "po_number": po.po_number,
            "provider_name": provider_name,
            "arrival_date": po.arrival_date.isoformat(),
            "deadline_date": po.deadline_date.isoformat(),
            "days_remaining": (po.deadline_date - today).days,
            "status": po.status,
        }
        for po, provider_name in open_po_rows
    ]

    # ── Today's completions ───────────────────────────────────────────────────
    today_completions = (
        db.query(func.sum(WorkCompletion.quantity_completed))
        .join(WorkAssignment, WorkCompletion.assignment_id == WorkAssignment.id)
        .filter(
            WorkAssignment.factory_id == factory_id,
            WorkCompletion.end_date == today,
        )
        .scalar()
        or 0
    )

    # ── Pending QC (approximate) ──────────────────────────────────────────────
    # Assignments with completions (non-rework) for which no QC inspection exists
    # for that po + article combination
    inspected_pairs = (
        db.query(QcInspection.po_id, QcInspection.article_id)
        .filter(QcInspection.factory_id == factory_id)
        .distinct()
        .all()
    )
    inspected_set = {(r.po_id, r.article_id) for r in inspected_pairs}

    assignments_with_completions = (
        db.query(WorkAssignment.po_id, WorkAssignment.article_id)
        .join(WorkCompletion, WorkCompletion.assignment_id == WorkAssignment.id)
        .filter(
            WorkAssignment.factory_id == factory_id,
            WorkAssignment.is_rework == False,
        )
        .distinct()
        .all()
    )
    pending_qc = sum(
        1
        for r in assignments_with_completions
        if (r.po_id, r.article_id) not in inspected_set
    )

    return {
        "today_attendance": today_attendance,
        "inventory_low": inventory_low,
        "open_pos": open_pos,
        "today_completions": int(today_completions),
        "pending_qc": pending_qc,
    }
