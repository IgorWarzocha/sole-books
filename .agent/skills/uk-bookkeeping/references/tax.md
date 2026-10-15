Check official guidance and the trader's own HMRC notices before relying on a date, threshold or tax treatment. Record decisions in the trader's own branch, never on the distribution branches.

## Tax year

- The UK tax year runs from 6 April to 5 April.
- This template starts with `data/2026-27`, covering 6 April 2026 to 5 April 2027. Add a new folder for the next year when it starts.
- Record income when the money is received and expenses when the money is paid.
- Self Assessment is filed by the user. This repo does not submit it.

## Before using real books

Record these decisions and evidence in `state.md`, with unresolved actions in `todo.md`.

1. Confirm identity, trading start, accounting basis and registration. Gross trading income over £1,000 generally requires Self Assessment registration, but other circumstances can also require a return. See [setting up as a sole trader](https://www.gov.uk/set-up-sole-trader).
2. Record HMRC filing and payment deadlines. Normally notify HMRC by 5 October following the first relevant tax year, file paper returns by 31 October or online by 31 January, and pay the balancing amount by 31 January. Payments on account can be due on 31 January and 31 July. Check [Self Assessment deadlines](https://www.gov.uk/self-assessment-tax-returns/deadlines), including exceptions for later notices.
3. Retain invoices, receipts and bank evidence, including cash and non-cash transactions. Link entries to evidence. Missing evidence remains an unresolved task. Keep Self Assessment records for at least five years after the relevant 31 January deadline. For 2026-27, normally keep them through 31 January 2033. Check [retention rules](https://www.gov.uk/self-employed-records/how-long-to-keep-your-records) for very late returns and retain records needed for an open enquiry. VAT records generally need at least six years.
4. Check [VAT registration](https://www.gov.uk/vat-registration/when-to-register) using taxable turnover, not cash-basis tax-year profit. For UK-based businesses the general compulsory thresholds are more than £90,000 over the last 12 months, or more than £90,000 expected in the next 30 days. Other conditions can require registration. Record the review date and revisit when turnover changes. This repo does not calculate VAT returns. Its invoice skeleton is non-VAT only.
5. Check [Making Tax Digital eligibility](https://www.gov.uk/guidance/find-out-if-and-when-you-need-to-use-making-tax-digital-for-income-tax). Subject to eligibility and exemptions, qualifying income over £50,000 in 2024-25 requires MTD from 6 April 2026, over £30,000 in 2025-26 from 6 April 2027, and over £20,000 in 2026-27 from 6 April 2028. Qualifying income includes relevant self-employment and property income before expenses. CSVs alone do not meet MTD requirements. If mandated, use compatible software and its supported digital-record and submission workflow. Record that workflow in `state.md`. Manual retyping is not a digital link.
6. Keep the repository private and check the chosen agent provider's access and data handling. Glance binds to `127.0.0.1:48173` without a login. Do not bind it to a public interface. Use an authenticated tunnel for deliberate remote access.

Record business shares and claimable amounts. Keep uncertain costs in `expense-candidates.csv`. Cars, property, finance arrangements and private use need checking against [HMRC expense rules](https://www.gov.uk/expenses-if-youre-self-employed). `make summary` is rough profit, not a tax calculation. `make check` validates recorded amounts and dates, not allowability or completeness.

Before estimating a tax bill, check Personal Allowance, other taxable income and National Insurance against the trader's circumstances. This repo does not calculate a final tax liability.
