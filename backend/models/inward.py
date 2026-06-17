from sqlalchemy import Boolean, Column, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import relationship

from database import Base


class ProviderCompany(Base):
    __tablename__ = "provider_companies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    name = Column(String(120), nullable=False)
    gst_number = Column(String(20))
    contact = Column(String(120))
    address = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    purchase_orders = relationship("PurchaseOrder", back_populates="provider")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("provider_companies.id"), nullable=False)
    po_number = Column(String(60), nullable=False)
    po_date = Column(Date, nullable=False)
    arrival_date = Column(Date, nullable=False)
    deadline_date = Column(Date, nullable=False)
    incentive_at_risk = Column(Boolean, default=False, nullable=False)
    delivery_incentive_pct = Column(Numeric(5, 2))
    quality_score = Column(Numeric(5, 2))
    quality_incentive_pct = Column(Numeric(5, 2))
    status = Column(
        Enum("open", "in_progress", "delivered", "overdue"),
        default="open",
        nullable=False,
    )
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    provider = relationship("ProviderCompany", back_populates="purchase_orders")
    line_items = relationship("PoLineItem", back_populates="purchase_order")
    inward_entries = relationship("InwardEntry", back_populates="purchase_order")


class PoLineItem(Base):
    __tablename__ = "po_line_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    article_variant_id = Column(Integer, ForeignKey("article_variants.id"), nullable=False)
    quantity_ordered = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    purchase_order = relationship("PurchaseOrder", back_populates="line_items")


class InwardEntry(Base):
    __tablename__ = "inward_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    received_date = Column(Date, nullable=False)
    received_by = Column(Integer, ForeignKey("users.id"))
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    purchase_order = relationship("PurchaseOrder", back_populates="inward_entries")
    line_items = relationship("InwardLineItem", back_populates="inward_entry")
    department_bills = relationship("DepartmentBill", back_populates="inward_entry")


class InwardLineItem(Base):
    __tablename__ = "inward_line_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    inward_entry_id = Column(Integer, ForeignKey("inward_entries.id"), nullable=False)
    raw_material_id = Column(Integer, ForeignKey("raw_materials.id"), nullable=False)
    expected_quantity = Column(Numeric(10, 4), nullable=False)
    actual_quantity = Column(Numeric(10, 4), nullable=False)
    po_reference_price = Column(Numeric(10, 2))
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    inward_entry = relationship("InwardEntry", back_populates="line_items")


class DepartmentBill(Base):
    __tablename__ = "department_bills"

    id = Column(Integer, primary_key=True, autoincrement=True)
    inward_entry_id = Column(Integer, ForeignKey("inward_entries.id"), nullable=False)
    bill_number = Column(String(80), nullable=False)
    department_name = Column(String(120), nullable=False)
    bill_date = Column(Date, nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    inward_entry = relationship("InwardEntry", back_populates="department_bills")
    items = relationship("DeptBillItem", back_populates="dept_bill")


class DeptBillItem(Base):
    __tablename__ = "dept_bill_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dept_bill_id = Column(Integer, ForeignKey("department_bills.id"), nullable=False)
    raw_material_id = Column(Integer, ForeignKey("raw_materials.id"), nullable=False)
    quantity_dispatched = Column(Numeric(10, 4), nullable=False)
    quantity_short = Column(Numeric(10, 4), default=0, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    dept_bill = relationship("DepartmentBill", back_populates="items")
