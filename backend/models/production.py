from sqlalchemy import Boolean, Column, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import relationship

from database import Base


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    raw_material_id = Column(Integer, ForeignKey("raw_materials.id"), nullable=False)
    transaction_type = Column(
        Enum("inward", "consumed", "damage", "repurchase"), nullable=False
    )
    quantity = Column(Numeric(10, 4), nullable=False)
    reference_type = Column(String(40))
    reference_id = Column(Integer)
    notes = Column(Text)
    transacted_at = Column(DateTime, server_default=func.now(), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class WorkAssignment(Base):
    __tablename__ = "work_assignments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    work_stage_id = Column(Integer, ForeignKey("work_stages.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    quantity_assigned = Column(Integer, nullable=False)
    start_date = Column(DateTime, nullable=False)
    notes = Column(Text)
    is_rework = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    completions = relationship("WorkCompletion", back_populates="assignment")


class WorkCompletion(Base):
    __tablename__ = "work_completions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    assignment_id = Column(Integer, ForeignKey("work_assignments.id"), nullable=False)
    quantity_completed = Column(Integer, nullable=False)
    end_date = Column(DateTime, nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    assignment = relationship("WorkAssignment", back_populates="completions")


class QcInspection(Base):
    __tablename__ = "qc_inspections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    inspected_by = Column(Integer, ForeignKey("users.id"))
    inspection_date = Column(DateTime, nullable=False)
    total_inspected = Column(Integer, nullable=False)
    total_passed = Column(Integer, nullable=False)
    total_failed = Column(Integer, nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    failures = relationship("QcFailure", back_populates="inspection")


class QcFailure(Base):
    __tablename__ = "qc_failures"

    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_id = Column(Integer, ForeignKey("qc_inspections.id"), nullable=False)
    work_stage_id = Column(Integer, ForeignKey("work_stages.id"), nullable=False)
    quantity_failed = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    inspection = relationship("QcInspection", back_populates="failures")


class ReworkAssignment(Base):
    __tablename__ = "rework_assignments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    qc_failure_id = Column(Integer, ForeignKey("qc_failures.id"), nullable=False)
    assignment_id = Column(Integer, ForeignKey("work_assignments.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class OutwardDelivery(Base):
    __tablename__ = "outward_deliveries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    dispatch_date = Column(Date, nullable=False)
    dispatched_by = Column(Integer, ForeignKey("users.id"))
    total_dispatched = Column(Integer, nullable=False)
    total_shortage = Column(Integer, default=0, nullable=False)
    total_spoiled = Column(Integer, default=0, nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    line_items = relationship("OutwardLineItem", back_populates="outward_delivery")
    provider_returns = relationship("ProviderReturn", back_populates="outward_delivery")


class OutwardLineItem(Base):
    __tablename__ = "outward_line_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    outward_delivery_id = Column(Integer, ForeignKey("outward_deliveries.id"), nullable=False)
    article_variant_id = Column(Integer, ForeignKey("article_variants.id"), nullable=False)
    quantity_dispatched = Column(Integer, nullable=False)
    quantity_shortage = Column(Integer, default=0, nullable=False)
    quantity_spoiled = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    outward_delivery = relationship("OutwardDelivery", back_populates="line_items")


class ProviderReturn(Base):
    __tablename__ = "provider_returns"

    id = Column(Integer, primary_key=True, autoincrement=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    outward_delivery_id = Column(Integer, ForeignKey("outward_deliveries.id"), nullable=False)
    rework_of_return_id = Column(Integer, ForeignKey("provider_returns.id"))
    return_date = Column(Date, nullable=False)
    total_returned = Column(Integer, nullable=False)
    full_return = Column(Boolean, default=False, nullable=False)
    reason = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    outward_delivery = relationship("OutwardDelivery", back_populates="provider_returns")
    qc_failures = relationship("ProviderQcFailure", back_populates="provider_return")
    line_items = relationship("ProviderReturnLineItem", back_populates="provider_return")
    rework_of = relationship("ProviderReturn", remote_side=[id])


class ProviderQcFailure(Base):
    __tablename__ = "provider_qc_failures"

    id = Column(Integer, primary_key=True, autoincrement=True)
    return_id = Column(Integer, ForeignKey("provider_returns.id"), nullable=False)
    work_stage_id = Column(Integer, ForeignKey("work_stages.id"), nullable=False)
    quantity_failed = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    provider_return = relationship("ProviderReturn", back_populates="qc_failures")


class ProviderReturnLineItem(Base):
    __tablename__ = "provider_return_line_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    return_id = Column(Integer, ForeignKey("provider_returns.id"), nullable=False)
    article_variant_id = Column(Integer, ForeignKey("article_variants.id"), nullable=False)
    quantity_reported_by_unit = Column(Integer, default=0, nullable=False)
    quantity_counted_by_company = Column(Integer, default=0, nullable=False)
    quantity_damaged = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    provider_return = relationship("ProviderReturn", back_populates="line_items")
