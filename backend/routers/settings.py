from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import CurrentUser
from services.settings import (
    ExpenseLineItemCreate,
    ExpenseLineItemUpdate,
    FactoryCostSettingsUpsert,
)
from services import settings as settings_service
from utils.dependencies import get_current_user

router = APIRouter()


@router.get("/cost")
def get_cost_settings(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = settings_service.get_current_cost_settings_or_none(current_user.factory_id, db)
    return {
        "success": True,
        "data": settings_service._settings_out(settings) if settings else None,
        "message": "",
    }


@router.put("/cost")
def upsert_cost_settings(
    body: FactoryCostSettingsUpsert,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = settings_service.upsert_cost_settings(current_user.factory_id, body, db)
    return {"success": True, "data": settings_service._settings_out(settings), "message": "Cost settings updated"}


@router.get("/expenses")
def list_expenses(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = settings_service.list_expense_line_items(current_user.factory_id, db)
    return {"success": True, "data": data, "message": ""}


@router.post("/expenses")
def create_expense(
    body: ExpenseLineItemCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = settings_service.create_expense_line_item(current_user.factory_id, body, db)
    return {"success": True, "data": settings_service._expense_out(item), "message": "Expense added"}


@router.put("/expenses/{item_id}")
def update_expense(
    item_id: int,
    body: ExpenseLineItemUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = settings_service.update_expense_line_item(item_id, current_user.factory_id, body, db)
    return {"success": True, "data": settings_service._expense_out(item), "message": "Expense updated"}


@router.delete("/expenses/{item_id}")
def delete_expense(
    item_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings_service.delete_expense_line_item(item_id, current_user.factory_id, db)
    return {"success": True, "data": None, "message": "Expense deleted"}
