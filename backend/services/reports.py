import calendar
from datetime import date as date_type

from sqlalchemy import func
from sqlalchemy.types import Date
from sqlalchemy.orm import Session

from models.articles import Article, ArticleVariant, RawMaterial, WorkStage
from models.inward import PoLineItem, ProviderCompany, PurchaseOrder
from models.payroll import Attendance, Employee
from models.production import (
    InventoryTransaction,
    OutwardDelivery,
    ProviderReturn,
    ProviderReturnLineItem,
    QcFailure,
    QcInspection,
    WorkAssignment,
    WorkCompletion,
)


# ── 1. Daily Workers Report ───────────────────────────────────────────────────

def get_daily_workers_report(factory_id: int, report_date: date_type, db: Session) -> dict:
    employees = (
        db.query(Employee)
        .filter(Employee.factory_id == factory_id, Employee.is_active == True)
        .all()
    )

    # Pre-fetch attendance for that date keyed by employee_id
    attendance_rows = (
        db.query(Attendance)
        .filter(
            Attendance.factory_id == factory_id,
            Attendance.date == report_date,
        )
        .all()
    )
    attendance_map = {a.employee_id: a.status for a in attendance_rows}

    summary = {
        "total_employees": len(employees),
        "present": 0,
        "absent": 0,
        "half_day": 0,
        "no_record": 0,
    }

    workers = []
    for emp in employees:
        att_status = attendance_map.get(emp.id, "no_record")
        summary[att_status] += 1

        # Non-rework completions on this date
        non_rework = (
            db.query(WorkCompletion, WorkAssignment, WorkStage, Article)
            .join(WorkAssignment, WorkCompletion.assignment_id == WorkAssignment.id)
            .join(WorkStage, WorkAssignment.work_stage_id == WorkStage.id)
            .join(Article, WorkStage.article_id == Article.id)
            .filter(
                WorkAssignment.factory_id == factory_id,
                WorkAssignment.employee_id == emp.id,
                WorkAssignment.is_rework == False,
                func.cast(WorkCompletion.end_date, Date) == report_date,
            )
            .all()
        )

        # Rework completions on this date
        rework_total = (
            db.query(func.coalesce(func.sum(WorkCompletion.quantity_completed), 0))
            .join(WorkAssignment, WorkCompletion.assignment_id == WorkAssignment.id)
            .filter(
                WorkAssignment.factory_id == factory_id,
                WorkAssignment.employee_id == emp.id,
                WorkAssignment.is_rework == True,
                func.cast(WorkCompletion.end_date, Date) == report_date,
            )
            .scalar()
        )

        pieces_completed = sum(c.quantity_completed for c, _a, _s, _art in non_rework)

        assignments = []
        for completion, assignment, stage, article in non_rework:
            assignments.append({
                "article_number": article.article_number,
                "article_name": article.name,
                "stage": stage.name,
                "quantity_assigned": assignment.quantity_assigned,
                "quantity_completed": completion.quantity_completed,
                "is_rework": False,
            })

        workers.append({
            "employee_id": emp.id,
            "name": emp.name,
            "role": emp.role,
            "pay_type": emp.pay_type,
            "attendance": att_status,
            "pieces_completed": pieces_completed,
            "rework_pieces": int(rework_total),
            "assignments": assignments,
        })

    return {
        "date": report_date.isoformat(),
        "summary": summary,
        "workers": workers,
    }


# ── 2. Inventory Report ───────────────────────────────────────────────────────

def get_inventory_report(factory_id: int, report_date: date_type, db: Session) -> dict:
    # Get all active raw materials for this factory
    materials = (
        db.query(RawMaterial)
        .filter(RawMaterial.factory_id == factory_id, RawMaterial.is_active == True)
        .all()
    )

    result_materials = []
    for mat in materials:
        # Check if this material has any transactions at all
        has_tx = (
            db.query(InventoryTransaction)
            .filter(
                InventoryTransaction.factory_id == factory_id,
                InventoryTransaction.raw_material_id == mat.id,
            )
            .first()
        )
        if not has_tx:
            continue

        def _sum_tx(tx_types, up_to_date=None, on_date=None):
            q = db.query(
                func.coalesce(func.sum(InventoryTransaction.quantity), 0)
            ).filter(
                InventoryTransaction.factory_id == factory_id,
                InventoryTransaction.raw_material_id == mat.id,
                InventoryTransaction.transaction_type.in_(tx_types),
            )
            if up_to_date is not None:
                q = q.filter(func.cast(InventoryTransaction.transacted_at, Date) <= up_to_date)
            if on_date is not None:
                q = q.filter(func.cast(InventoryTransaction.transacted_at, Date) == on_date)
            return float(q.scalar())

        total_inward = _sum_tx(["inward", "repurchase"], up_to_date=report_date)
        total_consumed = _sum_tx(["consumed"], up_to_date=report_date)
        total_damaged = _sum_tx(["damage"], up_to_date=report_date)
        current_stock = total_inward - total_consumed - total_damaged

        today_inward = _sum_tx(["inward", "repurchase"], on_date=report_date)
        today_consumed = _sum_tx(["consumed"], on_date=report_date)

        result_materials.append({
            "raw_material_id": mat.id,
            "name": mat.name,
            "unit": mat.unit,
            "total_inward": total_inward,
            "total_consumed": total_consumed,
            "total_damaged": total_damaged,
            "current_stock": current_stock,
            "today_inward": today_inward,
            "today_consumed": today_consumed,
        })

    return {
        "as_of": report_date.isoformat(),
        "materials": result_materials,
    }


