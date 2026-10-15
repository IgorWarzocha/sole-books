import "./style.css";

let sources = {};

const FORECASTS = new Set(["scheduled", "expected", "recurring", "rough", "tbc", "issued"]);
const NONCASH = ["voucher", "store credit", "payment in kind"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.some((cell) => cell.length)) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((cell) => cell.length)) rows.push(row);
  }
  const [header, ...body] = rows;
  return body.map((cells) => Object.fromEntries(header.map((name, index) => [name, cells[index] ?? ""])));
}

function pence(value) {
  const amount = Number(String(value ?? "").trim().replace(/,/g, ""));
  if (!Number.isFinite(amount)) throw new Error("Missing or invalid money value");
  return Math.round(amount * 100);
}

function gbp(amount, compact = false) {
  const negative = amount < 0;
  const pounds = Math.abs(amount) / 100;
  const text = compact
    ? `£${Math.round(pounds).toLocaleString("en-GB")}`
    : `£${pounds.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return negative ? `−${text}` : text;
}

function londonToday() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function taxYear(asOf) {
  const [year, month, day] = asOf.split("-").map(Number);
  const start = month > 4 || (month === 4 && day >= 6) ? year : year - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
}

function monthStart(iso) {
  return `${iso.slice(0, 7)}-01`;
}

function addMonth(iso) {
  const [year, month] = iso.split("-").map(Number);
  const next = new Date(Date.UTC(year, month, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function nextNinth(asOf) {
  const [year, month, day] = asOf.split("-").map(Number);
  if (day <= 9) return `${year}-${String(month).padStart(2, "0")}-09`;
  const next = addMonth(`${year}-${String(month).padStart(2, "0")}-01`);
  return `${next.slice(0, 8)}09`;
}

function dayCount(from, to) {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

function monthName(iso) {
  return MONTHS[Number(iso.slice(5, 7)) - 1];
}

function fullMonth(iso) {
  return new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

function shortLabel(text) {
  const low = text.toLowerCase();
  const labels = [
    [["jobcentre", "work coach"], "Jobcentre review"],
    [["dwp statement"], "Check DWP statement"],
    [["tax estimate", "hmrc estimate"], "Refresh tax estimate"],
    [["reconcile"], "Reconcile records"],
    [["make summary", "ledger summary"], "Run ledger summary"],
    [["self assessment", "prepare the return"], "Prepare tax return"],
    [["file the return"], "File tax return"],
  ];
  for (const [terms, label] of labels) {
    if (terms.some((term) => low.includes(term))) return label;
  }
  return text.replace(/[`*]/g, "").split(/\s+/).slice(0, 6).join(" ");
}

function fileText(suffix) {
  const hit = Object.entries(sources).find(([file]) => file.endsWith(suffix));
  if (!hit) throw new Error(`Missing ${suffix}`);
  return hit[1];
}

function rowsOf(text, fields, dateField, amountField) {
  const table = parseCsv(text);
  return table.map((row) => {
    for (const field of fields) {
      if (!(field in row)) throw new Error(`Missing column ${field}`);
    }
    return { ...row, when: row[dateField] || null, amount: pence(row[amountField]) };
  });
}

