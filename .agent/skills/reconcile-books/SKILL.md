---
name: reconcile-books
description: "Read before reconciling statements, closing a bookkeeping period or investigating differences between evidence, ledgers and forecasts."
---

1. Define period, accounts and records. Read `state.md` and unresolved actions. A missing statement means an incomplete reconciliation, not a zero balance.
2. Match movements and evidence to ledgers in both directions. Check gross receipts, fees, refunds, business shares, partial payments and duplicates. Separate loans, owner transfers and non-cash events from revenue.
3. Trace invoices and credit notes through `documents.csv`, source files and payments. Include separately recorded sales-tax collections when testing gross settlement. Unpaid invoices are not missing cash-basis income.
4. Reconcile cashflow actuals and outstanding projections. Clear fulfilled forecasts, retain unpaid amounts and distinguish total cash cost from reviewed deduction. A running delta is not a bank balance without an evidenced opening balance and all movements.
5. Load the applicable country bookkeeping skill before changing tax treatment. Reconcile personal tax payments separately from business deductions, and sales-tax collections, refunds and remittances separately from revenue. A period's sales-tax movement is not an established liability without its opening balance and jurisdiction review.
6. Correct only from evidence. Never invent balancing entries or claimable amounts. Update affected documents, ledgers and cashflow together.
7. Run `make check`, selecting `TAX_YEAR=YYYY` as needed. State the opening balance, matched movements, closing balance and remaining differences only where supported. Otherwise state the exact checked scope.
8. Record scope and evidence references in `state.md`, gaps in `todo.md`. Passing checks does not make a period reconciled, a report filed or a forecast received.
