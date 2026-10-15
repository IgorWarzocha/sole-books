---
name: uk-bookkeeping
description: "Read before setting up UK books, recording transactions, reviewing tax treatment or preparing Universal Credit figures."
---

Read [tax and setup requirements](references/tax.md) before setting up books or changing tax records. For any UC work, also read [Universal Credit recording and calculation](references/universal-credit.md). Check linked official guidance when eligibility, rates or treatment are uncertain or have changed.

1. Read `state.md`, `todo.md` and the relevant existing rows before recording an event. Use `trader.csv` for identity. Establish whether the source proves an invoice, a receipt, a payment or only an expectation.
2. Inspect supplied evidence and retain the original in the owning evidence folder. Record its path and the actual receipt or payment date. Explain estimates and missing evidence. Do not treat a bank movement's label as an expense-allowability decision.
3. Record received business income in `data/<tax-year>/income.csv`, paid operating costs in `expenses.csv`, durable equipment in `assets.csv`, and HMRC payments in `hmrc.csv`. Record the business share and claimable amount once. Keep unresolved costs in `expense-candidates.csv` until resolved.
4. Reconcile gross receipts and platform fees separately where evidence supplies both. Distinguish cash, payment in kind, loans and transfers. A financed purchase and a repayment are not two deductible purchases.
5. Update related records in the same pass: document payment status, remaining cashflow projections, subscription rates and changes, and any affected UC period inputs. Remove fulfilled forecasts rather than counting a receipt twice. Follow the local folder guidance for evidence and recurring costs.
6. For UC, reconcile each assessment period independently using its actual dates and UC allowability. Include projected receipts and costs only as labelled planning assumptions. Use the reference's supported calculation or an explained manual estimate, not tax totals copied into UC.
7. Finish with `make check`, passing `TAX_YEAR=YYYY-YY` when it is not the default. It includes the summary, cashflow and UC checks. Use individual commands while investigating, without repeating them immediately before the full check. Resolve discrepancies or leave specific evidence gaps in `todo.md`; record durable decisions in `state.md`.

For a full period close or an invoice lifecycle, discover and load the applicable reconciliation or invoicing skill. Keep filing and sending separate from preparation.
