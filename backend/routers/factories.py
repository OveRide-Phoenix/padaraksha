from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import CurrentUser
from services.factories import FactoryProfileUpdate, FactoryRegister
from services import factories as factories_service
from utils.dependencies import get_current_user, require_admin

router = APIRouter()


@router.post("")
def register_factory(body: FactoryRegister, db: Session = Depends(get_db)):
    """Create a new factory plus its first admin user. No auth required — this IS the signup."""
    result = factories_service.register_factory(body, db)
    return {"success": True, "data": result.model_dump(), "message": "Factory created"}


@router.get("/me")
def get_my_factory(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = factories_service.get_my_factory(current_user.factory_id, db)
    return {"success": True, "data": data, "message": ""}


@router.put("/me")
def update_my_factory(
    body: FactoryProfileUpdate,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    data = factories_service.update_my_factory(current_user.factory_id, body, db)
    return {"success": True, "data": data, "message": "Factory updated"}
