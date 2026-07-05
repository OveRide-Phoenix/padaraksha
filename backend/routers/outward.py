from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import CurrentUser
from services.outward import OutwardDeliveryCreate, ProviderReturnCreate
from services import outward as svc
from utils.dependencies import get_current_user

router = APIRouter()


@router.get("")
def list_outward_deliveries(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = svc.list_outward_deliveries(current_user.factory_id, db)
    return {"success": True, "data": data, "message": ""}


@router.post("")
def create_outward_delivery(
    body: OutwardDeliveryCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delivery = svc.create_outward_delivery(current_user.factory_id, body, db)
    return {
        "success": True,
        "data": {
            "id": delivery.id,
            "dispatch_date": delivery.dispatch_date.isoformat(),
            "total_dispatched": delivery.total_dispatched,
        },
        "message": "Outward delivery created",
    }


@router.post("/{delivery_id}/provider-return")
def create_provider_return(
    delivery_id: int,
    body: ProviderReturnCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pr = svc.create_provider_return(delivery_id, current_user.factory_id, body, db)
    return {
        "success": True,
        "data": {
            "id": pr.id,
            "return_date": pr.return_date.isoformat(),
            "total_returned": pr.total_returned,
        },
        "message": "Provider return logged",
    }


@router.get("/{delivery_id}")
def get_outward_delivery(
    delivery_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = svc.get_outward_delivery_detail(delivery_id, current_user.factory_id, db)
    return {"success": True, "data": data, "message": ""}


@router.get("/{delivery_id}/provider-returns")
def list_provider_returns(
    delivery_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = svc.list_provider_returns_for_delivery(delivery_id, current_user.factory_id, db)
    return {"success": True, "data": data, "message": ""}
