-- Padaraksha — Tailor WFH Wage
-- The factory doesn't currently source tailor work WFH, but might in future,
-- so tailor wage needs the same in-house/WFH split as helper wage already
-- has. Renames tailor_wage -> tailor_wage_in_house and adds tailor_wage_wfh,
-- defaulted to match the existing rate so nothing changes until edited.

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE factory_cost_settings
    CHANGE COLUMN tailor_wage tailor_wage_in_house DECIMAL(10,2) NOT NULL,
    ADD COLUMN tailor_wage_wfh DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER tailor_wage_in_house;

UPDATE factory_cost_settings SET tailor_wage_wfh = tailor_wage_in_house;

SET FOREIGN_KEY_CHECKS = 1;
