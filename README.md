# Sole books

Your sole-proprietor books, in files you own. Give your agent the figures and evidence, then see income, costs, invoices and cashflow in one place.

CSV ledgers keep the working inspectable. Glance, the read-only dashboard, brings together what has been paid, what is expected and what needs doing next.

## US experimental edition

This branch is a starting point for US bookkeeping, not a production-ready tax product. The author is not a US resident. This edition was researched extensively with AI using official US sources. It has not been professionally reviewed. Verify its assumptions with a qualified US tax professional before relying on it.

The supported starting scope is a US-resident individual running a service business as a sole proprietor, using cash-basis records, USD and a calendar year. A disregarded single-member LLC may use the same federal reporting framework, but its state fees and legal obligations still need separate review. There is no payroll, inventory accounting, partnership or corporate return, nonresident workflow, multistate tax engine or benefits calculator.

The UK template remains on `uk`, and `demo` contains fictional UK books. Neither is the starting branch for this edition.

## Make it yours

Use a private repository for real records. Never add personal records to the shared `US-experimental` branch. Glance has no login and binds to localhost. Keep it there, or use an authenticated tunnel for remote access.

1. Get `US-experimental` and create your own private working branch from it.
2. Work through [US setup checks](.agent/skills/us-bookkeeping/references/federal.md#before-using-real-books). Confirm your state and local obligations before issuing invoices or relying on tax treatment.
3. Fill `trader.csv`, `state.md` and `todo.md` from your own evidence. Do not put SSNs, EINs, W-9 forms or bank credentials in this repository.
4. Record receipts and paid costs in `data/2026/`. Keep invoices, fees, refunds and sales tax distinct. An unpaid invoice is not cash-basis income.
5. Review upstream changes before merging them into your branch. Preserve your rows when taking schema changes.

## What you get

- Income, expenses, equipment, invoice records and cashflow projections in plain CSVs
- Separate records for personal tax payments and sales tax held for government
- Glance: `npm install --prefix glance`, then `npm run dev --prefix glance`, then open http://127.0.0.1:48173
- `make summary` for recorded income less reviewed deductions, `make cashflow` for cash movements, and `make check` for consistency checks
- A US invoice skeleton in `templates/invoices/`
- Agent workflows for US bookkeeping, reconciliation and invoices in [.agent/skills/](.agent/skills/)

The ledger tools need Python 3 and Make. The complete checks also need Node.js with its built-in test runner. Glance needs npm. Choose your own agent and check what its provider can access.

The ledgers are empty. Dashboard zeros mean no records, not a completed or reconciled year. Select another calendar year with `make summary TAX_YEAR=2027` after creating its ledger folder from the current headers.

## You stay in control

Your agent can maintain records, reconcile evidence and prepare documents. You approve anything sent outside the repo, including invoices, filings and payments.

This is not an accountant or a filing service. It does not calculate federal income tax, self-employment tax, estimated payments, depreciation elections or state liabilities. A summary is a bookkeeping subtotal, not a completed Schedule C or tax return. Sales-tax entries track recorded collections, refunds and remittances, not whether a sale is taxable or where registration is required.

Read the [federal recording rules](.agent/skills/us-bookkeeping/references/federal.md) and [state, local and information-return checks](.agent/skills/us-bookkeeping/references/state-and-reporting.md). Verify current official guidance for your circumstances. Passing checks does not establish deductibility, completeness or compliance.

## Licence

MIT. See [LICENSE](LICENSE).
