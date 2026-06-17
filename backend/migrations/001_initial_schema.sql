-- Padaraksha — Initial Schema Migration
-- All timestamps stored in UTC.
-- All factory-scoped tables carry factory_id FK.

SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────
-- AUTH
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS factories (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(120) NOT NULL,
    gst_number  VARCHAR(20),
    address     TEXT,
    city        VARCHAR(80),
    state       VARCHAR(80),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,          -- 'admin', 'supervisor'
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factory_id      INT UNSIGNED NOT NULL,
    role_id         INT UNSIGNED NOT NULL,
    username        VARCHAR(80) NOT NULL,
    full_name       VARCHAR(120),
    hashed_password VARCHAR(255) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_factory_username (factory_id, username),
    FOREIGN KEY (factory_id) REFERENCES factories(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Granular permissions: user × module × action (read/write/delete)
CREATE TABLE IF NOT EXISTS permissions (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    factory_id  INT UNSIGNED NOT NULL,
    module      VARCHAR(60) NOT NULL,   -- 'articles', 'inward', 'production', etc.
    can_read    BOOLEAN NOT NULL DEFAULT TRUE,
    can_write   BOOLEAN NOT NULL DEFAULT FALSE,
    can_delete  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_permissions (user_id, factory_id, module),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (factory_id) REFERENCES factories(id)
);

-- ─────────────────────────────────────────
-- ARTICLES
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS articles (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factory_id      INT UNSIGNED NOT NULL,
    article_number  VARCHAR(60) NOT NULL,
    name            VARCHAR(120),
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_articles_factory_number (factory_id, article_number),
    FOREIGN KEY (factory_id) REFERENCES factories(id)
);

-- Colour / size / gender / foot variants of an article
CREATE TABLE IF NOT EXISTS article_variants (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    article_id  INT UNSIGNED NOT NULL,
    colour      VARCHAR(60),
    size        VARCHAR(20),                    -- e.g. '6', '7', '8', '10'
    gender      ENUM('men','women','kids','unisex') NOT NULL DEFAULT 'unisex',
    foot        ENUM('left','right','pair') NOT NULL DEFAULT 'pair',
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id)
);

-- Master list of raw materials (factory-scoped)
CREATE TABLE IF NOT EXISTS raw_materials (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factory_id  INT UNSIGNED NOT NULL,
    name        VARCHAR(120) NOT NULL,
    unit        VARCHAR(20) NOT NULL DEFAULT 'piece',  -- 'piece', 'metre', 'ml', 'kg'
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_raw_materials_factory_name (factory_id, name),
    FOREIGN KEY (factory_id) REFERENCES factories(id)
);

-- BOM: quantity of each raw_material needed to produce ONE piece of an article
CREATE TABLE IF NOT EXISTS bom_items (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    article_id      INT UNSIGNED NOT NULL,
    raw_material_id INT UNSIGNED NOT NULL,
    quantity        DECIMAL(10,4) NOT NULL,
    -- History: when BOM changes mid-production, old rows are closed
    valid_from      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_to        DATETIME,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id),
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id)
);

-- Work stages / process steps for an article (with pay rate per piece)
CREATE TABLE IF NOT EXISTS work_stages (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    article_id      INT UNSIGNED NOT NULL,
    name            VARCHAR(120) NOT NULL,
    sequence_order  INT UNSIGNED NOT NULL DEFAULT 1,
    is_parallel     BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE = can run concurrently with peers
    pay_rate        DECIMAL(10,2) NOT NULL DEFAULT 0.00,  -- ₹ per piece (for piece-rate workers)
    -- History: stage changes mid-production close the old row
    valid_from      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_to        DATETIME,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id)
);

-- ─────────────────────────────────────────
-- PROVIDER COMPANIES
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS provider_companies (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factory_id  INT UNSIGNED NOT NULL,
    name        VARCHAR(120) NOT NULL,
    gst_number  VARCHAR(20),
    contact     VARCHAR(120),
    address     TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (factory_id) REFERENCES factories(id)
);

