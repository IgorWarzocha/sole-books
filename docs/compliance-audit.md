# UK compliance audit and fixes

Reviewed 15 October 2026 against published HMRC and DWP guidance. Initial scope: `demo` at `503ce5d` and `origin/uk` at `34ad3e4`. This is a technical review, not a legal opinion or official approval.

## Result

The audit identified real calculation and configuration defects, not a reason to abandon CSV books. The fixes below replace those behaviours. These books still need accurate evidence, claimant-specific inputs and the external filing workflows that apply to the trader.

| Finding | Resolution |
| --- | --- |
| UC assessment periods, reports and payments hard-coded to example dates | Separate configured assessment, reporting, expected-payment and receipt dates. No invented future periods or reminders without a configured reporting task. |
| Minimum Income Floor ignored | Explicit net MIF input required for calculated periods. Unknown MIF cannot produce an automatic estimate. |
| Losses discarded at zero | Losses carry into the next contiguous calculated period, with an opening-balance consistency check. |
| Tax expenses reused as UC expenses | UC uses separately reconciled period income and allowable expenses. No automatic deduction of all finance outflows or omission just because a purchase lives in the tax asset ledger. |
| Surplus, household and complex MIF-loss cases guessed | Automatic calculation is bounded to a declared single-self-employment scope. Potential surplus earnings and MIF with losses fail visibly. Other cases use a separately reviewed manual estimate with notes. |
| Future rates applied before their effective date | Work allowance, taper and capital deduction selected by assessment-period start. Gross entitlement is an explicit period input covering all applicable elements. |
| Actual payment date inferred from period end or prose | Received payments require a dedicated receipt date. A projection never becomes money received. |
| Dashboard bound to every network interface | Localhost-only on port **48173**, with strict-port failure instead of silently selecting another port. No authentication is implied. |
| Invalid `NaN` money passed the summary checker | Non-finite amounts rejected with diagnostics. Cash-basis ledger dates checked against the tax-year folder. |
| Tax onboarding and scope unclear | UK setup checks cover registration, deadlines, retention, VAT and MTD. Mandated workflows are routed to compatible software rather than falsely claimed as implemented. |

## Corrected fictional example

The £120 tablet and £18 subscription create a £138 May-period UC loss. That reduces June earnings from £832 to £694, producing a £381.70 taper deduction and £323.20 fictional payment. July's £18 loss reduces August earnings to £1,158, giving a £636.90 deduction and £68.00 fictional payment.

The demo explicitly assumes a single claimant with no other earnings, an eligible start-up period and no MIF. Future periods are configured planning assumptions tied to the invoice pipeline and subscription rate. None is a real DWP award or submission. No personal records belong in either distribution branch.

## Scope that remains outside this product

- This is not a VAT-return or MTD-submission product. Applicable legal obligations still require the relevant compatible software and filing process. A cash-basis tax-year total is not a rolling VAT-threshold test.
- UC calculation is not a universal entitlement engine. Household earnings, existing surplus earnings, MIF interacting with losses, sanctions and other unmodelled adjustments need a reviewed manual input. A user-entered manual estimate is not validated as a DWP award.
- Recorded claimable amounts are not automatic decisions about expense allowability. Cars, property, financing and private use need case-specific treatment.
- Agent approval instructions are process guidance, not a technical permission system. Users must review evidence and approve anything leaving the repo.
- Localhost access does not replace private Git hosting, safe agent-provider access or an authenticated remote-access path.

The [UK rules](../rules/uk.md) document setup, calculation scope and migration from earlier books. Existing personal branches must reconcile their own dates, MIF, expense treatment and opening losses. They must not inherit fictional claimant assumptions.

## Validation

The umbrella check includes Python ledger and generated-view tests, Node UC calculation and CSV regression tests, and verification of stored period results against the same calculator used by Glance. Review and branch-specific validation are recorded with the delivery, not treated as legal certification.

The non-VAT invoice skeleton and inspected demo invoices contain the standard identity, address, customer, number, supply-date, invoice-date, description and total fields. The skeleton is not a VAT invoice solution.

## Official sources

- [DWP: self-employment and Universal Credit](https://www.gov.uk/self-employment-and-universal-credit)
- [DWP: reporting business income and expenses](https://www.gov.uk/government/publications/universal-credit-for-the-self-employed/how-to-report-your-earnings-from-self-employment)
- [DWP: MIF, losses and surplus earnings](https://www.gov.uk/government/publications/universal-credit-for-the-self-employed/universal-credit-and-self-employment-quick-guide)
- [DWP: allowable business expenses](https://www.gov.uk/government/publications/universal-credit-for-the-self-employed/business-expenses-you-can-report-to-universal-credit-if-you-are-self-employed)
- [HMRC: record retention](https://www.gov.uk/self-employed-records/how-long-to-keep-your-records)
- [HMRC: Making Tax Digital eligibility](https://www.gov.uk/guidance/find-out-if-and-when-you-need-to-use-making-tax-digital-for-income-tax)
- [GOV.UK: invoice requirements](https://www.gov.uk/invoicing-and-taking-payment-from-customers/invoices-what-they-must-include)
- [HMRC: VAT registration](https://www.gov.uk/vat-registration/when-to-register)
