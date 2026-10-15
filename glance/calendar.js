// Ledger money is represented as integer USD cents; never round source facts.
export function cents(value) {
  const text = String(value ?? '').trim();
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(text)) throw new Error('Missing or invalid USD amount');
  const [whole, fraction = ''] = text.replace(/^-/, '').split('.');
  const result = (Number(whole) * 100 + Number(fraction.padEnd(2, '0'))) * (text.startsWith('-') ? -1 : 1);
  if (!Number.isSafeInteger(result)) throw new Error('USD amount exceeds safe cents');
  return result;
}

export function usd(amount, compact = false) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: compact ? 0 : 2, maximumFractionDigits: compact ? 0 : 2 }).format(amount / 100);
}

export function today(now = new Date(), timeZone = 'UTC') {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function calendarYear(iso) { return iso.slice(0, 4); }
export function monthStart(iso) { return `${iso.slice(0, 7)}-01`; }
export function addMonth(iso) {
  const [year, month] = iso.split('-').map(Number);
  const next = new Date(Date.UTC(year, month, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-01`;
}
export function dayCount(from, to) { return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000); }

export function forecastRows(projections, asOf, year) {
  // Issued invoices remain actionable even when their expected receipt is overdue.
  return projections.filter((row) => row.when && (row.status.toLowerCase() === 'issued' || (row.when > asOf && calendarYear(row.when) === year)));
}

export function expandOngoing(rows, asOf, year) {
  const forecasts = [];
  const last = `${year}-12-31`;
  for (const row of rows) {
    const day = Number(row.billing_day);
    if (!Number.isInteger(day) || day < 1 || day > 28) throw new Error('Unsupported billing day');
    const amount = cents(row.amount_usd);
    const from = row.effective_from;
    let cursor = monthStart(asOf > from ? asOf : from);
    while (cursor <= last) {
      const when = `${cursor.slice(0, 8)}${String(day).padStart(2, '0')}`;
      if (when > asOf && when >= from) forecasts.push({ when, flow: 'expense', status: 'recurring', description: row.description, amount });
      cursor = addMonth(cursor);
    }
  }
  return forecasts;
}

export function invoiceSummary(documents, income, salesTax) {
  const invoices = documents.filter((row) => row.type.toLowerCase() === 'invoice' && !['cancelled', 'void', 'draft'].includes(row.status.toLowerCase()));
  let paid = 0;
  let outstanding = 0;
  for (const row of salesTax) {
    if (row.amount <= 0 || !['collection', 'refund', 'remittance'].includes(row.type)) throw new Error('Invalid sales-tax entry');
  }
  for (const row of invoices) {
    const receipts = income.filter((item) => item.invoice_no === row.number).reduce((sum, item) => sum + item.amount, 0);
    // Tax is excluded from business income but settles the gross invoice.
    const tax = salesTax.filter((item) => item.invoice_no === row.number).reduce((sum, item) => sum + (item.type === 'collection' ? item.amount : item.type === 'refund' ? -item.amount : 0), 0);
    const remaining = row.status.toLowerCase() === 'paid' ? 0 : Math.max(0, row.amount - receipts - tax);
    outstanding += remaining;
    if (!remaining) paid += 1;
  }
  return { invoices, paid, outstanding };
}