-- ─────────────────────────────────────────
-- INWARD / PURCHASE ORDERS
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS purchase_orders (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factory_id      INT UNSIGNED NOT NULL,
    provider_id     INT UNSIGNED NOT NULL,
    po_number       VARCHAR(60) NOT NULL,
    po_date         DATE NOT NULL,
    arrival_date    DATE NOT NULL,
    -- 5-day delivery incentive deadline computed from arrival_date
    deadline_date   DATE NOT NULL,           -- = arrival_date + 5 days
    -- Incentive tracking
    incentive_at_risk       BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_incentive_pct  DECIMAL(5,2),    -- % earned, set once delivery confirmed
    quality_score           DECIMAL(5,2),    -- % quality, nullable until known
    quality_incentive_pct   DECIMAL(5,2),    -- % earned, set once known
    status          ENUM('open','in_progress','delivered','overdue') NOT NULL DEFAULT 'open',
    notes           TEXT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_po_factory_number (factory_id, po_number),
    FOREIGN KEY (factory_id) REFERENCES factories(id),
    FOREIGN KEY (provider_id) REFERENCES provider_companies(id)
);

-- Line items on the PO: which article variants and quantities are ordered
CREATE TABLE IF NOT EXISTS po_line_items (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    po_id           INT UNSIGNED NOT NULL,
    article_variant_id INT UNSIGNED NOT NULL,
    quantity_ordered INT UNSIGNED NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (article_variant_id) REFERENCES article_variants(id)
);

-- One inward entry per PO receipt
CREATE TABLE IF NOT EXISTS inward_entries (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factory_id      INT UNSIGNED NOT NULL,
    po_id           INT UNSIGNED NOT NULL,
    received_date   DATE NOT NULL,
    received_by     INT UNSIGNED,            -- user_id of supervisor who received
    notes           TEXT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (factory_id) REFERENCES factories(id),
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (received_by) REFERENCES users(id)
);

-- Each raw material received against a PO: expected vs actual qty
CREATE TABLE IF NOT EXISTS inward_line_items (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    inward_entry_id     INT UNSIGNED NOT NULL,
    raw_material_id     INT UNSIGNED NOT NULL,
    expected_quantity   DECIMAL(10,4) NOT NULL,
    actual_quantity     DECIMAL(10,4) NOT NULL,
    po_reference_price  DECIMAL(10,2),       -- price per unit from PO (for damage deductions)
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (inward_entry_id) REFERENCES inward_entries(id),
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id)
);

-- Department dispatch bills (sub-bills linked to a PO from provider departments)
CREATE TABLE IF NOT EXISTS department_bills (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    inward_entry_id INT UNSIGNED NOT NULL,
    bill_number     VARCHAR(80) NOT NULL,
    department_name VARCHAR(120) NOT NULL,
    bill_date       DATE NOT NULL,
    notes           TEXT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (inward_entry_id) REFERENCES inward_entries(id)
);

-- Items within each dept bill: dispatched vs short (shortage = provider liability)
CREATE TABLE IF NOT EXISTS dept_bill_items (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dept_bill_id        INT UNSIGNED NOT NULL,
    raw_material_id     INT UNSIGNED NOT NULL,
    quantity_dispatched DECIMAL(10,4) NOT NULL,
    quantity_short      DECIMAL(10,4) NOT NULL DEFAULT 0,  -- provider's liability
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dept_bill_id) REFERENCES department_bills(id),
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id)
);

-- ─────────────────────────────────────────
-- INVENTORY (computed, not stored stock)
-- ─────────────────────────────────────────

-- Ledger of every inventory movement; stock is always SUM of transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factory_id          INT UNSIGNED NOT NULL,
    raw_material_id     INT UNSIGNED NOT NULL,
    -- transaction_type drives the sign of quantity:
    --   'inward'    → positive (received from provider)
    --   'consumed'  → negative (used in production)
    --   'damage'    → negative (factory liability)
    --   'repurchase'→ positive (damage recovery receipt)
    transaction_type    ENUM('inward','consumed','damage','repurchase') NOT NULL,
    quantity            DECIMAL(10,4) NOT NULL,   -- always positive; type sets sign
    reference_type      VARCHAR(40),              -- 'inward_entry', 'work_assignment', etc.
    reference_id        INT UNSIGNED,             -- FK to the source record
    notes               TEXT,
    transacted_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (factory_id) REFERENCES factories(id),
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id)
);

-- ─────────────────────────────────────────
-- DAMAGE REPURCHASE
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS damage_repurchases (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factory_id      INT UNSIGNED NOT NULL,
    provider_id     INT UNSIGNED NOT NULL,
    order_date      DATE NOT NULL,
    expected_date   DATE,
    actual_date     DATE,
    status          ENUM('pending','partial','received') NOT NULL DEFAULT 'pending',
    notes           TEXT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (factory_id) REFERENCES factories(id),
    FOREIGN KEY (provider_id) REFERENCES provider_companies(id)
);

