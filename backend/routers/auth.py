from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import LoginRequest
from services import auth as auth_service

router = APIRouter()


@router.get("/factories")
def list_factories(db: Session = Depends(get_db)):
    """Return all active factory locations for the login screen selector."""
    factories = auth_service.get_factories(db)
    return {
        "success": True,
        "data": [
            {
                "id": f.id,
                "name": f.name,
                "city": f.city,
                "state": f.state,
                "is_active": f.is_active,
            }
            for f in factories
        ],
        "message": "",
    }


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user against a factory. Returns JWT carrying factory_id."""
    result = auth_service.login(request, db)
    return {"success": True, "data": result.model_dump(), "message": ""}
