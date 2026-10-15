---
name: us-bookkeeping
description: "Read before setting up US books, recording transactions or reviewing US tax treatment."
---

Read [federal recording and setup](references/federal.md). For setup, sales tax, invoices or contractor payments, also read [state and reporting checks](references/state-and-reporting.md). Verify current official guidance when treatment or deadlines matter.

1. Read `state.md`, `todo.md` and existing rows. Establish whether evidence proves an invoice, receipt, payment or expectation. Confirm supported scope before recording tax treatment.
2. Retain supplied evidence in its topic folder and link the original. Use actual receipt or payment dates. Explain estimates and evidence gaps.
3. Use `data/<calendar-year>/income.csv` for received trading income, `expenses.csv` for paid operating costs and `assets.csv` for equipment. Record explicit reviewed `claimable_usd` amounts. Keep unresolved costs in `expense-candidates.csv`. Never assume cash basis permits immediate equipment expensing.
4. Separate gross receipts, processor fees, refunds and sales tax. Reconcile platform reports without adding a 1099 total as new income. Loans, owner contributions and transfers are not trading revenue.
5. Use `tax-payments.csv` for personal federal or state income-tax and self-employment-tax payments, not deductible expenses. Use `sales-tax.csv` only for tax held for government, with positive amounts and `collection`, `remittance` or `refund` types. Explain jurisdiction and invoice linkage.
6. Update document settlement and remaining projections with each receipt. Keep subscription rates in ongoing costs and dated changes, not duplicate projections. A partial payment leaves the remaining receivable.
7. Run `make check`, selecting `TAX_YEAR=YYYY` where needed. Use focused checks while investigating, then the full gate once. Record durable decisions in `state.md` and specific unresolved evidence or treatment in `todo.md`.

For period close or invoice lifecycle work, discover and load the applicable reconciliation or invoicing skill. Preparation does not authorise sending, filing or payment.
