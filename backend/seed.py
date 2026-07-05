"""
Seed script — run from backend/ directory:
  python seed.py

Populates the DB with real reference data for article WLR72042, taken
directly from the factory's own costing spreadsheet ("NEW ARTICLE FORMAT
72042.xlsx"). No fictional demo data — clean slate for real operations.
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import bcrypt as _bcrypt

from database import SessionLocal
from models.auth import Factory, Role, User
from models.articles import Article, BomItem, RawMaterial, WorkStage
from models.settings import ExpenseLineItem, FactoryCostSettings

db = SessionLocal()

def h(s): return _bcrypt.hashpw(s.encode(), _bcrypt.gensalt(rounds=12)).decode()

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
    "expense_line_items","factory_cost_settings",
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
factory = Factory(name="Padaraksha Footwear", city="Mysuru", state="Karnataka", gst_number="29ABCDE1234F1Z5")
db.add(factory); db.flush()

role_admin = Role(name="admin")
role_manager = Role(name="manager")
db.add_all([role_admin, role_manager]); db.flush()

admin = User(factory_id=factory.id, role_id=role_admin.id, username="admin", full_name="Shashank Rao", hashed_password=h("admin123"), is_active=True)
db.add(admin); db.flush()
F = factory.id

# ── Factory Cost Settings ─────────────────────────────────────────────────────
# Real wage tiers from PEICE (WFH) / PEICE (IN HOUSE) sheets: tailor wage is
# currently ₹15,000 either way (no WFH tailors yet), but kept independently
# editable since that could change.
print("Creating factory cost settings…")
db.add(FactoryCostSettings(
    factory_id=F,
    tailor_wage_in_house=15000, tailor_wage_wfh=15000,
    helper_wage_in_house=10000, helper_wage_wfh=7000,
    esi_pf_pct=16.25, margin_pct=25.00,
    festival_bonus_pct=50.00, festival_sweet_amount=340.00,
    snacks_amount_per_day=25.00,
    total_staff_capacity=60, working_days_per_month=24,
))
db.flush()

# ── Overhead Expenses (real categories, ₹136,690 total) ──────────────────────
print("Creating overhead expenses…")
for particular, amount in [
    ("ADMINISTRATION", 49500), ("ELECTRICITY & UTILITIES", 29000),
    ("FACTORY & PREMISES", 26500), ("2-WHEELER", 9250),
    ("MACHINE & EQUIPMENTS", 8250), ("MISCELLANEOUS", 7500),
    ("STAFF WELFARE", 3000), ("AYUDHA POOJA EXPENSES", 2500),
    ("STATUTORY COST", 1190),
]:
    db.add(ExpenseLineItem(factory_id=F, particular=particular, amount=amount))
db.flush()

# ── Raw Materials ────────────────────────────────────────────────────────────
print("Creating raw materials…")
mats_data = [
    ("Anguta", "pcs"), ("Anguta Lace", "pcs"), ("Upper", "pcs"),
    ("Stone Patti", "metres"), ("Stone", "pcs"), ("Foam", "sheets"),
    ("Pipe", "metres"), ("Thread", "spools"), ("Gum For Pasting", "litres"),
]
mats = []
for name, unit in mats_data:
    m = RawMaterial(factory_id=F, name=name, unit=unit)
    db.add(m); mats.append(m)
db.flush()

# ── Article WLR72042 ──────────────────────────────────────────────────────────
print("Creating article WLR72042…")
article = Article(
    factory_id=F, article_number="WLR72042", name=None,
    description="Stone-work sandal — imported from factory costing sheet.",
    mrp=None, rate_company=10.50, is_active=True,
)
db.add(article); db.flush()

# BOM — quantities not specified in the source sheet, defaulted to 2/pair
for mat in mats:
    db.add(BomItem(article_id=article.id, raw_material_id=mat.id, quantity=2))
db.flush()

# Work stages — role from bold-formatting in the sheet (tailor = the 3 stitching
# stages), applies_per from the ×10-vs-×20 pair/piece multiplier, pay rates
# derived cleanly from (role wage / 24 / 8) × hours-for-100-pieces, using the
# single shared tailor wage and the sourcing-specific helper wage above.
# Tuple: (name, seq, role, applies_per, seconds_per_10_pieces, fatigue_allowance_pct, pay_rate_in_house, pay_rate_wfh)
stage_data = [
    ("WRITING \"P\"", 1, "helper", "pair", 9, 5.0, 1.3672, 0.957),
    ("LACE 1 & 2 STITCHING", 2, "tailor", "piece", 70, 15.0, 17.4696, 17.4696),
    ("LACE 1 & 2 THREAD CUTTING", 3, "helper", "piece", 30, 5.0, 4.5573, 3.1901),
    ("ANGUTA MARKING", 4, "helper", "piece", 50, 5.0, 7.5955, 5.3168),
    ("LACE 1 MARKING", 5, "helper", "piece", 50, 5.0, 7.5955, 5.3168),
    ("LACE 2 MARKING", 6, "helper", "piece", 50, 5.0, 7.5955, 5.3168),
    ("UPPER MARKING", 7, "helper", "piece", 50, 5.0, 7.5955, 5.3168),
    ("INSOLE MARKING", 8, "helper", "piece", 50, 5.0, 7.5955, 5.3168),
    ("PASTING", 9, "helper", "piece", 125, 5.0, 18.9887, 13.2921),
    ("UPPER IN INSOLE", 10, "helper", "piece", 70, 5.0, 10.6337, 7.4436),
    ("LACE 1 & 2 IN INSOLE", 11, "helper", "piece", 70, 5.0, 10.6337, 7.4436),
    ("ANGUTA IN INSOLE", 12, "helper", "piece", 35, 5.0, 5.3168, 3.7218),
    ("INSIDE INSOLE STITCHING", 13, "tailor", "piece", 137.2, 15.0, 34.2405, 34.2405),
    ("INSIDE INSOLE THREAD CUTTING", 14, "helper", "piece", 90, 5.0, 13.6719, 9.5703),
    ("OUTSIDE INSOLE STITCHING", 15, "tailor", "piece", 136.1, 15.0, 33.9659, 33.9659),
    ("OUTSIDE INSOLE THREAD CUTTING", 16, "helper", "piece", 60, 5.0, 9.1146, 6.3802),
    ("ANGUTA PULL THROUGH FOAM", 17, "helper", "piece", 80, 5.0, 12.1528, 8.5069),
    ("ANGUTA ELPY (1)", 18, "helper", "piece", 60, 5.0, 9.1146, 6.3802),
    ("ANGUTA GUMMING (1)", 19, "helper", "piece", 50, 5.0, 7.5955, 5.3168),
    ("JODI", 20, "helper", "piece", 30, 5.0, 4.5573, 3.1901),
    ("PASSING", 21, "helper", "piece", 90, 5.0, 13.6719, 9.5703),
    ("COUNTING", 22, "helper", "piece", 5, 5.0, 0.7595, 0.5317),
    ("BOX FILLING", 23, "helper", "piece", 15, 5.0, 2.2786, 1.5951),
]
for name, seq, role, applies_per, seconds_per_10, allowance, rate_in_house, rate_wfh in stage_data:
    db.add(WorkStage(
        article_id=article.id, name=name, sequence_order=seq, role=role, applies_per=applies_per,
        seconds_per_10_pieces=seconds_per_10, fatigue_allowance_pct=allowance,
        pay_rate_in_house=rate_in_house, pay_rate_wfh=rate_wfh, is_active=True,
    ))
db.flush()

db.commit()
print("\n✓ Seed complete.")
print(f"  Factory: {factory.name} (id={factory.id})")
print(f"  Login:   admin / admin123")
print(f"  Article: WLR72042 — {len(mats)} BOM items, {len(stage_data)} work stages")
