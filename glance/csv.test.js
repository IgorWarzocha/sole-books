import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv } from './csv.js';

test('quoted commas, escaped quotes, multiline evidence and BOM are preserved', () => {
  assert.deepEqual(parseCsv('\uFEFFdate,notes\r\n2026-12-31,"Quote ""and"" comma, kept\nnext line"\r\n'), [{ date: '2026-12-31', notes: 'Quote "and" comma, kept\nnext line' }]);
});

test('malformed CSV cannot silently shift columns or alter quoted facts', () => {
  assert.throws(() => parseCsv('date,notes\n2026-06-23,,extra\n'), /column count/);
  assert.throws(() => parseCsv('date,notes\n2026-06-23,"unfinished'), /unterminated/);
  assert.throws(() => parseCsv('amount_usd,notes\n1"2",evidence\n'), /quote inside/);
  assert.throws(() => parseCsv('amount_usd,notes\n"12"3,evidence\n'), /after closing quote/);
});
