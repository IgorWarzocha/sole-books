# Hale Studio demo

These notes are fiction. Jordan Hale is not a real person. Hale Studio is not a real business. Nothing here was sent to HMRC or DWP.

If you want books of your own, create a branch from `uk` and write them there. Do not add real figures to this branch.

## Trader

- Name: Jordan Hale
- Trading as: Hale Studio
- Work: design and simple websites
- Address used on the sample invoices: 18 Example Street, Ancoats, Manchester M1 1EX. Invented for the demo.
- Phone on the sample invoices: 07700 900123, from the range reserved for fiction.
- Trading start in this story: 2026-05-01
- Tax year file: `data/2026-27` (6 April 2026 to 5 April 2027)

## What the year contains

- INV-0001 for £850, received 12 June 2026.
- INV-0002 for £1,200, received 20 August 2026.
- INV-0003 for £600, issued 1 October 2026, due 29 October 2026. Unpaid. Not income.
- INV-0004 for £450, draft dated 2 November 2026, due 16 November 2026. Not issued. The date sits after the 9th so a later receipt, if it were issued and paid on time, would fall in the next Universal Credit assessment period.
- Studio plan: £18 a month from 12 May 2026, then £24 from 12 August 2026. The current rate is in `cashflow/ongoing-costs.csv`. The change is in `cashflow/cost-changes.csv`. Next month is not typed into `projections.csv`.
- A £120 drawing tablet, paid in full on 20 May 2026. It sits in `assets.csv` for tax and is included once in the May UC period's expenses. Tax and UC are separate calculations, not duplicate claims within either calculation.
- A £42.50 rail fare in `expense-candidates.csv`. It is not claimed.

## Universal Credit in the story

The standard allowance is the published 2026-27 single rate for someone aged 25 or over. The housing element is an invented £280, so the example entitlement is £704.90. The taper is 55 pence per £1 of take-home pay, in pence, half up. No work allowance. No advance. No capital deduction. This fictional single claimant has only self-employment earnings and an assumed eligible start-up period with no Minimum Income Floor. Those assumptions are not defaults for real claimants.

The May loss includes the £120 tablet and £18 subscription. Its £138 carries into June. July's £18 loss carries into August. The corrected fictional June-period payment is £323.20 and August-period payment is £68.00. No real award has been changed.

`actual_paid_gbp` and `payment_received_date` are filled on closed example periods. The 10 September to 9 October period is blank on purpose, so the dashboard can show a projection. Three further periods have explicit planning assumptions reconciled to the £600 issued invoice, £400 pipeline receipt and £24 subscription rate. Dates and amounts are fictional, not DWP instructions or money received. The reporting deadline is separate from the payment date.

## Tax

No Self Assessment has been prepared. `hmrc.csv` has no rows. Do not treat the dashboard as a tax bill.
