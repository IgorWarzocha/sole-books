# 2026-27 ledger

- CSVs in this folder are the source of truth for the tax year.
- Put claimed income in `income.csv` and claimed expenses in `expenses.csv`.
- Put durable equipment in `assets.csv`.
- Put uncertain items in `expense-candidates.csv`, not `expenses.csv`.
- Evidence files live beside the topic: `invoices/`, `subscriptions/`, `hardware/`.
- File a download only after it has been checked and the record says what it is.
- Do not keep hand-written totals. Use `make summary` or `python3 bin/summary data/2026-27 --details`.