function load(asOf, year) {
  const income = rowsOf(
    fileText(`/${year}/income.csv`),
    ["received_date", "amount_gbp", "client", "invoice_no", "account"],
    "received_date",
    "amount_gbp",
  ).filter((row) => {
    if (!row.when) throw new Error("income.csv: missing date");
    return row.when <= asOf;
  });
  const expenses = rowsOf(
    fileText(`/${year}/expenses.csv`),
    ["paid_date", "claimable_gbp", "category"],
    "paid_date",
    "claimable_gbp",
  ).filter((row) => {
    if (!row.when) throw new Error("expenses.csv: missing date");
    return row.when <= asOf;
  });
  const documentRows = rowsOf(
    fileText(`/${year}/documents.csv`),
    ["date", "type", "number", "amount_gbp", "status"],
    "date",
    "amount_gbp",
  );
  for (const row of documentRows) {
    if (!row.when) throw new Error("documents.csv: missing date");
  }
  const documents = documentRows.filter((row) => row.when <= asOf);
  const drafts = documentRows.filter((row) => row.type.toLowerCase() === "invoice" && row.status.toLowerCase() === "draft");
  const projections = rowsOf(
    fileText("/projections.csv"),
    ["date", "status", "flow", "description", "amount_gbp"],
    "date",
    "amount_gbp",
  ).filter((row) => FORECASTS.has(row.status.toLowerCase()));
  const financing = rowsOf(
    fileText("/actuals.csv"),
    ["date", "flow", "status", "amount_gbp"],
    "date",
    "amount_gbp",
  ).filter((row) => row.when && row.when <= asOf && row.flow.toLowerCase() === "financing" && row.status.toLowerCase() === "actual")
    .map((row) => ({ ...row, amount: Math.abs(row.amount) }));
  return { income, expenses, documents, drafts, projections, financing };
}

function tradingName() {
  const row = parseCsv(sources["trader.csv"] || "")[0];
  const name = (row?.trading_name || "").trim();
  if (!name || name.toLowerCase() === "your trading name") return "Your books";
  return name;
}

function ucPreference(hasPeriods) {
  try {
    const stored = localStorage.getItem("glance-uc");
    if (stored === null) return hasPeriods;
    return stored === "1";
  } catch {
    return hasPeriods;
  }
}

function openTasks() {
  return (sources["todo.md"] || "").split("\n").flatMap((line) => {
    const match = line.trim().match(/^- \[ \] (.+)$/);
    return match ? [match[1]] : [];
  });
}

function invoiceSummary(documents, income) {
  const invoices = documents.filter((row) => row.type.toLowerCase() === "invoice" && !["cancelled", "void", "draft"].includes(row.status.toLowerCase()));
  let paid = 0;
  let outstanding = 0;
  for (const row of invoices) {
    const receipts = income.filter((item) => item.invoice_no === row.number).reduce((sum, item) => sum + item.amount, 0);
    const remaining = row.status.toLowerCase() === "paid" ? 0 : Math.max(0, row.amount - receipts);
    outstanding += remaining;
    if (remaining === 0) paid += 1;
  }
  return { invoices, paid, outstanding };
}

function comingUp(tasks, projections, asOf) {
  const events = [{ when: nextNinth(asOf), label: "UC report", note: "Monthly income & expenses", amount: null, kind: "task" }];
  const undated = [];
  for (const text of tasks) {
    if (text.toLowerCase().includes("9th of every month")) continue;
    const dates = [...text.matchAll(/\d{4}-\d{2}-\d{2}/g)].map((match) => match[0]).filter((when) => when >= asOf);
    if (dates.length) {
      const time = text.match(/\bat (\d{1,2}:\d{2})\b/);
      events.push({ when: dates.sort()[0], label: shortLabel(text), note: time ? time[1] : "Admin", amount: null, kind: "task" });
    } else undated.push(shortLabel(text));
  }
  for (const row of projections) {
    if (!row.when) continue;
    events.push({
      when: row.when,
      label: shortLabel(row.description),
      note: `Forecast · ${row.status}`,
      amount: row.amount,
      kind: "forecast",
    });
  }
  const unique = new Map(events.map((item) => [`${item.when}|${item.label}`, item]));
  return [[...unique.values()].sort((a, b) => a.when.localeCompare(b.when) || a.label.localeCompare(b.label)).slice(0, 5), undated];
}

function expectedCaption(pipeline) {
  const months = [];
  const dated = pipeline.filter((row) => row.when).sort((a, b) => a.when.localeCompare(b.when));
  for (const row of dated) {
    const label = monthName(row.when);
    if (!months.includes(label)) months.push(label);
  }
  if (!months.length) return "Dates TBD";
  if (months.length === 1) return months[0];
  return `${months[0]} – ${months.at(-1)}`;
}

