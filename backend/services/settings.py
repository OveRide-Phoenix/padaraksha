from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.settings import ExpenseLineItem, FactoryCostSettings


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class FactoryCostSettingsUpsert(BaseModel):
    tailor_wage_in_house: float
    tailor_wage_wfh: float
    helper_wage_in_house: float
    helper_wage_wfh: float
    esi_pf_pct: float = 16.25
    margin_pct: float = 25.00
    festival_bonus_pct: float = 50.00
    festival_sweet_amount: float = 0.00
    snacks_amount_per_day: float = 0.00
    total_staff_capacity: int = 1
    working_days_per_month: int = 24


class ExpenseLineItemCreate(BaseModel):
    particular: str
    amount: float


class ExpenseLineItemUpdate(BaseModel):
    particular: Optional[str] = None
    amount: Optional[float] = None
    is_active: Optional[bool] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _settings_out(s: FactoryCostSettings) -> dict:
    return {
        "id": s.id,
        "tailor_wage_in_house": float(s.tailor_wage_in_house),
        "tailor_wage_wfh": float(s.tailor_wage_wfh),
        "helper_wage_in_house": float(s.helper_wage_in_house),
        "helper_wage_wfh": float(s.helper_wage_wfh),
        "esi_pf_pct": float(s.esi_pf_pct),
        "margin_pct": float(s.margin_pct),
        "festival_bonus_pct": float(s.festival_bonus_pct),
        "festival_sweet_amount": float(s.festival_sweet_amount),
        "snacks_amount_per_day": float(s.snacks_amount_per_day),
        "total_staff_capacity": s.total_staff_capacity,
        "working_days_per_month": s.working_days_per_month,
        "valid_from": s.valid_from.isoformat(),
    }


def _expense_out(e: ExpenseLineItem) -> dict:
    return {
        "id": e.id,
        "particular": e.particular,
        "amount": float(e.amount),
        "is_active": e.is_active,
    }


# ── Cost settings (versioned — one active row per factory at a time) ─────────

def get_current_cost_settings(factory_id: int, db: Session) -> FactoryCostSettings:
    settings = (
        db.query(FactoryCostSettings)
        .filter(FactoryCostSettings.factory_id == factory_id, FactoryCostSettings.valid_to.is_(None))
        .order_by(FactoryCostSettings.valid_from.desc())
        .first()
    )
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="COST_SETTINGS_NOT_CONFIGURED"
        )
    return settings


def get_current_cost_settings_or_none(factory_id: int, db: Session) -> FactoryCostSettings | None:
    return (
        db.query(FactoryCostSettings)
        .filter(FactoryCostSettings.factory_id == factory_id, FactoryCostSettings.valid_to.is_(None))
        .order_by(FactoryCostSettings.valid_from.desc())
        .first()
    )


def upsert_cost_settings(
    factory_id: int, data: FactoryCostSettingsUpsert, db: Session
) -> FactoryCostSettings:
    """
    Replace the factory's cost settings. Closes the currently active row
    (valid_to) and opens a new one — preserving history so past costing
    can be reconstructed with the wage/margin policy in effect at the time.
    """
    existing = get_current_cost_settings_or_none(factory_id, db)
    if existing:
        existing.valid_to = datetime.now(timezone.utc)

    new_settings = FactoryCostSettings(factory_id=factory_id, **data.model_dump())
    db.add(new_settings)
    db.commit()
    db.refresh(new_settings)
    return new_settings


# ── Overhead expense line items ───────────────────────────────────────────────

def list_expense_line_items(factory_id: int, db: Session) -> list[dict]:
    items = (
        db.query(ExpenseLineItem)
        .filter(ExpenseLineItem.factory_id == factory_id, ExpenseLineItem.is_active == True)
        .order_by(ExpenseLineItem.id)
        .all()
    )
    return [_expense_out(i) for i in items]


def create_expense_line_item(
    factory_id: int, data: ExpenseLineItemCreate, db: Session
) -> ExpenseLineItem:
    item = ExpenseLineItem(factory_id=factory_id, particular=data.particular, amount=data.amount)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def _get_expense_line_item(item_id: int, factory_id: int, db: Session) -> ExpenseLineItem:
    item = (
        db.query(ExpenseLineItem)
        .filter(ExpenseLineItem.id == item_id, ExpenseLineItem.factory_id == factory_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="EXPENSE_ITEM_NOT_FOUND")
    return item


def update_expense_line_item(
    item_id: int, factory_id: int, data: ExpenseLineItemUpdate, db: Session
) -> ExpenseLineItem:
    item = _get_expense_line_item(item_id, factory_id, db)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


def delete_expense_line_item(item_id: int, factory_id: int, db: Session) -> None:
    item = _get_expense_line_item(item_id, factory_id, db)
    item.is_active = False
    db.commit()
