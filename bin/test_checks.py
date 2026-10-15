import csv
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from ledger import SCHEMAS

BIN = Path(__file__).resolve().parent


class LedgerChecksTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.data = self.root / '2026'
        self.data.mkdir()
        for name, fields in SCHEMAS.items():
            path = self.root / name if name in ('actuals.csv', 'projections.csv') else self.data / name
            self.write(path, fields, [])

    def write(self, path, fields, rows):
        with path.open('w', newline='') as stream:
            writer = csv.DictWriter(stream, fieldnames=fields)
            writer.writeheader()
            writer.writerows(rows)

    def ledger(self, name, **values):
        self.write(self.data / name, SCHEMAS[name], [values])

    def run_tool(self, tool, *args):
        cmd = [sys.executable, str(BIN / tool), str(self.data), *args]
        if tool == 'cashflow':
            cmd += ['--cash-actuals', str(self.root / 'actuals.csv'), '--projections', str(self.root / 'projections.csv')]
        result = subprocess.run(cmd, text=True, capture_output=True)
        self.assertNotIn('Traceback', result.stderr)
        return result

    def test_calendar_boundaries(self):
        for day, valid in [('2026-01-01', True), ('2026-12-31', True),
                           ('2025-12-31', False), ('2027-01-01', False), ('2026-02-30', False)]:
            self.ledger('income.csv', received_date=day, amount_usd='12.50')
            for tool in ('summary', 'cashflow'):
                result = self.run_tool(tool, '--check')
                self.assertEqual(result.returncode, 0 if valid else 1, result.stderr)

    def test_unresolved_deductions_never_fall_back_to_full_cost(self):
        for name in ('assets.csv', 'expenses.csv'):
            self.ledger(name, paid_date='2026-06-01', total_usd='1000', claimable_usd='')
            for tool in ('summary', 'cashflow'):
                result = self.run_tool(tool)
                self.assertEqual(result.returncode, 1)
                self.assertIn('unresolved deduction', result.stderr)
            self.ledger(name, paid_date='2026-06-01', total_usd='1000', claimable_usd='0')
            result = self.run_tool('summary', '--check')
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertRegex(result.stdout, r'Profit after reviewed deductions\s+\$0.00')

    def test_nonfinite_money(self):
        for name in ('income.csv', 'expenses.csv', 'assets.csv', 'tax-payments.csv', 'sales-tax.csv'):
            for amount in ('NaN', 'sNaN', 'Infinity', '-Infinity'):
                values = dict.fromkeys(SCHEMAS[name], '')
                values.update(date='2026-06-01') if 'date' in values else values.update({SCHEMAS[name][0]: '2026-06-01'})
                for field in ('amount_usd', 'total_usd', 'claimable_usd'):
                    if field in values:
                        values[field] = amount
                self.ledger(name, **values)
                for tool in ('summary', 'cashflow'):
                    result = self.run_tool(tool, '--check')
                    self.assertEqual(result.returncode, 1)
                    self.assertIn('bad money', result.stderr)
                self.write(self.data / name, SCHEMAS[name], [])

    def test_tax_separation_and_cashflow_signs(self):
        self.ledger('income.csv', received_date='2026-06-01', amount_usd='100')
        self.ledger('tax-payments.csv', date='2026-06-01', authority='IRS', type='estimated', amount_usd='20')
        rows = [dict(date='2026-06-01', type=kind, amount_usd=amount) for kind, amount in
                [('collection', '10'), ('remittance', '6'), ('refund', '2')]]
        self.write(self.data / 'sales-tax.csv', SCHEMAS['sales-tax.csv'], rows)
        result = self.run_tool('summary', '--check')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertRegex(result.stdout, r'Profit after reviewed deductions\s+\$100.00')
        result = self.run_tool('cashflow', '--check')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertRegex(result.stdout, r'Actual received\s+\$110.00')
        self.assertRegex(result.stdout, r'Actual paid/spent\s+\$28.00')

    def test_missing_and_malformed_files_fail(self):
        for tool in ('summary', 'cashflow'):
            path = self.data / 'income.csv'
            path.unlink()
            result = self.run_tool(tool, '--check')
            self.assertEqual(result.returncode, 1)
            self.assertIn('missing ledger', result.stderr)
            path.write_text('received_date,amount_gbp\n2026-01-01,1\n')
            result = self.run_tool(tool, '--check')
            self.assertEqual(result.returncode, 1)
            self.assertIn('malformed schema', result.stderr)

    def test_projection_dates_can_cross_year(self):
        self.write(self.root / 'projections.csv', SCHEMAS['projections.csv'],
                   [dict(date='2027-01-01', flow='income', status='projected', amount_usd='10')])
        self.assertEqual(self.run_tool('cashflow', '--check').returncode, 0)

    def test_actual_tax_duplicates_are_rejected(self):
        self.write(self.root / 'actuals.csv', SCHEMAS['actuals.csv'],
                   [dict(date='2026-06-01', flow='sales-tax', status='actual', amount_usd='10')])
        result = self.run_tool('cashflow', '--check')
        self.assertEqual(result.returncode, 1)
        self.assertIn('dedicated tax ledgers', result.stderr)

    def test_short_and_long_rows_fail_without_tracebacks(self):
        for line in ('2026-06-01,income', '2026-06-01,income,actual,10,extra'):
            (self.root / 'actuals.csv').write_text('date,flow,status,amount_usd\n' + line + '\n')
            result = self.run_tool('cashflow', '--check')
            self.assertEqual(result.returncode, 1)
            self.assertIn('malformed row', result.stderr)

    def test_nonfinite_opening_and_projections(self):
        for value in ('NaN', 'Infinity'):
            self.assertEqual(self.run_tool('cashflow', '--opening=' + value).returncode, 1)
            self.write(self.root / 'projections.csv', SCHEMAS['projections.csv'],
                       [dict(date='2027-01-01', flow='income', status='projected', amount_usd=value)])
            self.assertEqual(self.run_tool('cashflow', '--check').returncode, 1)

if __name__ == '__main__':
    unittest.main()
