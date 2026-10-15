Resolve jurisdiction-specific obligations using the relevant state revenue agency and county or city authority. No federal-first template can establish nationwide service taxability or invoice compliance. Sources reviewed 15 October 2026.

## State and local setup

Record operating locations, physical presence, what is sold, customer destinations and marketplace involvement. Check legal-name or DBA registration, business licences, zoning, state income or franchise taxes, local taxes and renewal deadlines. A disregarded LLC can still owe state fees. Start with [SBA registration guidance](https://www.sba.gov/business-guide/launch-your-business/register-your-business), then verify with the owning authority.

For each relevant jurisdiction, confirm service taxability, nexus, registration, effective dates, filing frequency, sourcing, exemptions and marketplace handling. Remote-sales thresholds differ and do not replace physical-presence tests. Do not assume every service is exempt: compare [New York's taxable transactions](https://www.tax.ny.gov/bus/st/subject.htm) with [Texas taxable services](https://comptroller.texas.gov/taxes/publications/96-259.php). Track purchase use-tax obligations separately where applicable. This repo does not calculate them.

`sales-tax.csv` is only for tax collected from buyers and held for government. Record positive amounts using `collection`, `remittance` or `refund`, with jurisdiction, evidence and invoice linkage where applicable. Exclude that tax from `income.csv` and business deductions. Do not duplicate its cash movements in `cashflow/actuals.csv`. Verify opening liabilities and periods before treating the running movement as a reconciled amount due. Taxes legally imposed on the seller may need different income and expense treatment. Review that case rather than forcing it into this pass-through ledger. See [Publication 334](https://www.irs.gov/publications/p334).

## Invoices

Use the US skeleton only after confirming local and industry requirements. Include accurate business and customer identity, unique number, service description and dates, USD amounts, due date and agreed terms. Show sales tax and any required jurisdiction, rate or registration detail only after verifying it. A generic zero tax line does not establish exemption. Keep sensitive payment instructions outside the repo and provide them through a secure approved channel.

For this repo, `documents.csv` records the customer-facing total, including any sales tax. Record received service revenue in `income.csv` and received pass-through tax in `sales-tax.csv`, linked by invoice number. Their combined amounts support settlement without treating tax as revenue. Reduce the outstanding gross cashflow projection for partial payments. Credit notes and cash refunds remain distinct events.

## Information returns

Review contractor payments before year end. Determine payee classification, payment type, payment method, exceptions and backup withholding, and obtain W-9 information through secure external storage. For payments made in 2026, the general Form 1099-NEC threshold is $2,000. Other payment types, backup withholding and state requirements can differ. Later years need the applicable inflation-adjusted threshold. Check [IRS information-return requirements](https://www.irs.gov/businesses/small-businesses-self-employed/am-i-required-to-file-a-form-1099-or-other-information-return) and the relevant year's form instructions. Do not treat the threshold as a deduction test or automatically issue a second return for payments reportable by a payment settlement entity.

Reconcile incoming 1099-NEC, MISC and K forms to receipts already recorded, not as extra revenue. The federal third-party-network Form 1099-K threshold is more than $20,000 and more than 200 transactions. Payment-card reporting has different rules, and state thresholds can differ. A form may arrive below a threshold. Taxable income can exist without a form, while reported gross totals can include non-income items, sales tax, refunds or fees needing reconciliation. See [IRS 1099-K guidance](https://www.irs.gov/businesses/what-to-do-with-form-1099-k).

Keep filing dates and secure filing arrangements in `state.md`. The repo does not generate or submit information returns. Direct user approval is required for any outside transmission.
