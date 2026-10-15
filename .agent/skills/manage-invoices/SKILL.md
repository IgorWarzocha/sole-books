---
name: manage-invoices
description: "Read before drafting, issuing, crediting or reconciling invoices and their payments."
---

1. Read `trader.csv`, the agreement, existing numbers and `documents.csv`. Confirm client, service, dates, USD price and agreed terms. Load the applicable country bookkeeping skill before deciding sales-tax treatment or invoice requirements.
2. Agree genuine deposits or milestones from the work and commercial terms. Never invent them to change tax timing.
3. Copy the US skeleton in `templates/invoices/` into the owning calendar-year invoice folder. Verify state, local and industry requirements. Include business and client identity, unique number, service dates, invoice date, due date, description and amounts. Resolve taxability before replacing the sales-tax placeholder. Do not publish SSNs, EINs or sensitive banking instructions.
4. Keep drafts distinct from issued documents. If exporting a PDF, open it and verify text, tax, totals and layout against the HTML.
5. Prepare the complete issue bundle: HTML, PDF if exported, `documents.csv` entry and gross cashflow projection on the agreed due date. The document total includes any sales tax. Record issue only when confirmed or directly authorised. No client transmission without direct user approval.
6. An issued unpaid invoice uses projection `status=issued`. It is not income. On evidenced receipt, split service revenue into `income.csv` and pass-through sales tax into `sales-tax.csv`, linked by invoice number. Update settlement and reduce the gross projection, retaining any unpaid balance.
7. Give a credit note its own `CN-` number and link the original in `related_document`. Preserve the original. A credit note is not a cash refund. Record money returned only on actual movement and review the corresponding revenue and tax treatment.
8. Finish with matching HTML, PDF if present, document total and status, receipts, tax records and outstanding cashflow. Run the affected year's checks. A draft, issue, credit note and payment remain distinct events.