function universalCredit(asOf) {
  const text = fileText("/assessment-periods.csv");
  if (!text) return [];
  return parseCsv(text).flatMap((row) => {
    if (!(row.actual_paid_gbp || "").trim()) return [];
    const amount = pence(row.actual_paid_gbp);
    if (!amount) return [];
    const arrived = `${row.notes || ""}`.match(/payment arrived (\d{4}-\d{2}-\d{2})|paid on (\d{4}-\d{2}-\d{2})/i);
    const when = arrived ? arrived[1] || arrived[2] : row.period_end;
    if (!when || when > asOf) return [];
    return [{ when, amount }];
  });
}

function sumMonth(rows, month) {
  return rows.filter((row) => monthStart(row.when) === month).reduce((sum, row) => sum + row.amount, 0);
}

function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function ucRates() {
  const row = parseCsv(fileText("/rates.csv")).at(-1);
  if (!row) return null;
  const taper = Number(String(row.taper_pence_per_pound).trim());
  if (!Number.isInteger(taper) || taper < 0 || taper > 100) throw new Error("Invalid UC taper");
  return {
    entitlement: pence(row.standard_allowance_gbp) + pence(row.housing_element_gbp),
    taper,
    allowance: pence(row.work_allowance_gbp || "0"),
    capital: pence(row.capital_deduction_gbp || "0"),
  };
}

function taperPence(netPence, pencePerPound) {
  const counted = Math.max(0, netPence);
  return Math.floor((counted * pencePerPound + 50) / 100);
}

function awardForPeriod(start, end, income, expenses, financing, projections, rates) {
  const inWindow = (row) => row.when >= start && row.when <= end;
  const earned = [
    ...income.filter(inWindow),
    ...projections.filter((row) => row.flow.toLowerCase() === "income" && inWindow(row)),
  ].reduce((sum, row) => sum + row.amount, 0);
  const spent = [
    ...expenses.filter(inWindow),
    ...financing.filter(inWindow),
    ...projections.filter((row) => ["expense", "financing"].includes(row.flow.toLowerCase()) && inWindow(row)),
  ].reduce((sum, row) => sum + Math.abs(row.amount), 0);
  const net = Math.max(0, earned - spent);
  const counted = Math.max(0, net - rates.allowance);
  const deduction = taperPence(counted, rates.taper);
  return Math.max(0, rates.entitlement - deduction - rates.capital);
}

function expandOngoing(asOf, year) {
  const rows = parseCsv(fileText("/ongoing-costs.csv"));
  const startYear = Number(year.slice(0, 4));
  const last = `${startYear + 1}-04-05`;
  const forecasts = [];
  for (const row of rows) {
    const day = Number(String(row.billing_day).trim());
    if (!Number.isInteger(day) || day < 1 || day > 28) throw new Error("Unsupported billing day");
    const amount = pence(row.amount_gbp);
    const from = row.effective_from;
    let cursor = monthStart(asOf > from ? asOf : from);
    while (cursor <= last) {
      const when = `${cursor.slice(0, 8)}${String(day).padStart(2, "0")}`;
      if (when > asOf && when >= from && when <= last) {
        forecasts.push({
          when,
          flow: "expense",
          status: "recurring",
          description: row.description,
          amount,
        });
      }
      cursor = addMonth(cursor);
    }
  }
  return forecasts;
}

function ucForecasts(asOf, income, expenses, financing, projections) {
  const rates = ucRates();
  if (!rates) return [];
  const latest = parseCsv(fileText("/assessment-periods.csv")).at(-1);
  if (!latest?.period_end) return [];
  const forecasts = [];
  const push = (start, end, pay) => {
    forecasts.push({
      when: pay,
      amount: awardForPeriod(start, end, income, expenses, financing, projections, rates),
    });
  };
  if (!(latest.actual_paid_gbp || "").trim()) {
    const pay = (latest.report_deadline || `${latest.period_end.slice(0, 8)}16`).slice(0, 10);
    push(latest.period_start, latest.period_end, pay);
  }
  let periodEnd = latest.period_end;
  for (let step = 0; step < 3; step += 1) {
    const start = addDays(periodEnd, 1);
    const [year, month] = start.split("-").map(Number);
    periodEnd = new Date(Date.UTC(year, month, 9)).toISOString().slice(0, 10);
    push(start, periodEnd, `${periodEnd.slice(0, 8)}16`);
  }
  return forecasts.filter((row) => row.when >= asOf);
}

