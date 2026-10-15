import fs from 'node:fs';
import { parseCsv } from '../glance/csv.js';
import { calculatePeriods, money } from '../glance/uc.js';

try {
  const rows = calculatePeriods(
    parseCsv(fs.readFileSync('universal-credit/assessment-periods.csv', 'utf8')),
    parseCsv(fs.readFileSync('universal-credit/rates.csv', 'utf8')),
  );
  for (const row of rows) {
    for (const [field, value] of [['estimated_award_gbp', row.award], ['net_earnings_gbp', row.net], ['earnings_deduction_estimate_gbp', row.deduction], ['loss_carried_forward_gbp', row.loss]]) {
      if (value !== null && money(row[field], field) !== value) throw new Error(`${row.period_start}: ${field} does not match calculation (${(value / 100).toFixed(2)})`);
    }
  }
  console.log(`UC: ${rows.length} assessment periods checked`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
