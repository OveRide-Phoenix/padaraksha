# Product

## Register

product

## Users

**Primary:** Factory floor supervisor. In the factory office throughout the shift, logging work assignments, inward material receipts, QC results, and attendance. Data-entry-heavy usage — they're in the app for hours, not minutes. Screen time is at a desk under fluorescent or natural daylight.

**Secondary:** Factory owner/admin. Checks payroll, reviews reports, manages article definitions and employee records. Less frequent but higher-stakes interactions — decisions, not just data entry.

## Product Purpose

Full production lifecycle management for a contract sandal manufacturing factory. The factory receives raw materials and purchase orders from provider companies, manufactures sandals, and ships finished goods back. The app tracks every step: inward materials → work assignment → QC → outward delivery → payroll.

Success looks like: the supervisor can log a day's worth of work quickly and accurately, and the owner can trust the numbers at end-of-day without manual reconciliation.

## Brand Personality

Craft, precision, warmth. Like a quality leather goods workshop — deliberate, tactile, material. Not cold productivity software. Not decorative consumer design. The tool should feel like it belongs in the same world as the product being made: leather, thread, earth, amber.

## Anti-references

- **Generic SaaS dashboards**: rounded cards everywhere, purple/blue gradients, hero-metric panels, icon grids, confetti illustrations. The visual language of "startup productivity tool" is exactly wrong here.
- **Enterprise ERP (SAP/Oracle style)**: grey, cluttered, form-heavy, zero personality, trust-destroying UX.

## Design Principles

1. **Entry over presentation.** The supervisor is a data producer, not a data viewer. Every screen should optimize for completing a task quickly — not for looking impressive at a glance.
2. **Material warmth.** Color, texture, and spacing should feel grounded in the physical world of the factory: warm whites, earthy ambers, dark slate. Never cold, never neon, never synthetic.
3. **Density with breathing room.** Tables and forms need to be data-dense — but not claustrophobic. Rhythm in spacing is more important than generous whitespace everywhere.
4. **Earned hierarchy.** Importance communicates through weight, scale, and position — not through cards, borders, or decorative containers. If something is secondary, it should look secondary.
5. **Trust through precision.** Numbers need to read at a glance. Labels must be exact. Ambiguous states (missing data, mismatched quantities, overdue deadlines) must be visually distinct from normal states — never subtle.

## Accessibility & Inclusion

WCAG AA minimum. Both light and dark themes must meet contrast requirements independently — system default, not forced. No motion assumptions; respect `prefers-reduced-motion`.
