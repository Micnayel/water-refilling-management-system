# Open questions

Unsettled policies and decisions for the Water Refilling Management System. Record new unknowns here instead of guessing. When a question is decided, move it to "Decided" with the date and the owner.

## Open

| # | Area | Question | Why it matters | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| 2 | Dashboard | Where does "Sales" come from? Current assumption: a sale is recorded when a schedule is completed, with the amount in centavos. Do we also need walk-in refills or a separate sales or POS module? | Decides whether the schema needs a sales table and whether walk-in sales are supported. | Product owner | Open |
| 3 | Registration | Who can self-register: staff only, or customers too? What details are required, and how are staff verified before approval? | Defines roles, the pending-approval flow, and abuse controls. | Product owner | Open |
| 4 | Privacy | Does RA 10173 (PH Data Privacy Act) apply, and is a privacy notice, consent capture, or DPO registration required for customer names, contacts, and locations? | Customer location is personal data. This affects retention, reveal rules, and exports. | Compliance | Open |
| 5 | Maps | Where is the geocoding source, and what is the budget or quota for Google Maps Platform? Are customers pinned manually, geocoded from an address, or both? | Sets cost, accuracy of the heat map, and the server key setup. | Tech lead | Open |
| 7 | Inventory | Which gallon types and sizes are tracked (for example 5-gallon round, slim)? Are deposits or refundable containers tracked? | Defines the inventory schema and the sale price rules. | Product owner | Open |
| 8 | Scheduling | Which recurrence patterns are needed (daily, weekly, custom)? Can schedules overlap for one staff member? How are missed deliveries handled? | Defines the recurrence model and status rules. | Product owner | Open |
| 9 | Roles | Which default roles exist (for example Administrator, Staff, Driver) and what are their default grants? | Needed for the permissions matrix and seeded role defaults. | Product owner | Open |
| 11 | Reports | Which reports are required at launch (sales by period, deliveries by staff, stock movement) and in what export formats? | Drives the reports route and `_EXPORT` audit coverage. | Product owner | Open |
| 12 | Operations | Is there an SMS or email notification requirement for schedule reminders or low stock? | Adds external services, consent rules, and new dependencies. | Product owner | Open |

## Decided

| # | Decision | Date | Decided by |
| --- | --- | --- | --- |
| 1 | Heat Map uses grid-bucketed circle overlays (`google.maps.Circle`) supplied by the shared map wrapper. The deprecated Google Maps heat layer is not used. | 2026-11-07 | Implementation |
| 6 | Heat Map buckets smaller than three customers are suppressed, and the API returns only aggregated barangay cells with counts. Exact threshold remains subject to compliance review. | 2026-11-07 | Implementation |
| 10 | Five visual-only templates ship at launch: Aqua Default, Deep Ocean, Warm Sunrise, Forest Spring, and Midnight. Templates swap design tokens only. | 2026-11-07 | Implementation |
