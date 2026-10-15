# Invoices

- Use one folder per calendar year: `2026/`, `2027/`, and so on.
- Keep editable HTML in the year folder: `INV-0001.html`, `CN-0001.html`, `INV-0002-draft.html`.
- Put PDF exports under `pdfs/` with the same names.
- `*-draft.html` is not issued. Issued documents are recorded in `data/2026-27/documents.csv`.
- Credit notes use `CN-` numbers and live beside invoices.
- Copy the name, address, and bank details from `trader.csv` into the HTML before anyone sees a draft. The skeleton in `templates/invoices/` keeps placeholders on `uk`.
- After exporting a PDF, check the file. It is a PDF, the text matches the HTML, and the layout is the invoice.
- The skeleton has no company-number field. Do not add one unless the user asks.
- Use plain sentences in anything a client will read.
