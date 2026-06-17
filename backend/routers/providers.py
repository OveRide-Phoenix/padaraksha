from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import CurrentUser
from services.providers import ProviderCreate
from services import providers as svc
from utils.dependencies import get_current_user

router = APIRouter()


def _provider_out(p) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "gst_number": p.gst_number,
        "contact": p.contact,
        "is_active": p.is_active,
    }


@router.get("")
def list_providers(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    providers = svc.list_providers(current_user.factory_id, db)
    return {"success": True, "data": [_provider_out(p) for p in providers], "message": ""}


@router.post("")
def create_provider(
    body: ProviderCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    provider = svc.create_provider(current_user.factory_id, body, db)
    return {"success": True, "data": _provider_out(provider), "message": "Provider created"}