function chart(income, expenses, financing, uc, projections, asOf, year, includeUc) {
  const startYear = Number(year.slice(0, 4));
  let cursor = `${startYear}-04-01`;
  const current = monthStart(asOf);
  const end = `${startYear + 1}-03-01`;
  const dated = projections.filter((row) => row.when && monthStart(row.when) <= end);
  let horizon = dated.reduce((latest, row) => {
    const month = monthStart(row.when);
    return month > latest ? month : latest;
  }, current);
  const ucGhostRows = includeUc ? ucForecasts(asOf, income, expenses, financing, projections) : [];
  for (const row of ucGhostRows) {
    const month = monthStart(row.when);
    if (month <= end && month > horizon) horizon = month;
  }
  const ghostOf = (flow, month) => projections
    .filter((row) => row.when && monthStart(row.when) === month && row.flow.toLowerCase() === flow)
    .reduce((sum, row) => sum + Math.abs(row.amount), 0);
  const ghostUc = (month) => ucGhostRows
    .filter((row) => monthStart(row.when) === month)
    .reduce((sum, row) => sum + row.amount, 0);
  const months = [];
  while (cursor <= horizon && cursor <= end) {
    months.push([
      cursor,
      sumMonth(income, cursor),
      sumMonth(expenses, cursor),
      sumMonth(financing, cursor),
      includeUc ? sumMonth(uc, cursor) : 0,
      ghostOf("income", cursor),
      ghostOf("expense", cursor),
      ghostOf("financing", cursor),
      ghostUc(cursor),
    ]);
    cursor = addMonth(cursor);
  }
  if (!months.length) return '<p class="empty">No months in this tax year yet.</p>';
  const peak = Math.max(...months.map(([, incoming, outgoing, credit, benefit, ghostIn, ghostCost, ghostCredit, ghostBenefit]) => Math.max(
    incoming + ghostIn,
    outgoing + ghostCost,
    credit + ghostCredit,
    benefit + ghostBenefit,
  ))) || 1;
  const scale = Math.round(peak * 1.12);
  const height = (amount) => `${(amount / scale) * 100}%`;
  const stack = (base, actual, ghost) => {
    const solid = actual ? `<i class="${base}" style="height:${height(actual)}"></i>` : "";
    const pale = ghost ? `<i class="${base} ghost" style="height:${height(ghost)}"></i>` : "";
    return `<span class="stack">${solid}${pale}</span>`;
  };
  const bars = months.map(([when, incoming, outgoing, credit, benefit, ghostIn, ghostCost, ghostCredit, ghostBenefit]) => {
    const name = monthName(when);
    const selected = monthStart(when) === current;
    const shownIn = incoming || ghostIn;
    const shownCost = outgoing || ghostCost;
    const shownCredit = credit || ghostCredit;
    const shownUc = benefit || ghostBenefit;
    const label = `${name}: received ${gbp(shownIn)}, operating costs ${gbp(shownCost)}, credit payments ${gbp(shownCredit)}${includeUc ? `, Universal Credit ${gbp(shownUc)}` : ""}`;
    const ucStack = includeUc ? stack("uc-bar", benefit, ghostBenefit) : "";
    return `<button class="month${selected ? " selected" : ""}" type="button" aria-pressed="${selected}" aria-label="${esc(label)}" data-month="${name}" data-income="${gbp(shownIn + (includeUc ? benefit : 0))}" data-cost="${gbp(shownCost)}" data-credit="${gbp(shownCredit)}" data-uc="${gbp(shownUc)}"><span class="bar-pair${includeUc ? " with-uc" : ""}" aria-hidden="true">${stack("income-bar", incoming, ghostIn)}${ucStack}${stack("cost-bar", outgoing, ghostCost)}${stack("credit-bar", credit, ghostCredit)}</span><span>${name}</span></button>`;
  });
  const currentMonth = months.find(([when]) => monthStart(when) === current) || months.at(-1);
  const [, incoming, outgoing, credit, benefit, ghostIn, ghostCost, ghostCredit, ghostBenefit] = currentMonth;
  const ucReadout = includeUc ? `<span><i class="dot uc"></i><span id="selected-uc">${gbp(benefit || ghostBenefit)}</span></span>` : "";
  return `<div class="plot"><div class="axis" aria-hidden="true"><span>${gbp(scale, true)}</span><span>${gbp(Math.round(scale / 2), true)}</span><span>£0</span></div><div class="months">${bars.join("")}</div></div><div class="chart-readout" aria-live="polite"><strong id="selected-month">${monthName(currentMonth[0])}</strong><span><i class="dot green"></i><span id="selected-income">${gbp((incoming || ghostIn) + (includeUc ? benefit : 0))}</span></span>${ucReadout}<span><i class="dot coral"></i><span id="selected-cost">${gbp(outgoing || ghostCost)}</span></span><span><i class="dot"></i><span id="selected-credit">${gbp(credit || ghostCredit)}</span></span></div>`;
}

