"""
Seed script — run from backend/ directory:
  python seed.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, datetime, timedelta
from passlib.context import CryptContext

from database import SessionLocal, engine
from models.auth import Factory, Role, User
from models.articles import Article, ArticleVariant, BomItem, RawMaterial, WorkStage
from models.inward import (
    DepartmentBill, DeptBillItem, InwardEntry, InwardLineItem,
    PoLineItem, ProviderCompany, PurchaseOrder,
)
from models.production import (
    InventoryTransaction, OutwardDelivery, OutwardLineItem,
    QcInspection, QcFailure, WorkAssignment, WorkCompletion,
)
from models.payroll import Attendance, Deduction, Employee, PayrollLineItem, PayrollRun

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
db = SessionLocal()

def h(s): return pwd_ctx.hash(s)
def d(s): return date.fromisoformat(s)
def dt(s): return datetime.fromisoformat(s)

print("Clearing existing data…")
for tbl in [
    "provider_qc_failures","provider_returns","outward_line_items","outward_deliveries",
    "rework_assignments","qc_failures","qc_inspections",
    "work_completions","work_assignments",
    "inventory_transactions",
    "dept_bill_items","department_bills","inward_line_items","inward_entries",
    "po_line_items","purchase_orders","provider_companies",
    "payroll_line_items","payroll_runs","deductions","advances","attendance","employees",
    "bom_items","work_stages","article_variants","articles","raw_materials",
    "permissions","users","roles","factories",
]:
    try:
        db.execute(__import__("sqlalchemy").text(f"DELETE FROM {tbl}"))
        db.execute(__import__("sqlalchemy").text(f"ALTER TABLE {tbl} AUTO_INCREMENT = 1"))
    except Exception as e:
        print(f"  skip {tbl}: {e}")
db.commit()

# ── Factory + Auth ──────────────────────────────────────────────────────────
print("Creating factory and users…")
factory = Factory(name="Padaraksha Footwear", city="Bengaluru", state="Karnataka", gst_number="29ABCDE1234F1Z5")
db.add(factory); db.flush()

role_admin = Role(name="admin")
role_manager = Role(name="manager")
db.add_all([role_admin, role_manager]); db.flush()

admin = User(factory_id=factory.id, role_id=role_admin.id, username="admin", full_name="Shashank Rao", hashed_password=h("admin123"), is_active=True)
db.add(admin); db.flush()
F = factory.id

# ── Raw Materials ────────────────────────────────────────────────────────────
print("Creating raw materials…")
mats_data = [
    ("EVA Sheet 5mm", "sheets"), ("PU Sole Adhesive", "litres"),
    ("Buckle 25mm Silver", "pcs"), ("Velcro Strap 3cm", "metres"),
    ("Insole Foam 3mm", "sheets"), ("Nylon Thread #69", "spools"),
    ("Rubber Outsole", "pcs"), ("PVC Upper Sheet", "metres"),
    ("Eyelet Brass 8mm", "pcs"), ("Lace Cotton 90cm", "pcs"),
]
mats = []
for name, unit in mats_data:
    m = RawMaterial(factory_id=F, name=name, unit=unit)
    db.add(m); mats.append(m)
db.flush()
eva, adhesive, buckle, velcro, insole, thread, outsole, pvc, eyelet, lace = mats

# ── Articles ─────────────────────────────────────────────────────────────────
print("Creating articles…")
articles_data = [
    ("PAD-001", "Classic Leather Sandal", "Everyday wear sandal with PU sole"),
    ("PAD-002", "Sports Floater", "Lightweight EVA sport sandal"),
    ("PAD-003", "School Shoe", "Durable school shoe with rubber sole"),
    ("PAD-004", "Ladies Block Heel", "Fashion block heel with velcro strap"),
]
arts = []
for num, name, desc in articles_data:
    a = Article(factory_id=F, article_number=num, name=name, description=desc, is_active=True)
    db.add(a); arts.append(a)
db.flush()
a1, a2, a3, a4 = arts

# Variants
variants = []
for art, gender in [(a1,"men"),(a2,"unisex"),(a3,"kids"),(a4,"women")]:
    for size in ["6","7","8","9","10"]:
        v = ArticleVariant(article_id=art.id, gender=gender, foot="pair", size=size, is_active=True)
        db.add(v); variants.append(v)
db.flush()

# BOM items
for art, mat1, qty1, mat2, qty2 in [
    (a1, outsole, 1, adhesive, 0.05),
    (a2, eva, 2, adhesive, 0.04),
    (a3, outsole, 1, thread, 1),
    (a4, outsole, 1, velcro, 0.3),
]:
    db.add(BomItem(article_id=art.id, raw_material_id=mat1.id, quantity=qty1))
    db.add(BomItem(article_id=art.id, raw_material_id=mat2.id, quantity=qty2))
db.flush()

# Work stages
stages = []
for art, stage_list in [
    (a1, [("Cutting",1,12.00),("Stitching",2,18.00),("Sole Bonding",3,10.00),("Finishing",4,8.00)]),
    (a2, [("Cutting",1,10.00),("Assembly",2,15.00),("Finishing",3,8.00)]),
    (a3, [("Cutting",1,14.00),("Stitching",2,20.00),("Sole Bonding",3,12.00),("QC Check",4,5.00)]),
    (a4, [("Cutting",1,12.00),("Upper Assembly",2,22.00),("Heel Attachment",3,16.00),("Finishing",4,8.00)]),
]:
    for name, seq, rate in stage_list:
        s = WorkStage(article_id=art.id, name=name, sequence_order=seq, pay_rate=rate, is_active=True)
        db.add(s); stages.append(s)
db.flush()

# ── Providers ────────────────────────────────────────────────────────────────
print("Creating providers…")
providers_data = [
    ("Bharat Soles Pvt Ltd", "29AAACB1234C1Z1", "Rajesh Kumar, +91 98450 12345"),
    ("Kumar Footwear Supplies", "29AABCK5678D1Z2", "Suresh Kumar, +91 98451 67890"),
    ("Shree Leather Works", "29AABCS9012E1Z3", "Mahesh Sharma, +91 98452 34567"),
]
providers = []
for name, gst, contact in providers_data:
    p = ProviderCompany(factory_id=F, name=name, gst_number=gst, contact=contact, is_active=True)
    db.add(p); providers.append(p)
db.flush()
p1, p2, p3 = providers

# ── Purchase Orders ──────────────────────────────────────────────────────────
print("Creating purchase orders…")
today = date.today()
pos = []
po_data = [
    (p1, "PAD-2024-001", today - timedelta(days=6),  today - timedelta(days=1),  "in_progress"),
    (p2, "PAD-2024-002", today - timedelta(days=4),  today + timedelta(days=1),  "open"),
    (p3, "PAD-2024-003", today - timedelta(days=8),  today - timedelta(days=3),  "overdue"),
    (p1, "PAD-2024-004", today - timedelta(days=15), today - timedelta(days=10), "delivered"),
    (p2, "PAD-2024-005", today - timedelta(days=20), today - timedelta(days=15), "delivered"),
]
for prov, num, arrived, deadline, status in po_data:
    po = PurchaseOrder(
        factory_id=F, provider_id=prov.id, po_number=num,
        po_date=arrived - timedelta(days=2), arrival_date=arrived,
        deadline_date=deadline, status=status,
    )
    db.add(po); pos.append(po)
db.flush()
po1, po2, po3, po4, po5 = pos

# PO line items (variant selection)
a1_variants = [v for v in variants if v.article_id == a1.id]
a2_variants = [v for v in variants if v.article_id == a2.id]
a3_variants = [v for v in variants if v.article_id == a3.id]
a4_variants = [v for v in variants if v.article_id == a4.id]

for po, var_list, qty in [
    (po1, a1_variants[:3], 200), (po2, a2_variants[:2], 150),
    (po3, a3_variants[:3], 300), (po4, a4_variants[:2], 180),
    (po5, a1_variants[2:5], 250),
]:
    for v in var_list:
        db.add(PoLineItem(po_id=po.id, article_variant_id=v.id, quantity_ordered=qty))
db.flush()

# ── Inward Entries + Inventory Transactions ──────────────────────────────────
print("Creating inward entries and inventory…")
for po, mat_list, received in [
    (po1, [(eva,50,45),(adhesive,10,10),(outsole,200,195)], today - timedelta(days=5)),
    (po4, [(outsole,180,175),(thread,20,20),(lace,180,180)], today - timedelta(days=14)),
    (po5, [(outsole,250,248),(adhesive,15,15),(insole,60,58)], today - timedelta(days=19)),
]:
    ie = InwardEntry(factory_id=F, po_id=po.id, received_date=received, notes="Received in good condition")
    db.add(ie); db.flush()
    for mat, exp, act in mat_list:
        db.add(InwardLineItem(inward_entry_id=ie.id, raw_material_id=mat.id, expected_quantity=exp, actual_quantity=act, po_reference_price=45.00))
        db.add(InventoryTransaction(factory_id=F, raw_material_id=mat.id, transaction_type="inward", quantity=act, reference_type="inward_entry", reference_id=ie.id))
db.flush()

# Low stock items — add small inventory so they show up in low-stock alert
for mat, qty in [(buckle,8),(velcro,6),(pvc,9),(eyelet,7)]:
    db.add(InventoryTransaction(factory_id=F, raw_material_id=mat.id, transaction_type="inward", quantity=qty, reference_type="manual"))
db.flush()

# ── Employees ────────────────────────────────────────────────────────────────
print("Creating employees…")
emp_data = [
    ("Ramu Naik",      "Cutter",    "piece_rate", None,  "2023-01-10", "9845012301"),
    ("Seema Devi",     "Stitcher",  "piece_rate", None,  "2023-03-15", "9845012302"),
    ("Lakshmi Bai",    "Stitcher",  "piece_rate", None,  "2023-03-20", "9845012303"),
    ("Venkat Reddy",   "Finisher",  "hybrid",     400.0, "2023-06-01", "9845012304"),
    ("Geetha S",       "Finisher",  "piece_rate", None,  "2023-08-12", "9845012305"),
    ("Manjunath K",    "Assembler", "piece_rate", None,  "2023-09-05", "9845012306"),
    ("Priya Nair",     "QC Check",  "fixed",      600.0, "2024-01-01", "9845012307"),
    ("Suresh Babu",    "Cutter",    "piece_rate", None,  "2024-02-14", "9845012308"),
    ("Anitha Kumari",  "Stitcher",  "piece_rate", None,  "2024-04-01", "9845012309"),
    ("Ramesh Gowda",   "Assembler", "hybrid",     350.0, "2024-05-10", "9845012310"),
]
emps = []
for name, role, pay_type, wage, join, phone in emp_data:
    e = Employee(factory_id=F, name=name, role=role, pay_type=pay_type, fixed_wage=wage, join_date=d(join), phone=phone, is_active=True)
    db.add(e); emps.append(e)
db.flush()

# Attendance — last 30 days
import random
random.seed(42)
for emp in emps:
    for i in range(30):
        day = today - timedelta(days=i)
        if day.weekday() == 6:  # skip Sunday
            continue
        r = random.random()
        status = "present" if r > 0.1 else ("half_day" if r > 0.05 else "absent")
        db.add(Attendance(factory_id=F, employee_id=emp.id, date=day, status=status))
db.flush()

# Deductions
db.add(Deduction(factory_id=F, employee_id=emps[1].id, deduction_type="absence", amount=200, deduction_date=today - timedelta(days=10), notes="2 days absent"))
db.add(Deduction(factory_id=F, employee_id=emps[4].id, deduction_type="fine", amount=100, deduction_date=today - timedelta(days=5), notes="Late delivery"))
db.flush()

# ── Work Assignments + Completions ───────────────────────────────────────────
print("Creating work assignments and completions…")
a1_stages = [s for s in stages if s.article_id == a1.id]
a3_stages = [s for s in stages if s.article_id == a3.id]

assignments = []
assign_data = [
    (po4, a1.id, a1_stages[0], emps[0], 175, today-timedelta(days=13)),  # cutting
    (po4, a1.id, a1_stages[1], emps[1], 175, today-timedelta(days=12)),  # stitching
    (po4, a1.id, a1_stages[2], emps[5], 175, today-timedelta(days=11)),  # sole bonding
    (po4, a1.id, a1_stages[3], emps[3], 170, today-timedelta(days=10)),  # finishing
    (po5, a1.id, a1_stages[0], emps[7], 248, today-timedelta(days=18)),  # cutting
    (po5, a1.id, a1_stages[1], emps[2], 248, today-timedelta(days=17)),  # stitching
    (po5, a1.id, a1_stages[2], emps[9], 245, today-timedelta(days=16)),  # sole bonding
    (po1, a1.id, a1_stages[0], emps[0], 195, today-timedelta(days=4)),   # cutting — active
    (po1, a1.id, a1_stages[1], emps[8], 190, today-timedelta(days=3)),   # stitching — active
]
for po, art_id, stage, emp, qty, start in assign_data:
    wa = WorkAssignment(factory_id=F, po_id=po.id, article_id=art_id, work_stage_id=stage.id, employee_id=emp.id, quantity_assigned=qty, start_date=datetime.combine(start, datetime.min.time()), is_rework=False)
    db.add(wa); assignments.append(wa)
db.flush()

# Completions for delivered POs
completions_data = [
    (assignments[0], 175, today-timedelta(days=12)),
    (assignments[1], 172, today-timedelta(days=11)),
    (assignments[2], 170, today-timedelta(days=10)),
    (assignments[3], 168, today-timedelta(days=9)),
    (assignments[4], 248, today-timedelta(days=17)),
    (assignments[5], 244, today-timedelta(days=16)),
    (assignments[6], 242, today-timedelta(days=15)),
    # Partial completions for active PO
    (assignments[7], 143, today),
    (assignments[8], 120, today-timedelta(days=1)),
]
for wa, qty, end in completions_data:
    db.add(WorkCompletion(assignment_id=wa.id, quantity_completed=qty, end_date=datetime.combine(end, datetime.min.time())))
db.flush()

# ── QC Inspections ───────────────────────────────────────────────────────────
print("Creating QC inspections…")
qc_data = [
    (po4, a1.id, 168, 164, 4, today-timedelta(days=9)),
    (po5, a1.id, 242, 238, 4, today-timedelta(days=14)),
    (po1, a1.id, 120, 118, 2, today-timedelta(days=1)),
]
for po, art_id, total, passed, failed, ins_date in qc_data:
    insp = QcInspection(factory_id=F, po_id=po.id, article_id=art_id, inspection_date=datetime.combine(ins_date, datetime.min.time()), total_inspected=total, total_passed=passed, total_failed=failed, notes="Routine inspection")
    db.add(insp); db.flush()
    if failed > 0:
        stage = a1_stages[1]  # stitching stage failures
        db.add(QcFailure(inspection_id=insp.id, work_stage_id=stage.id, quantity_failed=failed))
db.flush()

# ── Outward Deliveries ───────────────────────────────────────────────────────
print("Creating outward deliveries…")
for po, total, shortage, spoiled, dispatch in [
    (po4, 164, 4, 0, today-timedelta(days=8)),
    (po5, 238, 6, 2, today-timedelta(days=13)),
]:
    od = OutwardDelivery(factory_id=F, po_id=po.id, dispatch_date=dispatch, total_dispatched=total, total_shortage=shortage, total_spoiled=spoiled)
    db.add(od); db.flush()
    for v in (a1_variants[:2] if po == po4 else a1_variants[2:4]):
        db.add(OutwardLineItem(outward_delivery_id=od.id, article_variant_id=v.id, quantity_dispatched=total//2, quantity_shortage=shortage//2, quantity_spoiled=spoiled//2))
    if spoiled > 0:
        db.add(InventoryTransaction(factory_id=F, raw_material_id=outsole.id, transaction_type="damage", quantity=spoiled, reference_type="outward_delivery", reference_id=od.id))
db.flush()

# ── Payroll Run (last month) ─────────────────────────────────────────────────
print("Creating payroll run…")
period_start = (today.replace(day=1) - timedelta(days=1)).replace(day=1)
period_end   = today.replace(day=1) - timedelta(days=1)
pr = PayrollRun(factory_id=F, period_start=period_start, period_end=period_end, finalized=True, notes="May 2026 payroll")
db.add(pr); db.flush()
for emp, pieces, fixed, gross, net in [
    (emps[0], 423, 0,    6345, 6345),
    (emps[1], 392, 0,    5880, 5680),
    (emps[2], 416, 0,    6240, 6240),
    (emps[3], 168, 9800, 12524, 12524),
    (emps[4], 388, 0,    5820, 5720),
    (emps[5], 242, 0,    3630, 3630),
    (emps[6], 0,  15000, 15000, 15000),
    (emps[7], 248, 0,    3472, 3472),
    (emps[8], 120, 0,    1680, 1680),
    (emps[9], 242, 9100, 12726, 12726),
]:
    db.add(PayrollLineItem(payroll_run_id=pr.id, employee_id=emp.id, gross_pay=gross, piece_rate_pay=pieces*14, fixed_pay=fixed, total_deductions=gross-net, net_pay=net, total_pieces=pieces, rework_pieces=0, days_present=26, days_absent=0))
db.flush()

db.commit()
print("\n✓ Seed complete.")
print(f"  Factory: {factory.name} (id={factory.id})")
print(f"  Login:   admin / admin123")
print(f"  Articles: {len(arts)}, Employees: {len(emps)}, POs: {len(pos)}")
