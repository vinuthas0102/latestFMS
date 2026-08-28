/*
# Seed installment plans for the govt official's demands

1. Purpose
- The govt official user (Rajesh Kumar, owner e994a47e-bed9-4c0c-a443-f68c266bca51)
  currently has 2 demands (1 PAID maintenance, 1 DUE rent) with no installment plans.
- This migration adds 3 new demands (overdue rent, property tax, insurance) for the
  same owner and creates installment plans for all 5 demands so the estate manager
  can demonstrate installment plans defined under the Installments tab, and the
  govt official can pay installments through the demo payment gateway.

2. New Data
- 3 new demands for owner e994a47e (Rajesh Kumar), object b2222222-...-003 (BHEL-RNP-T3-015):
  - RENT (overdue, 3500, due 2026-06-05)
  - PROPERTY_TAX (due, 12000, due 2026-09-15)
  - INSURANCE (due, 18000, due 2026-10-15)
- 5 installment plans total (2 existing demands + 3 new):
  - Each plan has a Full Payment row (row_number=0) plus 2-4 installment rows
  - Mix of PAID, DUE, OVERDUE, and PENDING statuses across installments

3. Security
- No schema changes. No RLS policy changes.
- All inserts use ON CONFLICT DO NOTHING for idempotency.

4. Important Notes
- The estate manager can see all demands with installment plans.
- The govt official can see their own demands with installment plans.
- No data is deleted or transformed.
*/

-- ── New demands for Rajesh Kumar (owner e994a47e) ──────────────────────────────
-- Object: b2222222-0000-0000-0000-000000000003 (BHEL-RNP-T3-015, QUARTER)
-- Demand type IDs: RENT=ddaf72a5, PROPERTY_TAX=f042cb6f, INSURANCE=406957d6

INSERT INTO dcc_demands (id, object_id, owner_id, demand_type_id, demand_run_date, due_date, amount, amount_paid, status, generation_source)
VALUES
  -- RENT overdue for June 2026 (3500)
  ('d3330000-0000-0000-0000-000000000070', 'b2222222-0000-0000-0000-000000000003', 'e994a47e-bed9-4c0c-a443-f68c266bca51', 'ddaf72a5-9799-420d-a143-8ddd300f4268', '2026-06-01', '2026-06-05', 3500, 0, 'OVERDUE', 'AUTO'),
  -- PROPERTY_TAX due for Q3 2026 (12000)
  ('d3330000-0000-0000-0000-000000000071', 'b2222222-0000-0000-0000-000000000003', 'e994a47e-bed9-4c0c-a443-f68c266bca51', 'f042cb6f-fd80-4985-9793-07a378caa652', '2026-08-01', '2026-09-15', 12000, 0, 'DUE', 'AUTO'),
  -- INSURANCE due for 2026-27 (18000)
  ('d3330000-0000-0000-0000-000000000072', 'b2222222-0000-0000-0000-000000000003', 'e994a47e-bed9-4c0c-a443-f68c266bca51', '406957d6-5572-4429-9e7f-b6f4fefa020e', '2026-07-01', '2026-10-15', 18000, 0, 'DUE', 'AUTO')
ON CONFLICT (id) DO NOTHING;

-- ── Installment plans for all 5 demands (2 existing + 3 new) ─────────────────────

INSERT INTO dcc_installment_plans (id, demand_id, no_of_installments, late_fee, interest_pct_pa, discount_full_payment_pct, gst_pct, gst_type, installment_start_date, due_days_with_late_fee, balance_payment)
VALUES
  -- Existing: RENT demand ff69b63b (DUE, 3500) — 2 installments
  ('e4440000-0000-0000-0000-000000000010', 'ff69b63b-c9dc-4ac3-826d-2149a467a22d', 2, 100, 0, 0, 0, 'inclusive', '2026-07-05', 7, 3500),
  -- Existing: MAINTENANCE demand 1df4b551 (PAID, 1200) — 1 installment, fully paid
  ('e4440000-0000-0000-0000-000000000011', '1df4b551-6830-4c41-a44e-153ab2990299', 1, 0, 0, 0, 0, 'inclusive', '2026-06-10', 0, 1200),
  -- New: RENT overdue d3330000-...-070 (3500) — 2 installments, 1st overdue
  ('e4440000-0000-0000-0000-000000000012', 'd3330000-0000-0000-0000-000000000070', 2, 100, 0, 0, 0, 'inclusive', '2026-06-05', 7, 3500),
  -- New: PROPERTY_TAX d3330000-...-071 (12000) — 4 quarterly installments
  ('e4440000-0000-0000-0000-000000000013', 'd3330000-0000-0000-0000-000000000071', 4, 200, 0, 1.5, 0, 'inclusive', '2026-09-15', 15, 12000),
  -- New: INSURANCE d3330000-...-072 (18000) — 2 semi-annual installments
  ('e4440000-0000-0000-0000-000000000014', 'd3330000-0000-0000-0000-000000000072', 2, 300, 0, 0, 18, 'inclusive', '2026-10-15', 15, 18000)
