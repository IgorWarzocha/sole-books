from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


BIN = Path(__file__).resolve().parent
LEDGERS = {
    "income.csv": ("received_date", "amount_gbp"),
    "expenses.csv": ("paid_date", "total_gbp"),
    "assets.csv": ("paid_date", "total_gbp"),
    "hmrc.csv": ("date", "amount_gbp"),
}


class LedgerChecksTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.data = self.root / "2026-27"
        self.data.mkdir()

    def run_tool(self, tool, *options):
        command = [sys.executable, str(BIN / tool), str(self.data)]
        if tool == "cashflow":
            command += ["--cash-actuals", str(self.root / "actuals.csv"),
                        "--projections", str(self.root / "projections.csv")]
        result = subprocess.run(command + list(options), capture_output=True, text=True)
        self.assertNotIn("Traceback", result.stderr)
        return result

    def write_ledger(self, filename, recorded="2026-06-01", amount="12.50"):
        date_field, money_field = LEDGERS[filename]
        (self.data / filename).write_text(
            f"{date_field},{money_field}\n{recorded},{amount}\n"
        )

    def test_nonfinite_ledger_amounts_are_reported_without_tracebacks(self):
        for tool in ("summary", "cashflow"):
            for filename in LEDGERS:
                for amount in ("NaN", "sNaN", "Infinity", "-Infinity"):
                    with self.subTest(tool=tool, filename=filename, amount=amount):
                        self.write_ledger(filename, amount=amount)
                        result = self.run_tool(tool, "--check")
                        self.assertEqual(result.returncode, 1)
                        self.assertIn(f"{filename}:2: bad money", result.stderr)
                        (self.data / filename).unlink()

    def test_cashflow_opening_and_projection_nonfinite_amounts(self):
        for amount in ("NaN", "sNaN", "Infinity", "-Infinity"):
            with self.subTest(amount=amount):
                result = self.run_tool("cashflow", "--check", f"--opening={amount}")
                self.assertEqual(result.returncode, 1)
                self.assertIn("bad money in opening", result.stderr)
                for filename in ("actuals.csv", "projections.csv"):
                    path = self.root / filename
                    path.write_text(f"date,amount_gbp\n2026-06-01,{amount}\n")
                    result = self.run_tool("cashflow", "--check")
                    self.assertEqual(result.returncode, 1)
                    self.assertIn(f"{filename}:2: bad money", result.stderr)
                    path.unlink()

    def test_dates_must_belong_to_cash_basis_tax_year(self):
        for tool in ("summary", "cashflow"):
            for filename in LEDGERS:
                for recorded in ("2026-04-05", "2027-04-06", "2026-02-30", "", "not-a-date"):
                    with self.subTest(tool=tool, filename=filename, recorded=recorded):
                        self.write_ledger(filename, recorded=recorded)
                        result = self.run_tool(tool, "--check")
                        self.assertEqual(result.returncode, 1)
                        self.assertIn(f"{filename}:2:", result.stderr)
                        (self.data / filename).unlink()

    def test_tax_year_boundaries_and_normal_amounts_pass(self):
        for recorded in ("2026-04-06", "2027-04-05"):
            for filename in LEDGERS:
                self.write_ledger(filename, recorded=recorded)
            for tool in ("summary", "cashflow"):
                result = self.run_tool(tool, "--check")
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertIn("£12.50", result.stdout)

    def test_non_tax_year_folders_do_not_apply_year_constraints(self):
        for folder in ("fixture", "2026-28"):
            self.data = self.root / folder
            self.data.mkdir()
            self.write_ledger("income.csv", recorded="2020-01-01")
            for tool in ("summary", "cashflow"):
                result = self.run_tool(tool, "--check")
                self.assertEqual(result.returncode, 0, result.stderr)

    def test_invoice_and_projection_dates_are_not_receipt_dates(self):
        (self.data / "income.csv").write_text(
            "received_date,invoice_date,amount_gbp\n2026-04-06,2026-03-01,12.50\n"
        )
        (self.root / "projections.csv").write_text(
            "date,amount_gbp\n2027-05-01,20.00\n"
        )
        for tool in ("summary", "cashflow"):
            result = self.run_tool(tool, "--check")
            self.assertEqual(result.returncode, 0, result.stderr)

    def test_warning_mode_still_reports_invalid_input(self):
        self.write_ledger("income.csv", amount="NaN")
        for tool in ("summary", "cashflow"):
            result = self.run_tool(tool)
            self.assertEqual(result.returncode, 0)
            self.assertIn("bad money", result.stderr)


if __name__ == "__main__":
    unittest.main()
