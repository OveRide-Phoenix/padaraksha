from sqlalchemy import case, func
from sqlalchemy.orm import Session

from models.articles import RawMaterial
from models.production import InventoryTransaction


def get_inventory(factory_id: int, db: Session) -> list[dict]:
    """
    Compute current stock for every raw material in this factory.
    stock = SUM(inward + repurchase) - SUM(consumed + damage)
    Only materials with at least one transaction are returned.
    """
    stock_expr = func.sum(
        case(
            (InventoryTransaction.transaction_type.in_(["inward", "repurchase"]),
             InventoryTransaction.quantity),
            else_=-InventoryTransaction.quantity,
        )
    ).label("stock")

    rows = (
        db.query(
            RawMaterial.id.label("raw_material_id"),
            RawMaterial.name.label("name"),
            RawMaterial.unit.label("unit"),
            stock_expr,
        )
        .join(InventoryTransaction, InventoryTransaction.raw_material_id == RawMaterial.id)
        .filter(
            RawMaterial.factory_id == factory_id,
            InventoryTransaction.factory_id == factory_id,
        )
        .group_by(RawMaterial.id, RawMaterial.name, RawMaterial.unit)
        .order_by(RawMaterial.name)
        .all()
    )

    return [
        {
            "raw_material_id": row.raw_material_id,
            "name": row.name,
            "unit": row.unit,
            "stock": float(row.stock) if row.stock is not None else 0.0,
        }
        for row in rows
    ]
