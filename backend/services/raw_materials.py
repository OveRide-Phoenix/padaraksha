from sqlalchemy.orm import Session

from models.articles import RawMaterial


def list_raw_materials(factory_id: int, db: Session) -> list[RawMaterial]:
    return (
        db.query(RawMaterial)
        .filter(RawMaterial.factory_id == factory_id, RawMaterial.is_active == True)
        .order_by(RawMaterial.name)
        .all()
    )


def find_or_create(factory_id: int, name: str, unit: str, db: Session) -> RawMaterial:
    existing = (
        db.query(RawMaterial)
        .filter(RawMaterial.factory_id == factory_id, RawMaterial.name == name.strip())
        .first()
    )
    if existing:
        return existing
    mat = RawMaterial(factory_id=factory_id, name=name.strip(), unit=unit.strip() or "piece")
    db.add(mat)
    db.commit()
    db.refresh(mat)
    return mat
