import test from 'node:test';
import assert from 'node:assert/strict';
import { cents, usd, today, calendarYear, addMonth, dayCount, expandOngoing, invoiceSummary, forecastRows } from './calendar.js';

test('issued invoices due today or overdue remain in upcoming events across year boundaries', () => {
  const rows = [
    { when: '2025-12-31', status: 'issued' },
    { when: '2026-01-01', status: 'issued' },
    { when: '2026-01-02', status: 'expected' },
    { when: '2025-12-31', status: 'expected' },
    { when: '2027-01-01', status: 'expected' },
    { when: null, status: 'issued' },
  ];
  assert.deepEqual(forecastRows(rows, '2026-01-01', '2026'), rows.slice(0, 3));
});

test('calendar and timezone boundaries do not inherit host timezone or April cutoffs', () => {
  const instant = new Date('2027-01-01T00:30:00Z');
  assert.equal(today(instant), '2027-01-01');
  assert.equal(today(instant, 'America/Los_Angeles'), '2026-12-31');
  assert.equal(calendarYear('2026-01-01'), '2026');
  assert.equal(calendarYear('2026-12-31'), '2026');
  assert.equal(addMonth('2026-12-01'), '2027-01-01');
  assert.equal(dayCount('2026-12-31', '2027-01-01'), 1);
  assert.throws(() => today(instant, 'invalid/zone'), RangeError);
});

test('USD source cents remain exact and malformed money fails visibly', () => {
  assert.equal(cents('1.01'), 101);
  assert.equal(cents('-0.01'), -1);
  assert.equal(cents('19.90'), 1990);
  assert.equal(usd(101), '$1.01');
  assert.equal(usd(-101), '-$1.01');
  for (const value of ['', '1.001', 'NaN', '1,000']) assert.throws(() => cents(value));
});

test('recurring forecasts stop on December 31 and exclude today', () => {
  const row = { billing_day: '28', amount_usd: '0.01', effective_from: '2026-01-01', description: 'Subscription' };
  assert.deepEqual(expandOngoing([row], '2026-11-28', '2026').map((r) => r.when), ['2026-12-28']);
  assert.deepEqual(expandOngoing([row], '2026-12-31', '2026'), []);
  assert.equal(expandOngoing([row], '2027-01-01', '2027').length, 12);
});

test('invoice-linked tax collections and refunds settle gross invoices without becoming income', () => {
  const documents = [{ number: 'A', type: 'invoice', status: 'issued', amount: 11000 }];
  const income = [{ invoice_no: 'A', amount: 10000 }];
  const collection = { invoice_no: 'A', type: 'collection', amount: 1000 };
  assert.equal(invoiceSummary(documents, income, [collection]).outstanding, 0);
  assert.equal(invoiceSummary(documents, income, [collection, { ...collection, type: 'refund', amount: 200 }]).outstanding, 200);
  assert.equal(invoiceSummary(documents, income, [{ ...collection, type: 'remittance' }]).outstanding, 1000);
  assert.equal(invoiceSummary(documents, income, [{ ...collection, invoice_no: 'B' }]).outstanding, 1000);
  assert.deepEqual(income, [{ invoice_no: 'A', amount: 10000 }]);
});
