"""Validated USD cash-basis calendar-year ledger input."""
import csv
from datetime import date
from decimal import Decimal, InvalidOperation
import re

SCHEMAS = {
    'income.csv': ('received_date', 'amount_usd'),
    'expenses.csv': ('paid_date', 'total_usd', 'claimable_usd'),
    'assets.csv': ('paid_date', 'total_usd', 'claimable_usd'),
    'tax-payments.csv': ('date', 'authority', 'type', 'amount_usd', 'reference', 'notes'),
    'sales-tax.csv': ('date', 'type', 'jurisdiction', 'invoice_no', 'amount_usd', 'evidence_file', 'notes'),
    'actuals.csv': ('date', 'flow', 'status', 'amount_usd'),
    'projections.csv': ('date', 'flow', 'status', 'amount_usd'),
}


def money(value, path, row_num, field, errors):
    value = (value or '').strip().replace(',', '')
    try:
        amount = Decimal(value)
        if not amount.is_finite():
            raise InvalidOperation
        return amount
    except InvalidOperation:
        errors.append(f'{path}:{row_num}: bad money in {field}: {value!r}')
        return Decimal('0')


def read_rows(path, errors=None):
    problems = errors if errors is not None else []
    if not path.is_file():
        problems.append(f'{path}: missing ledger')
        rows = []
    else:
        try:
            with path.open(newline='', encoding='utf-8') as stream:
                reader = csv.DictReader(stream, strict=True)
                headers = reader.fieldnames or []
                required = SCHEMAS.get(path.name, ())
                if len(headers) != len(set(headers)) or not set(required) <= set(headers):
                    problems.append(f'{path}: malformed schema; required fields: {", ".join(required)}')
                rows = list(reader)
        except (OSError, UnicodeError, csv.Error) as exc:
            problems.append(f'{path}: cannot read CSV: {exc}')
            rows = []
    year = int(path.parent.name) if re.fullmatch(r'\d{4}', path.parent.name) else None
    date_field = {'income.csv': 'received_date', 'expenses.csv': 'paid_date', 'assets.csv': 'paid_date'}.get(path.name, 'date')
    valid_rows = []
    for idx, row in enumerate(rows, 2):
        if None in row or any(v is None for v in row.values()):
            problems.append(f'{path}:{idx}: malformed row')
            continue
        valid_rows.append(row)
        value = (row.get(date_field) or '').strip()
        try:
            if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
                raise ValueError
            recorded = date.fromisoformat(value)
            if year and recorded.year != year:
                problems.append(f'{path}:{idx}: {date_field} {value!r} outside calendar year {year}')
        except ValueError:
            problems.append(f'{path}:{idx}: bad date in {date_field}: {value!r}')
        for field in ('amount_usd', 'total_usd', 'claimable_usd'):
            if field in SCHEMAS.get(path.name, ()):
                if field == 'claimable_usd' and not (row.get(field) or '').strip():
                    problems.append(f'{path}:{idx}: unresolved deduction in {field}; record reviewed amount, including explicit zero')
                money(row.get(field), path, idx, field, problems)
        if path.name == 'sales-tax.csv':
            if row.get('type') not in ('collection', 'remittance', 'refund'):
                problems.append(f'{path}:{idx}: invalid sales-tax type')
            if money(row.get('amount_usd'), path, idx, 'amount_usd', problems) <= 0:
                problems.append(f'{path}:{idx}: sales-tax amount must be positive')
    if errors is None and problems:
        raise ValueError('\n'.join(problems))
    return valid_rows
