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
2. Ask your agent to set up your books using [SETUP.md](SETUP.md). It will ask for your business details, check what needs researching and help you bring in existing records or work alongside your current tools.
3. Review the setup with your agent before relying on the books. Confirm your federal, state and local obligations. Do not put SSNs, EINs, W-9 forms or bank credentials in this repository.
4. Give your agent receipts, paid costs and invoice details as they arrive. An unpaid invoice is not cash-basis income.

## What you get

- Income, expenses, equipment, invoice records and cashflow projections in plain CSVs
- Separate records for personal tax payments and sales tax held for government
- Glance: `npm install --prefix glance`, then `npm run dev --prefix glance`, then open http://127.0.0.1:48173
- `make summary` for recorded income less reviewed deductions, `make cashflow` for cash movements, and `make check` for consistency checks
- A US invoice skeleton in `templates/invoices/`
- Agent-assisted setup, bookkeeping, reconciliation and invoices

The ledger tools need Python 3 and Make. The complete checks also need Node.js with its built-in test runner. Glance needs npm. Choose your own agent and check what its provider can access.

The ledgers are empty. Dashboard zeros mean no records, not a completed or reconciled year. Setup establishes the years and records you need.

## You stay in control

Your agent can maintain records, reconcile evidence and prepare documents. You approve anything sent outside the repo, including invoices, filings and payments.

This is not an accountant or a filing service. It does not calculate federal income tax, self-employment tax, estimated payments, depreciation elections or state liabilities. A summary is a bookkeeping subtotal, not a completed Schedule C or tax return. Sales-tax entries track recorded collections, refunds and remittances, not whether a sale is taxable or where registration is required.

Verify current IRS, state and local requirements for your circumstances with a qualified US tax professional. Passing checks does not establish deductibility, completeness or compliance.

## Licence

MIT. See [LICENSE](LICENSE).
