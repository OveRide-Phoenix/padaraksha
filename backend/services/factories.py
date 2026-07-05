from typing import Optional

from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.auth import Factory, Role, User
from schemas.auth import TokenResponse
from utils.security import create_access_token, hash_password


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class FactoryRegister(BaseModel):
    name: str
    gst_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    admin_full_name: Optional[str] = None
    admin_username: str
    admin_password: str


class FactoryProfileUpdate(BaseModel):
    name: Optional[str] = None
    gst_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _factory_out(f: Factory) -> dict:
    return {
        "id": f.id,
        "name": f.name,
        "gst_number": f.gst_number,
        "address": f.address,
        "city": f.city,
        "state": f.state,
        "is_active": f.is_active,
    }


# ── Registration (public — no auth yet, this creates the first admin too) ────

def register_factory(data: FactoryRegister, db: Session) -> TokenResponse:
    if len(data.admin_password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PASSWORD_TOO_SHORT")

    factory = Factory(
        name=data.name,
        gst_number=data.gst_number,
        address=data.address,
        city=data.city,
        state=data.state,
    )
    db.add(factory)
    db.flush()

    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        admin_role = Role(name="admin")
        db.add(admin_role)
        db.flush()

    admin_user = User(
        factory_id=factory.id,
        role_id=admin_role.id,
        username=data.admin_username,
        full_name=data.admin_full_name,
        hashed_password=hash_password(data.admin_password),
    )
    db.add(admin_user)
    db.commit()
    db.refresh(factory)
    db.refresh(admin_user)

    token = create_access_token({
        "sub": str(admin_user.id),
        "factory_id": str(factory.id),
        "role": admin_role.name,
    })

    return TokenResponse(
        access_token=token,
        factory_id=factory.id,
        factory_name=factory.name,
        user_id=admin_user.id,
        full_name=admin_user.full_name,
        role=admin_role.name,
    )


# ── Factory profile (authenticated) ───────────────────────────────────────────

def get_my_factory(factory_id: int, db: Session) -> dict:
    factory = db.query(Factory).filter(Factory.id == factory_id).first()
    if not factory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FACTORY_NOT_FOUND")
    return _factory_out(factory)


def update_my_factory(factory_id: int, data: FactoryProfileUpdate, db: Session) -> dict:
    factory = db.query(Factory).filter(Factory.id == factory_id).first()
    if not factory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FACTORY_NOT_FOUND")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(factory, field, value)
    db.commit()
    db.refresh(factory)
    return _factory_out(factory)