CREATE TABLE IF NOT EXISTS damage_repurchase_items (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    repurchase_id       INT UNSIGNED NOT NULL,
    raw_material_id     INT UNSIGNED NOT NULL,
    quantity_ordered    DECIMAL(10,4) NOT NULL,
    quantity_received   DECIMAL(10,4) NOT NULL DEFAULT 0,
    po_reference_price  DECIMAL(10,2),           -- cost logged as factory expense
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (repurchase_id) REFERENCES damage_repurchases(id),
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id)
);

-- ─────────────────────────────────────────
-- EMPLOYEES & ATTENDANCE
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS employees (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factory_id      INT UNSIGNED NOT NULL,
    name            VARCHAR(120) NOT NULL,
    role            VARCHAR(80),                -- 'stitcher', 'cutter', 'supervisor', etc.
    pay_type        ENUM('fixed','piece_rate','hybrid') NOT NULL DEFAULT 'piece_rate',
    fixed_wage      DECIMAL(10,2),              -- daily rate for fixed/hybrid workers
    join_date       DATE NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    phone           VARCHAR(20),
    notes           TEXT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (factory_id) REFERENCES factories(id)
);

CREATE TABLE IF NOT EXISTS attendance (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factory_id      INT UNSIGNED NOT NULL,
    employee_id     INT UNSIGNED NOT NULL,
    date            DATE NOT NULL,
    status          ENUM('present','absent','half_day') NOT NULL DEFAULT 'present',
    notes           VARCHAR(255),
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_attendance_employee_date (employee_id, date),
    FOREIGN KEY (factory_id) REFERENCES factories(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- ─────────────────────────────────────────
-- PRODUCTION
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS work_assignments (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factory_id      INT UNSIGNED NOT NULL,
    po_id           INT UNSIGNED NOT NULL,
    article_id      INT UNSIGNED NOT NULL,
    work_stage_id   INT UNSIGNED NOT NULL,
    employee_id     INT UNSIGNED NOT NULL,
    quantity_assigned INT UNSIGNED NOT NULL,
    start_date      DATETIME NOT NULL,
    notes           TEXT,
    -- is_rework=TRUE means no pay — worker fixing their own defect
    is_rework       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (factory_id) REFERENCES factories(id),
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (article_id) REFERENCES articles(id),
    FOREIGN KEY (work_stage_id) REFERENCES work_stages(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS work_completions (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    assignment_id       INT UNSIGNED NOT NULL,
    quantity_completed  INT UNSIGNED NOT NULL,
    end_date            DATETIME NOT NULL,
    notes               TEXT,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES work_assignments(id)
);

-- ─────────────────────────────────────────
-- INTERNAL QC
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS qc_inspections (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factory_id          INT UNSIGNED NOT NULL,
    po_id               INT UNSIGNED NOT NULL,
    article_id          INT UNSIGNED NOT NULL,
    inspected_by        INT UNSIGNED,           -- user_id
    inspection_date     DATETIME NOT NULL,
    total_inspected     INT UNSIGNED NOT NULL,
    total_passed        INT UNSIGNED NOT NULL,
    total_failed        INT UNSIGNED NOT NULL,
    notes               TEXT,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (factory_id) REFERENCES factories(id),
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (article_id) REFERENCES articles(id),
    FOREIGN KEY (inspected_by) REFERENCES users(id)
);

-- Individual failure records within a QC inspection
CREATE TABLE IF NOT EXISTS qc_failures (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    inspection_id       INT UNSIGNED NOT NULL,
    work_stage_id       INT UNSIGNED NOT NULL,  -- which stage caused the defect
    quantity_failed     INT UNSIGNED NOT NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (inspection_id) REFERENCES qc_inspections(id),
    FOREIGN KEY (work_stage_id) REFERENCES work_stages(id)
);

-- Rework assignments generated from QC failures (always is_rework=TRUE in work_assignments)
CREATE TABLE IF NOT EXISTS rework_assignments (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    qc_failure_id   INT UNSIGNED NOT NULL,
    assignment_id   INT UNSIGNED NOT NULL,  -- FK to work_assignments (is_rework=TRUE)
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (qc_failure_id) REFERENCES qc_failures(id),
    FOREIGN KEY (assignment_id) REFERENCES work_assignments(id)
);

-- ─────────────────────────────────────────
-- OUTWARD DELIVERY
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS outward_deliveries (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factory_id      INT UNSIGNED NOT NULL,
    po_id           INT UNSIGNED NOT NULL,
    dispatch_date   DATE NOT NULL,
    dispatched_by   INT UNSIGNED,               -- user_id
    total_dispatched INT UNSIGNED NOT NULL,
    total_shortage  INT UNSIGNED NOT NULL DEFAULT 0,   -- promised but not produced
    total_spoiled   INT UNSIGNED NOT NULL DEFAULT 0,   -- damaged beyond repair (factory loss)
    notes           TEXT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (factory_id) REFERENCES factories(id),
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (dispatched_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS outward_line_items (
    id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    outward_delivery_id     INT UNSIGNED NOT NULL,
    article_variant_id      INT UNSIGNED NOT NULL,
    quantity_dispatched      INT UNSIGNED NOT NULL,
    quantity_shortage        INT UNSIGNED NOT NULL DEFAULT 0,
    quantity_spoiled         INT UNSIGNED NOT NULL DEFAULT 0,
    created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (outward_delivery_id) REFERENCES outward_deliveries(id),
    FOREIGN KEY (article_variant_id) REFERENCES article_variants(id)
);

-- Provider QC returns
CREATE TABLE IF NOT EXISTS provider_returns (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factory_id          INT UNSIGNED NOT NULL,
    outward_delivery_id INT UNSIGNED NOT NULL,
    return_date         DATE NOT NULL,
    total_returned      INT UNSIGNED NOT NULL,
    full_return         BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE = entire shipment rejected
    reason              TEXT,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (factory_id) REFERENCES factories(id),
    FOREIGN KEY (outward_delivery_id) REFERENCES outward_deliveries(id)
);

CREATE TABLE IF NOT EXISTS provider_qc_failures (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    return_id       INT UNSIGNED NOT NULL,
    work_stage_id   INT UNSIGNED NOT NULL,
    quantity_failed INT UNSIGNED NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (return_id) REFERENCES provider_returns(id),
    FOREIGN KEY (work_stage_id) REFERENCES work_stages(id)
);

-- ─────────────────────────────────────────
-- PAYROLL
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payroll_runs (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factory_id      INT UNSIGNED NOT NULL,
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    run_by          INT UNSIGNED,               -- admin user_id
    finalized       BOOLEAN NOT NULL DEFAULT FALSE,
    notes           TEXT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (factory_id) REFERENCES factories(id),
    FOREIGN KEY (run_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payroll_line_items (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    payroll_run_id      INT UNSIGNED NOT NULL,
    employee_id         INT UNSIGNED NOT NULL,
    gross_pay           DECIMAL(10,2) NOT NULL DEFAULT 0,
    piece_rate_pay      DECIMAL(10,2) NOT NULL DEFAULT 0,
    fixed_pay           DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_deductions    DECIMAL(10,2) NOT NULL DEFAULT 0,
    net_pay             DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_pieces        INT UNSIGNED NOT NULL DEFAULT 0,    -- paid pieces only
    rework_pieces       INT UNSIGNED NOT NULL DEFAULT 0,    -- shown separately, unpaid
    days_present        INT UNSIGNED NOT NULL DEFAULT 0,
    days_absent         INT UNSIGNED NOT NULL DEFAULT 0,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS advances (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factory_id      INT UNSIGNED NOT NULL,
    employee_id     INT UNSIGNED NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    advance_date    DATE NOT NULL,
    notes           VARCHAR(255),
    recovered       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (factory_id) REFERENCES factories(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS deductions (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factory_id      INT UNSIGNED NOT NULL,
    employee_id     INT UNSIGNED NOT NULL,
    deduction_type  ENUM('fine','pf','esi','damage','absence','other') NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    deduction_date  DATE NOT NULL,
    notes           VARCHAR(255),
    payroll_run_id  INT UNSIGNED,               -- linked once included in a run
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (factory_id) REFERENCES factories(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id)
);

SET FOREIGN_KEY_CHECKS = 1;

-- ─────────────────────────────────────────
-- SEED: default roles
-- ─────────────────────────────────────────

INSERT IGNORE INTO roles (id, name) VALUES (1, 'admin'), (2, 'supervisor');
