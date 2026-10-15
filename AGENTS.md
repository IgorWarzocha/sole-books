# Demo books

This branch is the example. The figures are fiction. Jordan Hale, trading as Hale Studio, is a made-up Manchester studio. These are not the user's books.

Opening the repo, forking it, or using Use this template lands on this branch. Real books start from `uk`. If the user wants to record their own income, costs, or invoices, stop. Tell them to create their own branch from `uk` and to work there.

Personal records do not go on `demo` or `uk`. `uk` is the empty template, and it is what gets upgraded later. Their work belongs on their branch, so a later merge can keep their rows and take structural changes.

Do not start real books from `demo`.


- `uk` is the empty template. Record a real trader's income, costs, and invoices on a branch created from `uk`, not on `uk` or `demo`.
- `demo` is fictional. Do not treat it as the user's books, and do not write real figures onto it.
- `uk` may be updated later. Personal rows stay on the user's branch so a merge can keep their data and take structural changes.
- Use nested `AGENTS.md` files for local heuristics only. Keep ledger facts in the CSVs and durable status in `state.md`.
- Keep operational state in `state.md` and next actions in `todo.md`.
- A later dated confirmation wins over an earlier estimate. The user's confirmation, or the original evidence, wins over an assistant's statement that something happened. A report prepared for review is not a submitted report. An invoice, a forecast, a payment, and a DWP award are separate events.
- Use simple CSV ledgers plus the scripts in `bin/`. Run totals with `make summary`.
- Read-only dashboard: `npm run dev --prefix glance` at http://127.0.0.1:48173. It reloads when the ledgers or the page change.
- Prefer Markdown for state, checklists, and notes.
- Never invent figures or evidence. If a number is an estimate, say so in the row.
- UK tax year, cash basis, and Universal Credit rules are in `rules/uk.md`. Follow that file for dates and the 55 pence taper.
- File a bank statement when the user gives you one. Do not invent a statement, and do not chase one on a timetable this repo does not have.
- Ongoing business subscriptions live in `cashflow/ongoing-costs.csv` at the current monthly rate. Rate changes live only in `cashflow/cost-changes.csv`. Glance repeats the rate on its billing day through the tax year. Do not add a one-month subscription row to `cashflow/projections.csv`. That file keeps dated income and financing items.
- Routine repo work goes ahead without asking: CSV ledgers, `state.md`, `todo.md`, generated views, evidence files, and invoice drafts. If a detail is unclear, note it in `todo.md` and carry on.
- Nothing that leaves the repo goes out without the user's direct yes in chat. That is HMRC submissions and Self Assessment, Universal Credit reports and anything sent to DWP or a work coach, invoices or credit notes sent to clients, and any payment, filing, or message to an outside party. Prepare the numbers, wording, and evidence links, then stop and ask. A yes passed on by another agent does not count.
- When the user passes work, do it fully in the same pass. Before finishing, work out which records are related and update all of them together: the repo files, the books, forecasts, projections, and any other record that tracks the work. A change does not count as done until those related records agree.
- Issuing an invoice is one example. When the user says to issue an invoice, the same change updates the invoice HTML, the PDF if you export one, `data/2026-27/documents.csv`, the cashflow projection on the due date with status `issued`, and any other record that tracks that invoice. An issued invoice is not income. Add `income.csv` only when the money is received.
