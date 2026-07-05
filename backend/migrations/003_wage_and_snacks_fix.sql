-- Padaraksha — Wage Tier Correction + Snacks Cost
-- Fixes a mismatch found by cross-checking the real cost sheet: tailor wage
-- is identical across in-house and WFH sourcing (only helper wage differs),
-- so the split tailor_wage_in_house/tailor_wage_wfh columns were wrong —
-- collapsed to a single tailor_wage. Also adds the "snacks" daily cost
-- component (₹/staff/day), computed independent of any working-days
-- assumption to avoid the source sheet's internal 24-vs-25-day inconsistency.

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE factory_cost_settings
    CHANGE COLUMN tailor_wage_in_house tailor_wage DECIMAL(10,2) NOT NULL,
    DROP COLUMN tailor_wage_wfh,
    ADD COLUMN snacks_amount_per_day DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER festival_sweet_amount;

SET FOREIGN_KEY_CHECKS = 1;
