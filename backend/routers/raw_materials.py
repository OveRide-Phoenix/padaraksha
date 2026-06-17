from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import CurrentUser
from services import raw_materials as svc
from utils.dependencies import get_current_user

router = APIRouter()


class RawMaterialIn(BaseModel):
    name: str
    unit: str = "piece"


@router.get("")
def list_raw_materials(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mats = svc.list_raw_materials(current_user.factory_id, db)
    return {
        "success": True,
        "data": [{"id": m.id, "name": m.name, "unit": m.unit} for m in mats],
        "message": "",
    }


@router.post("")
def find_or_create(
    body: RawMaterialIn,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mat = svc.find_or_create(current_user.factory_id, body.name, body.unit, db)
    return {"success": True, "data": {"id": mat.id, "name": mat.name, "unit": mat.unit}, "message": ""}
