from sqlalchemy import Boolean, Column, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import relationship

from database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, autoincrement=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    name = Column(String(120), nullable=False)
    role = Column(String(80))
    pay_type = Column(
        Enum("fixed", "piece_rate", "hybrid"), default="piece_rate", nullable=False
    )
    fixed_wage = Column(Numeric(10, 2))
    join_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    phone = Column(String(20))
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    attendance_records = relationship("Attendance", back_populates="employee")
    advances = relationship("Advance", back_populates="employee")
    deductions = relationship("Deduction", back_populates="employee")


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(
        Enum("present", "absent", "half_day"), default="present", nullable=False
    )
    notes = Column(String(255))
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    employee = relationship("Employee", back_populates="attendance_records")


class PayrollRun(Base):
    __tablename__ = "payroll_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    run_by = Column(Integer, ForeignKey("users.id"))
    finalized = Column(Boolean, default=False, nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    line_items = relationship("PayrollLineItem", back_populates="payroll_run")


class PayrollLineItem(Base):
    __tablename__ = "payroll_line_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    payroll_run_id = Column(Integer, ForeignKey("payroll_runs.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    gross_pay = Column(Numeric(10, 2), default=0, nullable=False)
    piece_rate_pay = Column(Numeric(10, 2), default=0, nullable=False)
    fixed_pay = Column(Numeric(10, 2), default=0, nullable=False)
    total_deductions = Column(Numeric(10, 2), default=0, nullable=False)
    net_pay = Column(Numeric(10, 2), default=0, nullable=False)
    total_pieces = Column(Integer, default=0, nullable=False)
    rework_pieces = Column(Integer, default=0, nullable=False)
    days_present = Column(Integer, default=0, nullable=False)
    days_absent = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    payroll_run = relationship("PayrollRun", back_populates="line_items")


class Advance(Base):
    __tablename__ = "advances"

    id = Column(Integer, primary_key=True, autoincrement=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    advance_date = Column(Date, nullable=False)
    notes = Column(String(255))
    recovered = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    employee = relationship("Employee", back_populates="advances")


class Deduction(Base):
    __tablename__ = "deductions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    deduction_type = Column(
        Enum("fine", "pf", "esi", "damage", "absence", "other"), nullable=False
    )
    amount = Column(Numeric(10, 2), nullable=False)
    deduction_date = Column(Date, nullable=False)
    notes = Column(String(255))
    payroll_run_id = Column(Integer, ForeignKey("payroll_runs.id"))
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    employee = relationship("Employee", back_populates="deductions")