ON CONFLICT (id) DO NOTHING;

-- ── Installment rows ────────────────────────────────────────────────────────────

INSERT INTO dcc_installment_rows (id, plan_id, row_number, label, percentage, amount, due_date, paid_date, paid_amt, status, late_fee, due_date_with_late_fee, gst_amount)
VALUES
  -- ═══ Plan 10: Existing RENT demand ff69b63b (DUE, 3500) — 2 installments ═══
  ('f5550010-0000-0000-0000-000000000000', 'e4440000-0000-0000-0000-000000000010', 0, 'Full Payment', 100, 3500, '2026-07-05', NULL, 0, 'DUE', 0, NULL, 0),
  ('f5550010-0000-0000-0000-000000000001', 'e4440000-0000-0000-0000-000000000010', 1, '1st Installment — Jul 2026', 50, 1750, '2026-07-05', NULL, 0, 'DUE', 0, NULL, 0),
  ('f5550010-0000-0000-0000-000000000002', 'e4440000-0000-0000-0000-000000000010', 2, '2nd Installment — Aug 2026', 50, 1750, '2026-08-05', NULL, 0, 'PENDING', 0, NULL, 0),

  -- ═══ Plan 11: Existing MAINTENANCE demand 1df4b551 (PAID, 1200) — 1 installment, fully paid ═══
  ('f5550011-0000-0000-0000-000000000000', 'e4440000-0000-0000-0000-000000000011', 0, 'Full Payment', 100, 1200, '2026-06-10', '2026-06-08', 1200, 'PAID', 0, NULL, 0),
  ('f5550011-0000-0000-0000-000000000001', 'e4440000-0000-0000-0000-000000000011', 1, 'Single Payment', 100, 1200, '2026-06-10', '2026-06-08', 1200, 'PAID', 0, NULL, 0),

  -- ═══ Plan 12: New RENT overdue d3330000-...-070 (3500) — 2 installments, 1st overdue ═══
  ('f5550012-0000-0000-0000-000000000000', 'e4440000-0000-0000-0000-000000000012', 0, 'Full Payment', 100, 3500, '2026-06-05', NULL, 0, 'OVERDUE', 100, '2026-07-12', 0),
  ('f5550012-0000-0000-0000-000000000001', 'e4440000-0000-0000-0000-000000000012', 1, '1st Installment — Jun 2026', 50, 1750, '2026-06-05', NULL, 0, 'OVERDUE', 100, '2026-07-12', 0),
  ('f5550012-0000-0000-0000-000000000002', 'e4440000-0000-0000-0000-000000000012', 2, '2nd Installment — Jul 2026', 50, 1750, '2026-07-05', NULL, 0, 'PENDING', 0, NULL, 0),

  -- ═══ Plan 13: PROPERTY_TAX d3330000-...-071 (12000) — 4 quarterly installments ═══
  ('f5550013-0000-0000-0000-000000000000', 'e4440000-0000-0000-0000-000000000013', 0, 'Full Payment (1.5% discount)', 100, 11820, '2026-09-15', NULL, 0, 'DUE', 0, NULL, 0),
  ('f5550013-0000-0000-0000-000000000001', 'e4440000-0000-0000-0000-000000000013', 1, 'Q1 — Sep 2026', 25, 3000, '2026-09-15', NULL, 0, 'DUE', 0, NULL, 0),
  ('f5550013-0000-0000-0000-000000000002', 'e4440000-0000-0000-0000-000000000013', 2, 'Q2 — Dec 2026', 25, 3000, '2026-12-15', NULL, 0, 'PENDING', 0, NULL, 0),
  ('f5550013-0000-0000-0000-000000000003', 'e4440000-0000-0000-0000-000000000013', 3, 'Q3 — Mar 2027', 25, 3000, '2027-03-15', NULL, 0, 'PENDING', 0, NULL, 0),
  ('f5550013-0000-0000-0000-000000000004', 'e4440000-0000-0000-0000-000000000013', 4, 'Q4 — Jun 2027', 25, 3000, '2027-06-15', NULL, 0, 'PENDING', 0, NULL, 0),

  -- ═══ Plan 14: INSURANCE d3330000-...-072 (18000) — 2 semi-annual installments ═══
  ('f5550014-0000-0000-0000-000000000000', 'e4440000-0000-0000-0000-000000000014', 0, 'Full Payment', 100, 18000, '2026-10-15', NULL, 0, 'DUE', 0, NULL, 0),
  ('f5550014-0000-0000-0000-000000000001', 'e4440000-0000-0000-0000-000000000014', 1, '1st Half — Oct 2026', 50, 9000, '2026-10-15', NULL, 0, 'DUE', 0, NULL, 0),
  ('f5550014-0000-0000-0000-000000000002', 'e4440000-0000-0000-0000-000000000014', 2, '2nd Half — Apr 2027', 50, 9000, '2027-04-15', NULL, 0, 'PENDING', 0, NULL, 0)
ON CONFLICT (id) DO NOTHING;
