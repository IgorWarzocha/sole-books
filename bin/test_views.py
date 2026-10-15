import csv
from pathlib import Path
import runpy
import tempfile
import unittest


generate = runpy.run_path(str(Path(__file__).with_name("views")))["generate"]


class LedgerViewsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.data = Path(self.temp.name)
        self.output = self.data / "output"
        (self.data / "income.csv").write_text(
            "received_date,amount_usd\n2026-06-01,125.30\n2026-05-31,7.05\n"
        )
        with (self.data / "expenses.csv").open("w", newline="") as stream:
            writer = csv.writer(stream)
            writer.writerows([
                ["paid_date", "supplier", "total_usd", "claimable_usd"],
                ["2026-05-31", 'Example, "Ltd"', "80.00", "20.00"],
                ["2026-06-01", 'Example, "Ltd"', "60.00", "0"],
                ["2026-06-02", "Other", "3.15", "3.15"],
            ])
        (self.data / "assets.csv").write_text(
            "paid_date,total_usd,claimable_usd\n2026-06-01,50.00,25.00\n"
        )

    def read(self, name):
        with (self.output / name).open(newline="") as stream:
            return list(csv.reader(stream))

    def test_month_boundaries_business_shares_and_supplier_quoting(self):
        generate(self.data, self.output)
        self.assertEqual(self.read("monthly-ledger.csv"), [
            ["Tax-ledger measure (USD)", "2026-05", "2026-06", "Total"],
            ["Income", "7.05", "125.30", "132.35"],
            ["Operating expenses", "20.00", "3.15", "23.15"],
            ["Reviewed asset deductions", "0.00", "25.00", "25.00"],
            ["Profit after reviewed asset deductions", "-12.95", "97.15", "84.20"],
        ])
        self.assertEqual(self.read("expenses-by-supplier.csv"), [
            ["Supplier (claimed USD)", "2026-05", "2026-06", "Total"],
            ['Example, "Ltd"', "20.00", "0.00", "20.00"],
            ["Other", "0.00", "3.15", "3.15"],
        ])

    def test_bad_money_does_not_replace_previous_snapshot(self):
        generate(self.data, self.output)
        before = {p.name: p.read_bytes() for p in self.output.iterdir()}
        for invalid in ("oops", "NaN", "Infinity"):
            with self.subTest(invalid=invalid):
                (self.data / "income.csv").write_text(
                    f"received_date,amount_usd\n2026-06-01,{invalid}\n"
                )
                with self.assertRaises(ValueError):
                    generate(self.data, self.output)
                self.assertEqual(before, {p.name: p.read_bytes() for p in self.output.iterdir()})


if __name__ == "__main__":
    unittest.main()