function eventHtml(event, asOf) {
  const days = dayCount(asOf, event.when);
  const due = days === 0 ? "Today" : `${Math.abs(days)}d ${days < 0 ? "past" : "away"}`;
  const value = event.amount == null
    ? (/^\d{1,2}:\d{2}$/.test(event.note) ? event.note : "Due")
    : `${event.amount > 0 ? "+" : "−"}${gbp(Math.abs(event.amount), true)}`;
  return `<li class="event ${event.kind}${days < 0 ? " overdue" : ""}" title="${esc(event.note)}"><time datetime="${event.when}"><b>${event.when.slice(8, 10)}</b><span>${monthName(event.when)}</span></time><div class="event-body"><strong>${esc(event.label)}</strong><small>${esc(event.note)}</small></div><div class="event-value"><strong>${esc(value)}</strong><small>${due}</small></div></li>`;
}

function sparkline(cash) {
  const months = new Map();
  for (const row of cash) {
    const key = monthStart(row.when);
    months.set(key, (months.get(key) || 0) + row.amount);
  }
  const amounts = [...months.keys()].sort().map((key) => months.get(key));
  if (!amounts.length) return "";
  const peak = Math.max(...amounts, 1);
  const points = amounts.map((amount, index) => {
    const x = amounts.length === 1 ? 0 : (index * 100) / (amounts.length - 1);
    return `${x.toFixed(1)},${(29 - (amount / peak) * 25).toFixed(1)}`;
  }).join(" ");
  return `<svg class="spark" viewBox="0 0 105 32" aria-hidden="true"><polyline points="${points}" fill="none" stroke="#486835" stroke-width="2" stroke-linejoin="round"/></svg>`;
}

function installControls() {
  const app = document.querySelector("#app");
  if (app.dataset.bound) return;
  app.dataset.bound = "1";
  app.addEventListener("click", (event) => {
    const toggle = event.target.closest(".uc-toggle button");
    if (toggle) {
      try {
        localStorage.setItem("glance-uc", toggle.getAttribute("aria-pressed") === "true" ? "0" : "1");
      } catch {
        // The toggle still redraws for this page load.
      }
      render();
      return;
    }
    const button = event.target.closest(".month");
    if (!button) return;
    document.querySelectorAll(".month").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    document.getElementById("selected-month").textContent = button.dataset.month;
    document.getElementById("selected-income").textContent = button.dataset.income;
    document.getElementById("selected-cost").textContent = button.dataset.cost;
    document.getElementById("selected-credit").textContent = button.dataset.credit;
    const uc = document.getElementById("selected-uc");
    if (uc) uc.textContent = button.dataset.uc;
  });
}

