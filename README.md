# Sole books

A framework for keeping UK sole-trader books in a repo, with an agent. It is meant to take the place of a paid bookkeeping service.

This branch is `uk`, the empty template. Opening the repo, forking it, or using **Use this template** lands on `demo`. That branch is the example, and the figures there are fiction. Real books start from `uk`: create your own branch from it. Personal records do not go on `demo` or `uk`, because `uk` is what gets upgraded later.

![How I use it: Grok Bot, Cursor cloud, and the dashboard preview. It works with anything.](docs/how-i-use-it.png)

*How I use it: Grok Bot, Cursor cloud, and the dashboard preview. It works with anything.*

## Responsibility

The agents in this repo can keep the books, check the figures, and prepare what would be filed or sent. You are responsible for managing that safely. You decide what goes out, and you check it.

It is not an accountant. The authors accept no liability for how it is used.

## Make it yours

You arrive on `demo`, the fictional Hale Studio year. Use it to see how the books work. Do not start real books there.

1. Get the `uk` branch. A fork has it. **Use this template** copies `demo` unless you include all branches. If `uk` is not in your copy, fetch it from this repo.
2. Create your own branch from `uk`.
3. Let your agent fill the CSVs, invoices, and `state.md` from your figures.
4. When this template improves, merge upstream `uk` into your branch. Your data files will conflict on purpose. Keep your rows and take the structural changes.

Personal records do not go on `demo` or `uk`. `uk` stays empty because that is the branch that gets upgraded later.

## What you get

- CSV ledgers, cashflow, Universal Credit periods, and a to-do list
- Glance, a read-only dashboard. From the repo root: `npm install --prefix glance`, then `npm run dev --prefix glance`, then open http://127.0.0.1:8765
- Totals with `make summary`, `make cashflow`, and `make check`
- An invoice skeleton in `templates/invoices/`
- `AGENTS.md`, the operating manual for an agent

UK dates and the Universal Credit taper live in `rules/uk.md`. A later country branch can replace that file.

On `uk` the ledgers have headers and no rows. Zeros on the dashboard are the empty template. `demo` is a fictional 2026-27 year.

## Licence

MIT. See [LICENSE](LICENSE).
