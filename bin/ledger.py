"""CSV ledger parsing and cash-basis tax-year validation."""
import csv
from datetime import date
from decimal import Decimal, InvalidOperation
import re


def money(value, path, row_num, field, errors):
    value = (value or "").strip().replace(",", "")
    if not value:
        return Decimal("0")
    try:
        amount = Decimal(value)
        if not amount.is_finite():
            raise InvalidOperation
        return amount
    except InvalidOperation:
        errors.append(f"{path}:{row_num}: bad money in {field}: {value!r}")
        return Decimal("0")

def read_rows(path, errors=None):
    if not path.exists():
        return []
    with path.open(newline="") as f:
        rows = list(csv.DictReader(f))
    year = re.fullmatch(r"(\d{4})-(\d{2})", path.parent.name)
    if errors is not None and year:
        start = int(year[1])
        if 1 <= start < 9999 and (start + 1) % 100 == int(year[2]):
            field = {
                "income.csv": "received_date",
                "expenses.csv": "paid_date",
                "assets.csv": "paid_date",
                "hmrc.csv": "date",
            }.get(path.name)
            if field:
                for idx, row in enumerate(rows, start=2):
                    value = (row.get(field) or "").strip()
                    try:
                        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
                            raise ValueError
                        recorded = date.fromisoformat(value)
                    except ValueError:
                        errors.append(f"{path}:{idx}: bad date in {field}: {value!r}")
                        continue
                    if not date(start, 4, 6) <= recorded <= date(start + 1, 4, 5):
                        errors.append(f"{path}:{idx}: {field} {value!r} outside tax year {path.parent.name}")
    return rows
