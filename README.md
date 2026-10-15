# Sole books

A framework for keeping UK sole-trader books in a repo, with an agent. It is meant to take the place of a paid bookkeeping service.

![How I use it: Grok Bot, Cursor cloud, and the dashboard preview. It works with anything.](docs/how-i-use-it.png)

*How I use it: Grok Bot, Cursor cloud, and the dashboard preview. It works with anything.*

## Responsibility

This does not file returns, send invoices, or check the figures. The person using it is responsible for their own records, tax, and filings.

It is not an accountant and it is not legal advice. The authors accept no liability for how it is used.

## Make it yours

The default branch is `uk`. Fork the repo, or use **Use this template**. That copies `uk` only.

1. Create your own branch from `uk`.
2. Let your agent fill the CSVs, invoices, and `state.md` from your figures.
3. When this template improves, merge upstream `uk` into your branch. Your data files will conflict on purpose. Keep your rows and take the structural changes.

Personal rows do not belong on `uk`. That branch stays empty so the next update can merge.

`demo` is a fictional 2026-27 year for looking, and for asking an agent how a feature works. It is not a starting point for real books.

## What you get

- CSV ledgers, cashflow, Universal Credit periods, and a to-do list
- Glance, a read-only dashboard. From the repo root: `npm install --prefix glance`, then `npm run dev --prefix glance`, then open http://127.0.0.1:8765
- Totals with `make summary`, `make cashflow`, and `make check`
- An invoice skeleton in `templates/invoices/`
- `AGENTS.md`, the operating manual for an agent

UK dates and the Universal Credit taper live in `rules/uk.md`. A later country branch can replace that file.

On `uk` the ledgers have headers and no rows. Zeros on the dashboard are the empty template.

## Licence

MIT. See [LICENSE](LICENSE).
