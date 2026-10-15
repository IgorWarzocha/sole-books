# Universal Credit

- Keep Universal Credit separate from the tax year. Use assessment-period dates, not a copy of the tax-year totals.
- The date rules, the 55 pence taper, and what not to deduct are in `rules/uk.md`.
- Current numbers live in `rates.csv` and `assessment-periods.csv`. Distinguish a prepared estimate, a submitted report, and a statement.
- Glance uses reconciled assessment-period inputs, not tax totals. Keep projected inputs aligned with invoice timing, cashflow forecasts and ongoing costs. Run `node bin/check_uc.mjs` to check stored calculations.
- Do not record the same income or expense line twice.
- Preserve exact wording and dates from DWP. Do not turn a comment into a confirmed rule.
- Do not treat loan principal as a UC expense. Check the finance agreement and DWP rules before classifying equipment or interest. Never deduct both a purchase and repayments for the same cost.
