export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  let closed = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (closed && ![",", "\n", "\r"].includes(ch)) throw new Error("CSV: unexpected text after closing quote");
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
          closed = true;
        }
      } else field += ch;
    } else if (ch === '"') {
      if (field.length) throw new Error("CSV: quote inside unquoted field");
      quoted = true;
    }
    else if (ch === ",") {
      row.push(field);
      field = "";
      closed = false;
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i += 1;
      row.push(field);
      field = "";
      closed = false;
      if (row.some((cell) => cell.length)) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((cell) => cell.length)) rows.push(row);
  }
  if (quoted) throw new Error("CSV: unterminated quoted field");
  const [header, ...body] = rows;
  if (!header) return [];
  if (new Set(header).size !== header.length || header.some((name) => !name)) throw new Error("CSV: invalid header");
  return body.map((cells, index) => {
    if (cells.length !== header.length) throw new Error(`CSV: wrong column count in record ${index + 2}`);
    return Object.fromEntries(header.map((name, index) => [name, cells[index]]));
  });
}
