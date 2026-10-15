# Universal Credit

- Keep Universal Credit separate from the tax year. Use assessment-period dates, not a copy of the tax-year totals.
- The date rules, the 55 pence taper, and what not to deduct are in `rules/uk.md`.
- Current numbers live in `rates.csv` and `assessment-periods.csv`. Distinguish a prepared estimate, a submitted report, and a statement.
- Glance projects an unpaid period, and the following periods, from money already in the period plus expected dates in `cashflow/projections.csv` and the subscription run-rate. A projection is not `actual_paid_gbp`.
- Do not record the same income or expense line twice.
- Preserve exact wording and dates from DWP. Do not turn a comment into a confirmed rule.
- Financed equipment: claim the business amount actually paid in the assessment period, once, unless the user's own decision says otherwise. Write that decision in `state.md` when they have one. Do not also claim the full price up front.
