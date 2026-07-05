-- Padaraksha — Costing Engine Migration
-- Adds the pricing/payroll model derived from the factory's time-and-motion
-- study: per-stage stopwatch data, tailor/helper wage tiers split by
-- in-house vs work-from-home sourcing, and factory-wide overhead settings
-- used to compute unit cost, profit/loss, and breakeven.

SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────
-- FACTORY COST SETTINGS (versioned, factory-wide constants)
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS factory_cost_settings (
    id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factory_id              INT UNSIGNED NOT NULL,
    tailor_wage_in_house    DECIMAL(10,2) NOT NULL,  -- ₹/month
    tailor_wage_wfh         DECIMAL(10,2) NOT NULL,  -- ₹/month
    helper_wage_in_house    DECIMAL(10,2) NOT NULL,  -- ₹/month
    helper_wage_wfh         DECIMAL(10,2) NOT NULL,  -- ₹/month
    esi_pf_pct              DECIMAL(5,2) NOT NULL DEFAULT 16.25,  -- statutory add-on on wage bill
    margin_pct              DECIMAL(5,2) NOT NULL DEFAULT 25.00,  -- margin applied on top of loaded cost
    festival_bonus_pct      DECIMAL(5,2) NOT NULL DEFAULT 50.00,  -- % of one month's wage, paid annually, amortized /12
    festival_sweet_amount   DECIMAL(10,2) NOT NULL DEFAULT 0.00,  -- flat ₹ per FTE per year, amortized /12
    total_staff_capacity    INT UNSIGNED NOT NULL DEFAULT 1,      -- total factory headcount capacity, for overhead allocation
    working_days_per_month  INT UNSIGNED NOT NULL DEFAULT 24,
    -- History: when wage/margin policy changes, old row is closed
    valid_from              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_to                DATETIME,
    created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (factory_id) REFERENCES factories(id)
);

-- ─────────────────────────────────────────
-- FACTORY OVERHEAD EXPENSE LINE ITEMS
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS expense_line_items (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factory_id      INT UNSIGNED NOT NULL,
    particular      VARCHAR(120) NOT NULL,   -- e.g. 'RENT', 'OWNER'S SALARY', 'ELECTRICITY & WATER'
    amount          DECIMAL(10,2) NOT NULL,  -- ₹/month
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (factory_id) REFERENCES factories(id)
);

-- ─────────────────────────────────────────
-- ARTICLES — pricing fields
-- ─────────────────────────────────────────

ALTER TABLE articles
    ADD COLUMN mrp DECIMAL(10,2) AFTER description,
    ADD COLUMN rate_company DECIMAL(10,2) AFTER mrp;  -- ₹/pair the client (provider company) pays

-- ─────────────────────────────────────────
-- WORK STAGES — time study + role + dual piece rates
-- ─────────────────────────────────────────

ALTER TABLE work_stages
    ADD COLUMN role ENUM('tailor','helper') NOT NULL DEFAULT 'helper' AFTER name,
    ADD COLUMN applies_per ENUM('piece','pair') NOT NULL DEFAULT 'piece' AFTER role,
    ADD COLUMN seconds_per_10_pieces DECIMAL(10,2) AFTER applies_per,
    ADD COLUMN fatigue_allowance_pct DECIMAL(5,2) NOT NULL DEFAULT 5.00 AFTER seconds_per_10_pieces,
    ADD COLUMN pay_rate_in_house DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER fatigue_allowance_pct,
    ADD COLUMN pay_rate_wfh DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER pay_rate_in_house,
    DROP COLUMN pay_rate;

-- avg_seconds_per_100 is dropped separately and defensively (IF EXISTS): it
-- only ever existed in a stray local dev edit, never in an officially-run
-- migration, so some environments won't have it. (MySQL doesn't allow
-- IF EXISTS combined with other clauses in one ALTER TABLE statement.)
ALTER TABLE work_stages
    DROP COLUMN IF EXISTS avg_seconds_per_100;

-- ─────────────────────────────────────────
-- EMPLOYEES — sourcing type (drives which piece rate applies)
-- ─────────────────────────────────────────

ALTER TABLE employees
    ADD COLUMN sourcing_type ENUM('in_house','wfh') NOT NULL DEFAULT 'in_house' AFTER pay_type;

SET FOREIGN_KEY_CHECKS = 1;