# ── 3. Damage Report ──────────────────────────────────────────────────────────

def get_damage_report(factory_id: int, start_date: date_type, end_date: date_type, db: Session) -> dict:
    # QC failures in range
    qc_failure_rows = (
        db.query(QcFailure, QcInspection, WorkStage, Article)
        .join(QcInspection, QcFailure.inspection_id == QcInspection.id)
        .join(WorkStage, QcFailure.work_stage_id == WorkStage.id)
        .join(Article, WorkStage.article_id == Article.id)
        .filter(
            QcInspection.factory_id == factory_id,
            func.cast(QcInspection.inspection_date, Date) >= start_date,
            func.cast(QcInspection.inspection_date, Date) <= end_date,
        )
        .all()
    )

    total_qc_failed = sum(row.quantity_failed for row, _i, _s, _a in qc_failure_rows)

    qc_failures = []
    for failure, inspection, stage, article in qc_failure_rows:
        qc_failures.append({
            "inspection_date": inspection.inspection_date.date().isoformat()
            if hasattr(inspection.inspection_date, "date")
            else inspection.inspection_date.isoformat(),
            "article_number": article.article_number,
            "article_name": article.name,
            "stage": stage.name,
            "quantity_failed": failure.quantity_failed,
        })

    # Rework assignments created in range
    total_rework_assigned = (
        db.query(func.coalesce(func.count(WorkAssignment.id), 0))
        .filter(
            WorkAssignment.factory_id == factory_id,
            WorkAssignment.is_rework == True,
            func.cast(WorkAssignment.start_date, Date) >= start_date,
            func.cast(WorkAssignment.start_date, Date) <= end_date,
        )
        .scalar()
    )

    # Outward spoiled deliveries in range
    spoiled_rows = (
        db.query(OutwardDelivery, PurchaseOrder)
        .join(PurchaseOrder, OutwardDelivery.po_id == PurchaseOrder.id)
        .filter(
            OutwardDelivery.factory_id == factory_id,
            OutwardDelivery.total_spoiled > 0,
            OutwardDelivery.dispatch_date >= start_date,
            OutwardDelivery.dispatch_date <= end_date,
        )
        .all()
    )

    total_outward_spoiled = sum(od.total_spoiled for od, _po in spoiled_rows)

    outward_spoiled = []
    for od, po in spoiled_rows:
        outward_spoiled.append({
            "dispatch_date": od.dispatch_date.isoformat(),
            "po_number": po.po_number,
            "quantity_spoiled": od.total_spoiled,
        })

    # Provider returns in range
    return_rows = (
        db.query(ProviderReturn, OutwardDelivery, PurchaseOrder, ProviderCompany)
        .join(OutwardDelivery, ProviderReturn.outward_delivery_id == OutwardDelivery.id)
        .join(PurchaseOrder, OutwardDelivery.po_id == PurchaseOrder.id)
        .join(ProviderCompany, PurchaseOrder.provider_id == ProviderCompany.id)
        .filter(
            ProviderReturn.factory_id == factory_id,
            ProviderReturn.return_date >= start_date,
            ProviderReturn.return_date <= end_date,
        )
        .all()
    )

    total_provider_returned = sum(pr.total_returned for pr, _od, _po, _pc in return_rows)

    provider_returns = []
    for pr, od, po, pc in return_rows:
        provider_returns.append({
            "return_date": pr.return_date.isoformat(),
            "po_number": po.po_number,
            "provider": pc.name,
            "total_returned": pr.total_returned,
            "full_return": pr.full_return,
            "reason": pr.reason,
        })

    return {
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
        },
        "summary": {
            "total_qc_failed": total_qc_failed,
            "total_rework_assigned": int(total_rework_assigned),
            "total_outward_spoiled": total_outward_spoiled,
            "total_provider_returned": total_provider_returned,
        },
        "qc_failures": qc_failures,
        "outward_spoiled": outward_spoiled,
        "provider_returns": provider_returns,
    }


# ── 4. PO Status Report ───────────────────────────────────────────────────────