function patch(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  const next = template.content.querySelector("main");
  const app = document.querySelector("#app");
  const current = app.querySelector("main");
  if (!current || !next) {
    app.replaceChildren(next);
    return;
  }
  const selected = current.querySelector(".month.selected")?.dataset.month;
  for (const sel of ["header", ".hero", ".metrics", ".board", ".bottom"]) {
    const live = current.querySelector(sel);
    const fresh = next.querySelector(sel);
    if (!live || !fresh) {
      current.replaceWith(next);
      return;
    }
    if (live.innerHTML !== fresh.innerHTML) live.replaceWith(fresh);
  }
  if (!selected) return;
  const button = [...current.querySelectorAll(".month")].find((item) => item.dataset.month === selected);
  if (button && button.getAttribute("aria-pressed") !== "true") button.click();
}

function render() {
  const app = document.querySelector("#app");
  try {
    const asOf = londonToday();
    const year = taxYear(asOf);
    const { income, expenses, documents, drafts, projections, financing } = load(asOf, year);
    const forecast = projections.concat(expandOngoing(asOf, year));
    const cash = income.filter((row) => !NONCASH.some((term) => row.account.toLowerCase().includes(term)));
    const hasPeriods = parseCsv(fileText("/assessment-periods.csv")).some((row) => row.period_end);
    const includeUc = ucPreference(hasPeriods);
    const uc = universalCredit(asOf);
    const ucTotal = includeUc ? uc.reduce((sum, row) => sum + row.amount, 0) : 0;
    const receivedCash = cash.reduce((sum, row) => sum + row.amount, 0);
    const received = receivedCash + ucTotal;
    const costs = expenses.reduce((sum, row) => sum + row.amount, 0);
    const { invoices, paid, outstanding } = invoiceSummary(documents, income);
    const invoiceTotal = invoices.reduce((sum, row) => sum + row.amount, 0);
    const pipeline = projections.filter((row) => row.flow.toLowerCase() === "income" && row.status.toLowerCase() !== "issued");
    const expected = pipeline.reduce((sum, row) => sum + row.amount, 0);
    const [events, undated] = comingUp(openTasks(), forecast, asOf);
    const priorities = ["Check DWP statement", "Refresh tax estimate", "Reconcile records"];
    undated.sort((a, b) => (priorities.includes(a) ? priorities.indexOf(a) : priorities.length) - (priorities.includes(b) ? priorities.indexOf(b) : priorities.length));
    const thisMonthCash = cash.filter((row) => monthStart(row.when) === monthStart(asOf)).reduce((sum, row) => sum + row.amount, 0);
    const thisMonthUc = includeUc ? uc.filter((row) => monthStart(row.when) === monthStart(asOf)).reduce((sum, row) => sum + row.amount, 0) : 0;
    const thisMonth = thisMonthCash + thisMonthUc;
    const ratio = invoices.length ? (paid / invoices.length) * 100 : 0;
    const projects = pipeline.map((row) => `<li class="project"><span>${esc(shortLabel(row.description))}</span><strong>${gbp(row.amount, true)}</strong></li>`).join("");
    const segments = pipeline.map((row) => `<i style="flex:${Math.max(row.amount, 0)}"></i>`).join("");
    const actions = undated.slice(0, 3).map((label) => `<li>${esc(label)}</li>`).join("") || "<li>No undated tasks.</li>";
    const more = undated.length > 3
      ? `<details><summary>${undated.length - 3} more admin items</summary><ul class="actions">${undated.slice(3).map((label) => `<li>${esc(label)}</li>`).join("")}</ul></details>`
      : "";
    const sparkRows = includeUc ? cash.concat(uc) : cash;
    const bare = !income.length && !expenses.length && !documents.length && !drafts.length && !projections.length;
    const name = tradingName();
    document.title = `${name} · Books`;
    const draftNote = drafts.length
      ? `<small>${drafts.length} draft${drafts.length === 1 ? "" : "s"}, not issued</small>`
      : "";
    const emptyNote = bare
      ? `<p class="empty">Nothing recorded yet. These ledgers are empty on purpose. Add a row under data/${esc(year)} and this page fills in.</p>`
      : "";
    const html = `<main>
<header><div><h1>${esc(name)} <span>/ books</span></h1><small>Tax year ${esc(year)}</small></div>
<div class="header-tools"><label class="uc-toggle"><button type="button" aria-pressed="${includeUc}" aria-label="Include Universal Credit"><i></i></button>UC</label></div></header>
<section class="hero" aria-label="Cash received"><div><h2>Money received</h2><p class="total">${gbp(received)}</p></div>
<div class="hero-side"><small>${fullMonth(asOf)} so far</small><strong>${gbp(thisMonth, true)}</strong>${sparkline(sparkRows)}</div></section>
${emptyNote}
<section class="metrics" aria-label="Key figures"><article class="metric"><h2>Unpaid invoices</h2><strong>${gbp(outstanding, true)}</strong><small>${!invoices.length ? "Nothing issued" : outstanding === 0 ? "All settled" : "Still to collect"}</small></article>
<article class="metric pipeline"><h2>Expected income</h2><strong>${gbp(expected, true)}</strong><small>${esc(expectedCaption(pipeline))}</small></article>
<article class="metric costs" title="${gbp(costs)}"><h2>Operating costs</h2><strong>${gbp(costs, true)}</strong><small>${esc(year)} to date</small></article></section>
<div class="board"><section class="panel chart"><div class="panel-head"><h2>Income & operating costs</h2><small>${esc(year)}</small></div>
<div class="legend"><span><i class="dot green"></i>Cash received</span>${includeUc ? '<span><i class="dot uc"></i>Universal Credit</span>' : ""}<span><i class="dot coral"></i>Business costs</span><span><i class="dot"></i>Credit payments</span><span><i class="dot ghost"></i>Projected</span></div>
${chart(cash, expenses, financing, uc, forecast, asOf, year, includeUc)}</section>
<div class="side"><section class="panel"><div class="panel-head"><h2>Invoices</h2></div>
<div class="settlement"><div class="ring" style="--progress:${ratio.toFixed(1)}%" role="img" aria-label="${paid} of ${invoices.length} invoices settled"><strong>${paid}<span style="font-size:12px;color:var(--muted)">/${invoices.length}</span></strong></div>
<div class="settlement-copy"><strong>${gbp(invoiceTotal, true)} invoiced</strong><small>${gbp(outstanding, true)} left to collect</small>${draftNote}</div></div></section>
<section class="panel"><div class="panel-head"><h2>In the pipeline</h2><small>${pipeline.length} projects</small></div><div class="forecast-mark" aria-hidden="true">${segments}</div>
<ul class="projects">${projects || '<li class="empty">No expected income recorded.</li>'}</ul></section></div></div>
<div class="bottom"><section class="panel"><div class="panel-head"><h2>Coming up</h2></div><ol class="events">${events.map((event) => eventHtml(event, asOf)).join("")}</ol></section>
<section class="panel admin"><div class="panel-head"><h2>Open admin</h2><span class="count">${undated.length} undated</span></div><ul class="actions">${actions}</ul>${more}</section></div>
</main>`;
    patch(html);
  } catch (error) {
    patch(`<main><h1>Books unavailable</h1><p>Ledger data could not be read. No totals have been substituted.</p><p>${esc(error.message)}</p></main>`);
  }
}

let refreshing = false;

async function refresh() {
  if (refreshing) return;
  refreshing = true;
  try {
    const response = await fetch("/api/ledgers", { cache: "no-store" });
    if (!response.ok) throw new Error("Ledger read failed");
    sources = await response.json();
    render();
  } catch (error) {
    patch(`<main><h1>Books unavailable</h1><p>Ledger data could not be read. No totals have been substituted.</p><p>${esc(error.message)}</p></main>`);
  } finally {
    refreshing = false;
  }
}

installControls();
refresh();

if (import.meta.hot) {
  import.meta.hot.accept(() => refresh());
  import.meta.hot.on("ledger:update", () => refresh());
}
