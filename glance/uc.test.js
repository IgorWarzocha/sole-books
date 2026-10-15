import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePeriods, paymentRows } from './uc.js';
import { parseCsv } from './csv.js';

const rates = [{ effective_from: '2026-04-06', taper_pence_per_pound: '55', work_allowance_gbp: '0.00', capital_deduction_gbp: '0.00' }];
const period = (extra = {}) => ({
  period_start: '2026-05-10', period_end: '2026-06-09', report_deadline: '2026-06-10', expected_payment_date: '2026-06-16',
  calculation_mode: 'calculate', forecast_scope: 'single_self_employment', minimum_income_floor_gbp: '0.00',
  loss_brought_forward_gbp: '0.00', income_gbp: '0.00', expenses_gbp: '138.00', gross_entitlement_gbp: '704.90', other_deductions_gbp: '0.00', notes: 'Test reconciliation: confirmed no MIF, no surplus, single self-employment.', ...extra,
});

test('equipment loss carries to next profit without reading tax rows', () => {
  const rows = calculatePeriods([period(), period({ period_start: '2026-06-10', period_end: '2026-07-09', loss_brought_forward_gbp: '138.00', income_gbp: '850.00', expenses_gbp: '18.00' })], rates);
  assert.equal(rows[0].loss, 13800);
  assert.equal(rows[1].net, 69400);
  assert.equal(rows[1].deduction, 38170);
  assert.equal(rows[1].award, 32320);
  assert.throws(() => calculatePeriods([period(), period({ period_start: '2026-06-10', period_end: '2026-07-09' })], rates), /loss brought forward/);
});

test('MIF, work allowance, dated rates and deductions', () => {
  const row = period({ income_gbp: '100.00', expenses_gbp: '0.00', minimum_income_floor_gbp: '1000.00', other_deductions_gbp: '10.00' });
  const result = calculatePeriods([row], [...rates, { ...rates[0], effective_from: '2027-04-06', work_allowance_gbp: '500.00' }])[0];
  assert.equal(result.award, 14490);
  assert.equal(calculatePeriods([row], [{ ...rates[0], work_allowance_gbp: '100.00', capital_deduction_gbp: '5.00' }])[0].award, 19490);
});

test('unknown MIF, household, surplus and MIF-loss cases cannot produce guessed awards', () => {
  for (const extra of [{ minimum_income_floor_gbp: '' }, { forecast_scope: '' }, { income_gbp: '10000.00' }, { minimum_income_floor_gbp: '1000.00' }]) {
    assert.throws(() => calculatePeriods([period(extra)], rates), /UC:/);
  }
  const manual = calculatePeriods([period({ calculation_mode: 'manual', estimated_award_gbp: '123.45', notes: 'DWP statement reference' })], rates);
  assert.equal(manual[0].award, 12345);
});

test('payment dates are explicit and paid periods never become forecasts', () => {
  const rows = calculatePeriods([period({ actual_paid_gbp: '704.90', payment_received_date: '2026-06-17' })], rates);
  assert.deepEqual(paymentRows(rows, '2026-06-16', true), []);
  assert.deepEqual(paymentRows(rows, '2026-06-17', true), [{ when: '2026-06-17', amount: 70490 }]);
  assert.deepEqual(paymentRows(rows, '2026-06-01', false), []);
  assert.throws(() => calculatePeriods([period({ actual_paid_gbp: '704.90' })], rates), /payment received date/);
  assert.deepEqual(paymentRows(calculatePeriods([period({ expected_payment_date: '' })], rates), '2026-06-01', false), []);
});

test('bad money, overlapping periods and missing rate history fail visibly', () => {
  assert.throws(() => calculatePeriods([period({ income_gbp: 'NaN' })], rates), /invalid/);
  assert.throws(() => calculatePeriods([period(), period()], rates), /overlapping/);
  assert.throws(() => calculatePeriods([period()], []), /no rates/);
  assert.equal(calculatePeriods([period({ income_gbp: '0.01', expenses_gbp: '0.00' })], rates)[0].deduction, 1);
});

test('arbitrary claimant dates are preserved and malformed CSV cannot shift notes into extra columns', () => {
  const rows = calculatePeriods([period({ period_start: '2026-05-17', period_end: '2026-06-16', expected_payment_date: '2026-06-23' })], rates);
  assert.deepEqual(paymentRows(rows, '2026-06-01', false), [{ when: '2026-06-23', amount: 70490 }]);
  assert.deepEqual(parseCsv('date,notes\n2026-06-23,"Quote ""and"" comma, kept"\n'), [{ date: '2026-06-23', notes: 'Quote "and" comma, kept' }]);
  assert.throws(() => parseCsv('date,notes\n2026-06-23,,extra\n'), /column count/);
  assert.throws(() => parseCsv('date,notes\n2026-06-23,"unfinished'), /unterminated/);
  assert.throws(() => parseCsv('income_gbp,notes\n1"2",evidence\n'), /quote inside/);
  assert.throws(() => parseCsv('income_gbp,notes\n"12"3,evidence\n'), /after closing quote/);
});

test('payment windows exclude old tax years without discarding historical loss inputs', () => {
  const periods = calculatePeriods([period({ actual_paid_gbp: '704.90', payment_received_date: '2026-06-16' })], rates);
  assert.deepEqual(paymentRows(periods, '2027-06-01', true, { from: '2027-04-06', to: '2028-04-05' }), []);
  assert.equal(paymentRows(periods, '2026-06-16', true, { from: '2026-06-16', to: '2026-06-16' }).length, 1);
  assert.equal(periods[0].loss, 13800);
});
