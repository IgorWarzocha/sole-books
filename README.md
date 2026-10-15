# Sole books

Your sole-trader books, in files you own. Give your agent the figures and evidence, then see your income, costs, invoices and cashflow in one place.

Sole books brings the day-to-day work into a repo: CSV ledgers you can inspect, an agent that helps maintain them, and a read-only dashboard for the bigger picture. Keep track of what has been paid, what is still expected and what needs doing next without hiding the working behind a bookkeeping app.

It is built for UK sole traders using cash-basis records, with cashflow projections and Universal Credit tracking alongside the books.

![Sole books with Grok Bot, Cursor cloud, and the dashboard preview.](docs/how-i-use-it.png)

*How I use it: Grok Bot, Cursor cloud, and the dashboard preview.*

## Try the example

Opening this repo, forking it, or using **Use this template** lands on `demo`. Explore a fictional 2026-27 year for Jordan Hale, trading as Hale Studio. See how receipts, expenses and invoices feed the dashboard before adding anything of your own.

## Make it yours

You are on `uk`, the empty template. Create your own branch from here before adding personal records. Use `demo` to explore the fictional Hale Studio year.

Use a private repository for real records. The dashboard is localhost-only and has no login. Keep it that way, or use an authenticated tunnel for remote access.

1. Get the `uk` branch. A fork has it. **Use this template** copies `demo` unless you include all branches. If `uk` is not in your copy, fetch it from this repo.
2. Create your own branch from `uk`.
3. Work through [the UK setup checks](rules/uk.md#before-using-real-books), then let your agent fill the CSVs, invoices and `state.md` from your figures.
4. When this template improves, merge upstream `uk` into your branch. Your data files will conflict on purpose. Keep your rows and take the structural changes.

Personal records do not go on `demo` or `uk`. `uk` stays empty because that is the branch that gets upgraded later.

## What you get

- CSV ledgers, cashflow, Universal Credit periods, and a to-do list
- Glance, a read-only dashboard. From the repo root: `npm install --prefix glance`, then `npm run dev --prefix glance`, then open http://127.0.0.1:48173
- Totals with `make summary`, `make cashflow`, and `make check`
- An invoice skeleton in `templates/invoices/`
- `AGENTS.md`, the operating manual for an agent

The ledger tools need Python 3 and Make. The UC checker and full test suite also need Node.js with its built-in test runner. The dashboard needs npm too. You choose the agent and how it gets access to the repo.

UK dates and the Universal Credit taper live in `rules/uk.md`. A later country branch can replace that file.

On `uk` the ledgers have headers and no rows. Zeros on the dashboard are the empty template. `demo` is a fictional 2026-27 year.

## You stay in control

Your agent can maintain records, check totals and prepare invoices or reports. You review the evidence and approve anything sent outside the repo. Keep personal books and supporting documents in a private repository, and check what your chosen agent provider can access.

This is a bookkeeping framework, not an accountant or a filing service. Its checks do not certify tax or benefit compliance. Check the scope and assumptions in [UK rules](rules/uk.md) against your circumstances before relying on the figures.

It does not provide Making Tax Digital submissions or VAT accounting. If those apply, use the compatible software and workflows required for your circumstances. UC forecasts use separately reconciled assessment periods, with MIF and loss checks for the supported scope. Complex cases use a reviewed manual estimate. See [UK rules](rules/uk.md#universal-credit) for the inputs and [the audit and fixes](docs/compliance-audit.md) for what changed.

## Licence

MIT. See [LICENSE](LICENSE).
