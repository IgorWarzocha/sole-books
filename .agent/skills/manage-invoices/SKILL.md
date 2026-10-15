---
name: manage-invoices
description: "Read before drafting, issuing, crediting or reconciling invoices and their payments."
---

1. Read `trader.csv`, the agreement, existing invoice numbers and the relevant `documents.csv` rows. Confirm client identity, scope, supply date, price, terms and VAT status. Load an applicable country-specific bookkeeping skill for VAT treatment and any UC timing implications.
2. Compare genuine single or staged payments against delivery, costs, cashflow and the client's payment history. Agree terms before issue. Never invent deposits or milestones, or time an invoice solely to change a UC deduction.
3. Use the non-VAT skeleton in `templates/invoices/` only for a non-VAT trader. Include the legal and trading names, serviceable trader address, contact details, customer name and address, unique number, supply and invoice dates, description, amounts and total. Check [official invoice requirements](https://www.gov.uk/invoicing-and-taking-payment-from-customers/invoices-what-they-must-include). A VAT-registered trader needs the appropriate VAT workflow, not the skeleton's non-registration statement.
4. Follow local invoice naming and export conventions. Fill identity and bank details from `trader.csv` before presenting a personalised draft. Leave the template skeleton untouched. If exporting a PDF, open it and check that the text, totals and layout match the HTML.
5. Prepare the complete issue bundle: source HTML, PDF if exported, the tax year's `documents.csv` entry, and a cashflow projection on the actual agreed due date. Drafts remain drafts. Record issue only when confirmed or directly authorised, not merely because a file was generated. No client transmission without the user's direct approval.
6. For an issued unpaid invoice, use `status=issued` in the projection. It is neither received income nor an unissued pipeline item. Update affected projected UC inputs without treating the expected receipt as actual.
7. On an evidenced receipt, record cash-basis income on its arrival date, update the document's settlement status and reduce or clear the matching projection. Preserve any outstanding balance for a partial payment. Then update the affected UC period where applicable.
8. For a credit note, use its own unique `CN-` number and link it to the original document in `related_document`. Preserve the original invoice and the correction trail. A credit note is not evidence of a refund payment; record money returned only when it actually moves, using the applicable bookkeeping treatment.
9. Finish with matching HTML, PDF if present, document amounts and status, outstanding cashflow and UC assumptions. Run the affected year's checks. Keep a draft, an issued invoice, a receipt and a credit note as distinct events.
