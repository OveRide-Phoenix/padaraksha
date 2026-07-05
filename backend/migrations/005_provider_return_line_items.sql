-- Padaraksha — Provider Return Dual-Counting + Rework Chain
-- Adds per-size line items to provider returns so a return can capture the
-- unit's own self-reported quantity separately from the company's independent
-- recount and damage count (catches under/over-reporting by the unit), and
-- links returns into a rework chain (a return can be "the recount of" an
-- earlier return whose shortage/damage it's correcting).
-- Mirrors "COUNTING REPORT FORMAT.xlsx" (UNIT COUNTING REPORT / VKC COUNTING
-- REPORT / RETURN FORMAT tabs) — a blank monthly template, no real data to
-- import, just the workflow.

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS provider_return_line_items (
    id                              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    return_id                       INT UNSIGNED NOT NULL,
    article_variant_id              INT UNSIGNED NOT NULL,
    quantity_reported_by_unit       INT UNSIGNED NOT NULL DEFAULT 0,  -- unit's own self-reported count
    quantity_counted_by_company     INT UNSIGNED NOT NULL DEFAULT 0,  -- company's independent recount (good + damaged)
    quantity_damaged                INT UNSIGNED NOT NULL DEFAULT 0,  -- of the counted quantity, how many were damaged
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (return_id) REFERENCES provider_returns(id),
    FOREIGN KEY (article_variant_id) REFERENCES article_variants(id)
);

ALTER TABLE provider_returns
    ADD COLUMN rework_of_return_id INT UNSIGNED NULL AFTER outward_delivery_id,
    ADD FOREIGN KEY (rework_of_return_id) REFERENCES provider_returns(id);

SET FOREIGN_KEY_CHECKS = 1;
