# Padaraksha — Build Plan

## Status Summary

As of June 2026, Phases 0–8 are fully complete. The backend has all routers, services, and endpoints built and wired. All major frontend pages are live and hitting the real API. Only Phase 9 (Reports) remains.

---

## ✅ Phase 0 — Foundation
- [x] MySQL setup, schema (34 tables), `.env`
- [x] Seed data — Factory: "Padaraksha Factory - Bengaluru", User: `admin` / `admin123`
- [x] FastAPI app bootstrap, CORS, JWT middleware
- [x] Frontend login wired to `POST /auth/login`

---

## ✅ Phase 1 — Article Management
- [x] `GET/POST /articles`, `GET/PUT /articles/{id}`
- [x] `POST /articles/{id}/bom`, `POST /articles/{id}/stages`, `POST /articles/{id}/variants`
- [x] `GET/POST /providers`, `GET/POST /raw-materials`
- [x] Frontend articles page — list, create, detail view (article number: name header)
- [x] Article rows clickable → `/articles/{id}`

---

## ✅ Phase 2 — Inward Entry
- [x] `GET/POST /purchase-orders`, `GET /purchase-orders/{id}`
- [x] `POST /purchase-orders/{id}/line-items`, `POST /purchase-orders/{id}/inward-entry`
- [x] `GET /inward-entries`
- [x] Frontend inward page wired to real API

---

## ✅ Phase 3 — Inventory
- [x] `GET /inventory` — computed stock per raw material
- [x] Frontend inventory page wired to real API

---

## ✅ Phase 4 — Production Tracking
- [x] `GET/POST /work-assignments`, `POST /work-assignments/{id}/completions`
- [x] Frontend production page — drag-and-drop queue → worker assignment
- [x] Assigned Work collapsible bottom panel

---

## ✅ Phase 5 — Internal QC
- [x] `GET/POST /qc` endpoints
- [x] Frontend quality-check page wired to real API (669 lines)

---

## ✅ Phase 6 — Outward Delivery
- [x] `GET/POST /outward`, `POST /outward/{id}/provider-return`
- [x] Frontend outward page wired to real API
- [x] Frontend provider-qc page wired to real API

---

## ✅ Phase 7 — Payroll & Employees
- [x] `GET/POST /employees`, attendance, advances endpoints
- [x] `POST /payroll/calculate`, `POST /payroll/run`, `GET /payroll/runs`
- [x] Frontend payroll page fully wired (1162 lines)

---

## ✅ Phase 8 — Dashboard (live data)
- [x] `GET /dashboard/stats`
- [x] Frontend dashboard page wired to real API

---

## 🔲 Phase 9 — Reports
- [ ] Backend: `GET /reports/daily-workers` — attendance + completions per worker for a date
- [ ] Backend: `GET /reports/inventory` — stock snapshot + daily consumption
- [ ] Backend: `GET /reports/damage` — rework, spoiled, financial loss
- [ ] Backend: `GET /reports/po-status` — open POs, deadline countdown, incentive eligibility
- [ ] Frontend: Wire reports page (currently a UI shell, no API calls)

---

## Cleanup (minor)
- [ ] Delete dead `/qc` route (`app/(dashboard)/qc/page.tsx` — 8-line stub, superseded by `/quality-check`)
- [ ] Settings page currently persists to localStorage only — wire to backend if needed

---

## Key Business Rules (never break these)
1. Every DB query scoped by `factory_id` from JWT — never cross-factory data
2. `is_rework = TRUE` on work assignments = unpaid; payroll always filters `WHERE is_rework = FALSE`
3. 5-day deadline = `po_arrival_date + 5`; expose `days_remaining` on all PO responses
4. Inventory is always computed — never a stored number: `SUM(inward) - SUM(consumed) - SUM(damaged)`
5. No stage sequence enforcement — work can be logged in any order
6. Provider shortages (dept bill) ≠ factory damage (inventory transaction) — never mix these
