# Cashflow

- This folder is the forward cash view. It is not the tax return.
- Keep dated future income and financing in `projections.csv`.
- Keep the current monthly subscription rate in `ongoing-costs.csv`. Keep rate changes, and only rate changes, in `cost-changes.csv`.
- Glance repeats `ongoing-costs.csv` on the billing day after the latest actual expense. Do not also put that subscription in `projections.csv`.
- Keep tax-ledger facts in `data/2026-27/`. Use `actuals.csv` for real cash movements that are not fresh income or tax expenses, such as repayments of financed equipment.
- Use signed amounts in projections and actuals: income positive, outgoings negative.
- Status words should preserve certainty: `actual`, `scheduled`, `expected`, `recurring`, `rough`, `tbc`, `cancelled`, `issued`.
- `issued` is an invoice that has been issued and is not yet received. It stays on the due date for cash timing. It is not income until it is paid, and it is not the expected-income pipeline. The unpaid figure comes from `documents.csv`.
- The running delta is a planning figure, not a reconciled bank balance.
- Do not invent an exact date for a forecast that has none.
- Do not duplicate a paid or received row here once it is in the ledgers.
- Store credit and payment in kind affect the tax records but not a bank-style cashflow, unless real cash also moved.
- For financed equipment, track future repayments here. The asset itself goes in `assets.csv` when it is bought or received.