def get_po_status_report(factory_id: int, db: Session) -> list[dict]:
    today = date_type.today()

    pos = (
        db.query(PurchaseOrder, ProviderCompany)
        .join(ProviderCompany, PurchaseOrder.provider_id == ProviderCompany.id)
        .filter(PurchaseOrder.factory_id == factory_id)
        .order_by(PurchaseOrder.deadline_date.asc())
        .all()
    )

    result = []
    for po, provider in pos:
        # Collect deduplicated article descriptions from PoLineItem → ArticleVariant → Article
        line_items = (
            db.query(PoLineItem, ArticleVariant, Article)
            .join(ArticleVariant, PoLineItem.article_variant_id == ArticleVariant.id)
            .join(Article, ArticleVariant.article_id == Article.id)
            .filter(PoLineItem.po_id == po.id)
            .all()
        )

        articles_seen = set()
        articles_list = []
        for _li, _av, article in line_items:
            label = f"{article.article_number} {article.name}"
            if label not in articles_seen:
                articles_seen.add(label)
                articles_list.append(label)

        days_remaining = (po.deadline_date - today).days

        result.append({
            "id": po.id,
            "po_number": po.po_number,
            "provider": provider.name,
            "arrival_date": po.arrival_date.isoformat(),
            "deadline_date": po.deadline_date.isoformat(),
            "days_remaining": days_remaining,
            "status": po.status,
            "incentive_at_risk": po.incentive_at_risk,
            "delivery_incentive_pct": float(po.delivery_incentive_pct) if po.delivery_incentive_pct is not None else None,
            "quality_score": float(po.quality_score) if po.quality_score is not None else None,
            "articles": articles_list,
        })

    return result


# ── 5. Completed Report ───────────────────────────────────────────────────────
# Mirrors the "COMPLETED REPORT" tab of COUNTING REPORT FORMAT.xlsx: per-PO
# totals of good (accepted, non-damaged) pairs for a given month, plus a
# month-level total/PO-count/average summary.

def get_completed_report(factory_id: int, year: int, month: int, db: Session) -> dict:
    _, last_day = calendar.monthrange(year, month)
    start_date = date_type(year, month, 1)
    end_date = date_type(year, month, last_day)

    rows = (
        db.query(ProviderReturnLineItem, ProviderReturn, ArticleVariant, Article, PurchaseOrder)
        .join(ProviderReturn, ProviderReturnLineItem.return_id == ProviderReturn.id)
        .join(ArticleVariant, ProviderReturnLineItem.article_variant_id == ArticleVariant.id)
        .join(Article, ArticleVariant.article_id == Article.id)
        .join(OutwardDelivery, ProviderReturn.outward_delivery_id == OutwardDelivery.id)
        .join(PurchaseOrder, OutwardDelivery.po_id == PurchaseOrder.id)
        .filter(
            ProviderReturn.factory_id == factory_id,
            ProviderReturn.return_date >= start_date,
            ProviderReturn.return_date <= end_date,
        )
        .all()
    )

    by_po: dict[int, dict] = {}
    for li, pr, variant, article, po in rows:
        good_qty = li.quantity_counted_by_company - li.quantity_damaged
        entry = by_po.setdefault(po.id, {
            "po_id": po.id,
            "po_number": po.po_number,
            "article_number": article.article_number,
            "article_name": article.name,
            "left_pieces": 0,
            "right_pieces": 0,
            "pair_pieces": 0,
            "first_return_date": pr.return_date,
            "last_return_date": pr.return_date,
        })
        if variant.foot == "left":
            entry["left_pieces"] += good_qty
        elif variant.foot == "right":
            entry["right_pieces"] += good_qty
        else:
            entry["pair_pieces"] += good_qty
        entry["first_return_date"] = min(entry["first_return_date"], pr.return_date)
        entry["last_return_date"] = max(entry["last_return_date"], pr.return_date)

    pos_out = []
    total_production = 0.0
    for entry in by_po.values():
        total_pcs = entry["left_pieces"] + entry["right_pieces"] + entry["pair_pieces"] * 2
        total_pairs = entry["pair_pieces"] + (entry["left_pieces"] + entry["right_pieces"]) / 2
        total_production += total_pairs
        pos_out.append({
            "po_id": entry["po_id"],
            "po_number": entry["po_number"],
            "article_number": entry["article_number"],
            "article_name": entry["article_name"],
            "left_pieces": entry["left_pieces"],
            "right_pieces": entry["right_pieces"],
            "total_pcs": total_pcs,
            "total_pairs": total_pairs,
            "first_return_date": entry["first_return_date"].isoformat(),
            "last_return_date": entry["last_return_date"].isoformat(),
        })

    pos_out.sort(key=lambda p: p["first_return_date"])

    po_count = len(pos_out)
    return {
        "period": {"year": year, "month": month},
        "summary": {
            "total_production": total_production,
            "po_count": po_count,
            "average_production": total_production / po_count if po_count else 0,
        },
        "purchase_orders": pos_out,
    }
