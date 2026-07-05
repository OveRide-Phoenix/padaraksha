from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, func

from database import Base


class FactoryCostSettings(Base):
    __tablename__ = "factory_cost_settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    tailor_wage_in_house = Column(Numeric(10, 2), nullable=False)
    tailor_wage_wfh = Column(Numeric(10, 2), nullable=False)
    helper_wage_in_house = Column(Numeric(10, 2), nullable=False)
    helper_wage_wfh = Column(Numeric(10, 2), nullable=False)
    esi_pf_pct = Column(Numeric(5, 2), default=16.25, nullable=False)
    margin_pct = Column(Numeric(5, 2), default=25.00, nullable=False)
    festival_bonus_pct = Column(Numeric(5, 2), default=50.00, nullable=False)
    festival_sweet_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    snacks_amount_per_day = Column(Numeric(10, 2), default=0.00, nullable=False)  # ₹/staff/day
    total_staff_capacity = Column(Integer, default=1, nullable=False)
    working_days_per_month = Column(Integer, default=24, nullable=False)
    valid_from = Column(DateTime, server_default=func.now(), nullable=False)
    valid_to = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class ExpenseLineItem(Base):
    __tablename__ = "expense_line_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    particular = Column(String(120), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
