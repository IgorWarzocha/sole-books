# UK rules

This file is the UK-specific layer. A branch for another country should replace it rather than copy the whole repo.

These are recording rules for the books. They are not a tax return and they are not advice. Check GOV.UK and the user's own letters before relying on a figure.

## Tax year

- The UK tax year runs from 6 April to 5 April.
- This template starts with `data/2026-27`, covering 6 April 2026 to 5 April 2027. Add a new folder for the next year when it starts.
- Record income when the money is received and expenses when the money is paid.
- Self Assessment is filed by the user. This repo does not submit it.

## Universal Credit

- Assessment periods in these books run from the 10th of a month to the 9th of the next month.
- Reconciliation and the monthly report are collated on the 9th. That date is about the UC report. It is not a bank-statement download.
- The pay date used for projections is the 16th of the month in which the period ends. Store that date in `report_deadline` on `universal-credit/assessment-periods.csv`. The dashboard reads the pay date from that column.
- Projected UC uses `universal-credit/rates.csv`: standard allowance plus housing element, then `taper_pence_per_pound` off per £1 of take-home pay. The template default is 55. Take-home pay is income minus allowed expenses in the period, floored at 0.
- Calculate the taper in pence and round half up to the nearest penny. Worked shape: take the net in pence, multiply by 55, add 50, and divide by 100, keeping the whole number of pence.
- The default rates row has no work allowance. If the user's statement has one, put it in `work_allowance_gbp`. Do not assume a work allowance they have not got.
- Do not deduct an advance in the formula or the rates file. If a statement is lower because of an advance, say so in the period notes. Do not fold it into the chart.
- Do not deduct savings while capital stays under £6,000. If that changes, set `capital_deduction_gbp` from the statement.
- A chart projection is not money received. Fill `actual_paid_gbp` only when the payment has arrived, and say the arrival date in the notes as `payment arrived YYYY-MM-DD`.
- Invoice timing can be planned around the 9th so a receipt falls in the assessment period you intend. Use real commercial dates. Do not invent a deposit or a milestone to move a receipt.
- Keep UC figures out of the tax-year profit. `make summary` does not treat UC as turnover.

## What the user must still check

- Personal Allowance, other taxable income, and National Insurance before estimating a tax bill.
- Whether they are VAT registered. The invoice skeleton assumes they are not.
- The standard allowance and housing element on their own statement. The rates file is a starting point, not their award.
