---
name: reconcile-books
description: "Read before reconciling statements, closing a bookkeeping period or investigating differences between evidence, ledgers and forecasts."
---

1. Define the period, accounts and records being reconciled. Read `state.md` and existing unresolved actions. Ask for missing evidence only when it blocks the requested conclusion. A missing statement means an incomplete reconciliation, not a zero balance.
2. Match supplied statement movements and source evidence to the ledgers in both directions. Check dates, gross amounts, fees, business shares, refunds, partial payments and duplicated rows. Separate loans, transfers and non-cash items from cash trading receipts.
3. Trace issued invoices and credit notes through `documents.csv`, their source files and received payments. An unpaid invoice is not missing cash-basis income. Do not mark an invoice paid from an expectation or from a partial receipt.
4. Compare cashflow actuals and outstanding projections with the matched events. Clear fulfilled projections, retain only outstanding amounts, and distinguish total cash paid from the claimable business share. A running cashflow delta is not a bank balance without a verified opening balance and all account movements.
5. Load an applicable country-specific bookkeeping skill before changing claimed amounts or tax treatment. If UC is involved, reconcile its assessment periods separately, including equipment, tax, pension, loss and MIF inputs. A tax-year reconciliation does not close a UC period.
6. Correct errors only where evidence supports the correction. Never invent balancing income, costs, payments or evidence. Update related document, cashflow and UC records together when a correction changes them.
7. Run `make check`, selecting `TAX_YEAR=YYYY-YY` when needed. It includes the year totals. Explain the opening balance, matched movements, closing balance and outstanding differences when the evidence supports a cash reconciliation. Otherwise state exactly which scope was checked.
8. Record reconciliation scope and evidence references in `state.md`, with unresolved items in `todo.md`. A check passing does not make an incomplete period reconciled, a prepared report submitted, or a forecast received.
