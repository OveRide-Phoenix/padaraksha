from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.inward import ProviderCompany


class ProviderCreate(BaseModel):
    name: str
    gst_number: str | None = None
    contact: str | None = None
    address: str | None = None


def list_providers(factory_id: int, db: Session) -> list[ProviderCompany]:
    return (
        db.query(ProviderCompany)
        .filter(ProviderCompany.factory_id == factory_id, ProviderCompany.is_active == True)
        .order_by(ProviderCompany.name)
        .all()
    )


def get_provider(provider_id: int, factory_id: int, db: Session) -> ProviderCompany:
    provider = (
        db.query(ProviderCompany)
        .filter(ProviderCompany.id == provider_id, ProviderCompany.factory_id == factory_id)
        .first()
    )
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PROVIDER_NOT_FOUND")
    return provider


def create_provider(factory_id: int, data: ProviderCreate, db: Session) -> ProviderCompany:
    provider = ProviderCompany(
        factory_id=factory_id,
        name=data.name,
        gst_number=data.gst_number,
        contact=data.contact,
        address=data.address,
    )
    db.add(provider)
    db.commit()
    db.refresh(provider)
    return provider
