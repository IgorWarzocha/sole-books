Verify the relevant tax year's official instructions before relying on treatment or dates. This is a narrow recording workflow, not a tax calculation or filing system. Sources reviewed 15 October 2026.

## Before using real books

Record confirmed decisions in `state.md`, gaps in `todo.md`.

1. Confirm US tax residency, entity classification, trading start, USD and calendar-year cash basis. This template covers an individual service-business sole proprietor. A single-member LLC needs confirmation of disregarded status and its separate state obligations. Payroll, inventory, corporations, partnerships, nonresident returns and foreign-currency accounting need another workflow. See [IRS business structures](https://www.irs.gov/businesses/small-businesses-self-employed/business-structures).
2. Determine federal filing obligations. Sole proprietors generally report business results on Schedule C with Form 1040. Net self-employment earnings of $400 or more generally trigger Schedule SE. That is not a general income-tax exemption. Other filing conditions can apply below it. See the [self-employed tax centre](https://www.irs.gov/businesses/small-businesses-self-employed/self-employed-individuals-tax-center).
3. Establish the annual filing calendar and estimated-tax review using [Form 1040-ES](https://www.irs.gov/forms-pubs/about-form-1040-es). Estimated payments depend on the whole return, withholding, credits and applicable safe harbours, not a fixed percentage of business profit. The usual individual trigger is expecting at least $1,000 due, subject to the worksheet's conditions and exceptions. Payments are generally due in April, June, September and the following January, not four equal calendar quarters. Check the current instructions, holiday shifts and relief notices. A filing extension does not generally extend time to pay. See [estimated taxes](https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes).
4. Complete the [state and local checks](state-and-reporting.md) before relying on invoice or sales-tax treatment.
5. Establish evidence storage, access and retention. Keep gross-receipt records, invoices, refunds, processor statements, paid costs, bank statements and asset basis records. IRS retention is conditional, not a universal three-year deletion rule. Keep property records through the relevant limitation period after disposal and keep longer where state rules or an open issue require it. See [records to keep](https://www.irs.gov/businesses/small-businesses-self-employed/what-kind-of-records-should-i-keep) and [retention periods](https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records).
6. Keep the repository private and Glance on localhost. Store SSNs, EINs, W-9s and sensitive banking instructions in secure external storage, not these ledgers. A non-sensitive evidence reference is enough.

## Cash-basis recording

Use calendar-year folders such as `data/2026`, 1 January through 31 December. Income generally follows actual or constructive receipt, not invoice issue. Record business receipts even without a Form 1099. Funds credited and available through a payment processor may be received before a later bank transfer. Do not count both. Review advance payments, barter and restricted funds against [Publication 334](https://www.irs.gov/publications/p334).

Record gross business receipts and processing fees separately when evidence provides both. Reconcile refunds and credits to the original transaction. Exclude loans and owner transfers from turnover. An unpaid invoice is not cash-basis income, and writing it off generally does not create a cash-basis bad-debt deduction for income never included.

`expenses.csv` holds total paid, business share and the explicit reviewed current-year deduction. These are not interchangeable. Ordinary and necessary business costs still have timing, substantiation and category restrictions. Meals, gifts, travel, vehicles, home office, prepaid costs and mixed use need specific review. Do not force every payment into a fully deductible category.

`assets.csv` holds equipment purchase cost and an explicit reviewed current-year deduction. Capitalisation, placed-in-service dates, depreciation, section 179, bonus depreciation and the de minimis safe harbour require separate eligibility and election decisions. Keep method, basis, business use and supporting calculations with the evidence. Never default the deduction to purchase price. See [Publication 946](https://www.irs.gov/publications/p946) and the [tangible-property rules](https://www.irs.gov/businesses/small-businesses-self-employed/tangible-property-final-regulations).

Personal federal income tax, self-employment tax and state personal income tax belong in `tax-payments.csv` as cash outflows. Use the payment's calendar-year folder, and record the tax year and instalment or balance being paid in `notes`. They do not reduce the business subtotal. Any deductible portion of self-employment tax is a personal-return adjustment, not a Schedule C expense. Separately review deductible business taxes before placing them in expenses.

## What the totals mean

`make summary` subtracts recorded reviewed expense and asset deductions from recorded income. It does not apply depreciation methods, carryovers, home-office limits, credits, the qualified business income deduction or the owner's other income. It is not a completed Schedule C, taxable income or a final federal or state liability.

The annual asset ledger records purchases paid in that year, not a continuing depreciation schedule. Keep prior-year asset deductions and disposals in a separately reviewed schedule and reconcile them when preparing the return. Do not copy an old purchase into a new year, which would duplicate cashflow. This limitation also matters when equipment is first placed in service after its purchase year.

`make cashflow` tracks recorded money movements. It does not prove a bank balance without verified opening balances and all movements. Non-cash transactions need explanation rather than invented bank entries. Checks validate recorded structure and arithmetic, not tax eligibility or complete evidence.
