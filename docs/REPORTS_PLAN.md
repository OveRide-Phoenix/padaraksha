# Reports — Implementation Plan

## Overview

4 report endpoints + 1 interactive frontend page.
Backend and frontend can be built in parallel once the API contract is fixed (defined below).

---

## Files to create / modify

| File | Action |
|------|--------|
| `backend/routers/reports.py` | CREATE — 4 GET endpoints |
| `backend/services/reports.py` | CREATE — all query logic |
| `backend/main.py` | MODIFY — register reports router at `/reports` |
| `frontend/app/(dashboard)/reports/page.tsx` | REWRITE — interactive report viewer |

---

## API Contract

### 1. GET /reports/daily-workers?date=YYYY-MM-DD

Returns every active employee's attendance + work completions for that date.

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-06-17",
    "summary": {
      "total_employees": 10,
      "present": 8,
      "absent": 1,
      "half_day": 1,
      "no_record": 0
    },
    "workers": [
      {
        "employee_id": 1,
        "name": "Ramesh Kumar",
        "role": "Stitcher",
        "pay_type": "piece_rate",
        "attendance": "present",
        "pieces_completed": 45,
        "rework_pieces": 3,
        "assignments": [
          {
            "article_number": "PAD-001",
            "article_name": "Sports Floater",
            "stage": "Stitching",
            "quantity_assigned": 50,
            "quantity_completed": 45,
            "is_rework": false
          }
        ]
      }
    ]
  }
}
```

- `attendance` = "present" | "absent" | "half_day" | "no_record"
- `pieces_completed` = SUM of non-rework completions where end_date falls on that date
- `rework_pieces` = SUM of rework completions where end_date falls on that date

---

### 2. GET /reports/inventory?date=YYYY-MM-DD

Returns stock levels as of that date, plus today's inward and consumption.

**Response:**
```json
{
  "success": true,
  "data": {
    "as_of": "2026-06-17",
    "materials": [
      {
        "raw_material_id": 1,
        "name": "Insole",
        "unit": "pairs",
        "total_inward": 1000.0,
        "total_consumed": 450.0,
        "total_damaged": 10.0,
        "current_stock": 540.0,
        "today_inward": 200.0,
        "today_consumed": 50.0
      }
    ]
  }
}
```

- `current_stock` = total_inward − total_consumed − total_damaged (up to and including `date`)
- `today_inward` = inward transactions on exactly `date`
- `today_consumed` = consumed transactions on exactly `date`

---

### 3. GET /reports/damage?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD

Pieces failed in QC, rework assigned, outward spoiled, provider returns in period.

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { "start": "2026-06-01", "end": "2026-06-17" },
    "summary": {
      "total_qc_failed": 12,
      "total_rework_assigned": 10,
      "total_outward_spoiled": 2,
      "total_provider_returned": 5
    },
    "qc_failures": [
      {
        "inspection_date": "2026-06-10",
        "article_number": "PAD-001",
        "article_name": "Sports Floater",
        "stage": "Stitching",
        "quantity_failed": 5
      }
    ],
    "outward_spoiled": [
      {
        "dispatch_date": "2026-06-12",
        "po_number": "PO-001",
        "quantity_spoiled": 2
      }
    ],
    "provider_returns": [
      {
        "return_date": "2026-06-14",
        "po_number": "PO-001",
        "provider": "Bata India",
        "total_returned": 5,
        "full_return": false,
        "reason": "Stitching defects"
      }
    ]
  }
}
```

---

### 4. GET /reports/po-status

All POs with their deadline status. No date filter — always current state.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "po_number": "PO-001",
      "provider": "Bata India",
      "arrival_date": "2026-06-10",
      "deadline_date": "2026-06-15",
      "days_remaining": -2,
      "status": "overdue",
      "incentive_at_risk": true,
      "delivery_incentive_pct": null,
      "quality_score": null,
      "articles": ["PAD-001 Sports Floater (Red, M)"]
    }
  ]
}
```

- `days_remaining` = `deadline_date − today` (negative = overdue)
- Include all POs (open, in_progress, overdue, delivered) — let frontend filter

---

## Frontend Design

The page has a left column of report cards (existing UI shell). Clicking a card expands
the right panel with controls + results for that report.

### Layout
```
┌─────────────────┬──────────────────────────────────────────┐
│ Report list     │  Report panel                            │
│                 │  [Date picker / range picker]            │
│ ● Daily Workers │  [Run Report button]                     │
│ ○ Inventory     │                                          │
│ ○ Damage        │  Results table / skeleton / empty state  │
│ ○ PO Status     │                                          │
└─────────────────┴──────────────────────────────────────────┘
```

### Per-report controls
- **Daily Workers**: single date picker (default today)
- **Inventory**: single date picker (default today)
- **Damage & Repair**: date range (start + end, default last 7 days)
- **PO Status**: no controls — auto-loads

### Report displays
- **Daily Workers**: summary chips (present/absent/half-day) + sortable table (name, attendance, pieces, rework)
- **Inventory**: table (material, unit, stock, today inward, today consumed)
- **Damage & Repair**: 3 sub-sections (QC Failures / Outward Spoiled / Provider Returns), each as a small table
- **PO Status**: table (PO#, provider, arrival, deadline, days remaining badge, status pill, incentive)

### UX rules
- Clicking a report in the list selects it (highlight) and opens the panel
- PO Status auto-fetches on select; others show controls first, fetch on "Run Report"
- Loading state: skeleton rows
- Empty state: "No data for this period" message per section

---

## Backend implementation notes

- All services in `services/reports.py` — pure functions taking `factory_id`, params, `db`
- Router in `routers/reports.py` — thin, just calls service + wraps in `{"success": True, "data": ...}`
- Register in `main.py`: `app.include_router(reports.router, prefix="/reports", tags=["reports"])`
- Use `cast(Date, InventoryTransaction.transacted_at)` for date comparison on DateTime columns
- Import models from `models.production`, `models.inward`, `models.payroll`, `models.articles`
