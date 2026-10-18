import "./style.css";
import { createDashboardUpdater, selectMonth } from "./update.js";
import { parseCsv } from "./csv.js";
import { cents, usd, today, calendarYear, monthStart, addMonth, dayCount, expandOngoing, invoiceSummary, forecastRows } from "./calendar.js";

let sources = {};
const patch = createDashboardUpdater(document.querySelector("#app"));

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


function monthName(iso) {
  return MONTHS[Number(iso.slice(5, 7)) - 1];
}

function fullMonth(iso) {
  return new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

function shortLabel(text) {
  const low = text.toLowerCase();
  const labels = [
    [["tax estimate"], "Refresh tax estimate"],
    [["reconcile"], "Reconcile records"],
    [["make summary", "ledger summary"], "Run ledger summary"],
    [["prepare the return"], "Prepare tax return"],
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
    return { ...row, when: row[dateField] || null, amount: cents(row[amountField]) };
  });
}

function load(asOf, year) {
  const income = rowsOf(
    fileText(`/${year}/income.csv`),
    ["received_date", "amount_usd", "client", "invoice_no", "account"],
    "received_date",
    "amount_usd",
  ).filter((row) => {
    if (!row.when) throw new Error("income.csv: missing date");
    return row.when <= asOf;
  });
  const expenses = rowsOf(
    fileText(`/${year}/expenses.csv`),
    ["paid_date", "claimable_usd", "category"],
    "paid_date",
    "claimable_usd",
  ).filter((row) => {
    if (!row.when) throw new Error("expenses.csv: missing date");
    return row.when <= asOf;
  });
  const documentRows = rowsOf(
    fileText(`/${year}/documents.csv`),
    ["date", "type", "number", "amount_usd", "status"],
    "date",
    "amount_usd",
  );
  for (const row of documentRows) {
    if (!row.when) throw new Error("documents.csv: missing date");
  }
  const documents = documentRows.filter((row) => row.when <= asOf);
  const drafts = documentRows.filter((row) => row.type.toLowerCase() === "invoice" && row.status.toLowerCase() === "draft");
  const projections = rowsOf(
    fileText("/projections.csv"),
    ["date", "status", "flow", "description", "amount_usd"],
    "date",
    "amount_usd",
  ).filter((row) => FORECASTS.has(row.status.toLowerCase()));
  const financing = rowsOf(
    fileText("/actuals.csv"),
    ["date", "flow", "status", "amount_usd"],
    "date",
    "amount_usd",
  ).filter((row) => row.when && row.when <= asOf && row.flow.toLowerCase() === "financing" && row.status.toLowerCase() === "actual")
    .map((row) => ({ ...row, amount: Math.abs(row.amount) }));
  const salesTax = rowsOf(fileText(`/${year}/sales-tax.csv`), ["date", "type", "invoice_no", "amount_usd"], "date", "amount_usd").filter((row) => row.when && row.when <= asOf);
  return { income, expenses, documents, drafts, projections, financing, salesTax };
}

function tradingName() {
  const row = parseCsv(sources["trader.csv"] || "")[0];
  const name = (row?.trading_name || "").trim();
  if (!name || name.toLowerCase() === "your trading name") return "Your books";
  return name;
}

function openTasks() {
  return (sources["todo.md"] || "").split("\n").flatMap((line) => {
    const match = line.trim().match(/^- \[ \] (.+)$/);
    return match ? [match[1]] : [];
  });
}

function comingUp(tasks, projections, asOf) {
  const events = [];
  const undated = [];
  for (const text of tasks) {
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

function sumMonth(rows, month) {
  return rows.filter((row) => monthStart(row.when) === month).reduce((sum, row) => sum + row.amount, 0);
}


function chart(income, expenses, financing, projections, asOf, year) {
  const startYear = Number(year.slice(0, 4));
  let cursor = `${startYear}-01-01`;
  const current = monthStart(asOf);
  const end = `${startYear}-12-01`;
  const dated = projections.filter((row) => row.when && monthStart(row.when) <= end);
  let horizon = dated.reduce((latest, row) => {
    const month = monthStart(row.when);
    return month > latest ? month : latest;
  }, current);
  const ghostOf = (flow, month) => projections
    .filter((row) => row.when && monthStart(row.when) === month && row.flow.toLowerCase() === flow)
    .reduce((sum, row) => sum + Math.abs(row.amount), 0);
  const months = [];
  while (cursor <= horizon && cursor <= end) {
    months.push([
      cursor,
      sumMonth(income, cursor),
      sumMonth(expenses, cursor),
      sumMonth(financing, cursor),
      ghostOf("income", cursor),
      ghostOf("expense", cursor),
      ghostOf("financing", cursor),
    ]);
    cursor = addMonth(cursor);
  }
  if (!months.length) return '<p class="empty">No months in this calendar year yet.</p>';
  const peak = Math.max(...months.map(([, incoming, outgoing, credit, ghostIn, ghostCost, ghostCredit]) => Math.max(
    incoming + ghostIn,
    outgoing + ghostCost,
    credit + ghostCredit,
  ))) || 1;
  const scale = Math.round(peak * 1.12);
  const height = (amount) => `${(amount / scale) * 100}%`;
  const stack = (base, actual, ghost) => {
    const solid = actual ? `<i class="${base}" style="height:${height(actual)}"></i>` : "";
    const pale = ghost ? `<i class="${base} ghost" style="height:${height(ghost)}"></i>` : "";
    return `<span class="stack">${solid}${pale}</span>`;
  };
  const bars = months.map(([when, incoming, outgoing, credit, ghostIn, ghostCost, ghostCredit]) => {
    const name = monthName(when);
    const selected = monthStart(when) === current;
    const shownIn = incoming || ghostIn;
    const shownCost = outgoing || ghostCost;
    const shownCredit = credit || ghostCredit;
    const label = `${name}: received ${usd(shownIn)}, operating costs ${usd(shownCost)}, credit payments ${usd(shownCredit)}`;
    return `<button class="month${selected ? " selected" : ""}" type="button" aria-pressed="${selected}" aria-label="${esc(label)}" data-month="${name}" data-income="${usd(shownIn)}" data-cost="${usd(shownCost)}" data-credit="${usd(shownCredit)}"><span class="bar-pair" aria-hidden="true">${stack("income-bar", incoming, ghostIn)}${stack("cost-bar", outgoing, ghostCost)}${stack("credit-bar", credit, ghostCredit)}</span><span>${name}</span></button>`;
  });
  const currentMonth = months.find(([when]) => monthStart(when) === current) || months.at(-1);
  const [, incoming, outgoing, credit, ghostIn, ghostCost, ghostCredit] = currentMonth;
  return `<div class="plot"><div class="axis" aria-hidden="true"><span>${usd(scale, true)}</span><span>${usd(Math.round(scale / 2), true)}</span><span>$0</span></div><div class="months">${bars.join("")}</div></div><div class="chart-readout" aria-live="polite"><strong id="selected-month">${monthName(currentMonth[0])}</strong><span><i class="dot green"></i><span id="selected-income">${usd(incoming || ghostIn)}</span></span><span><i class="dot coral"></i><span id="selected-cost">${usd(outgoing || ghostCost)}</span></span><span><i class="dot"></i><span id="selected-credit">${usd(credit || ghostCredit)}</span></span></div>`;
}

function eventHtml(event, asOf) {
  const days = dayCount(asOf, event.when);
  const due = days === 0 ? "Today" : `${Math.abs(days)}d ${days < 0 ? "past" : "away"}`;
  const value = event.amount == null
    ? (/^\d{1,2}:\d{2}$/.test(event.note) ? event.note : "Due")
    : `${event.amount > 0 ? "+" : "−"}${usd(Math.abs(event.amount), true)}`;
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
    const button = event.target.closest(".month");
    if (!button) return;
    selectMonth(app, button.dataset.month);
  });
}

function render() {
  const app = document.querySelector("#app");
  try {
    const trader = parseCsv(sources["trader.csv"] || "")[0];
    const timeZone = trader?.time_zone?.trim() || "UTC";
    const asOf = today(new Date(), timeZone);
    const year = calendarYear(asOf);
    const { income, expenses, documents, drafts, projections, financing, salesTax } = load(asOf, year);
    const forecast = forecastRows(projections, asOf, year).concat(expandOngoing(parseCsv(fileText("/ongoing-costs.csv")), asOf, year));
    const cash = income.filter((row) => !NONCASH.some((term) => row.account.toLowerCase().includes(term)));
    const receivedCash = cash.reduce((sum, row) => sum + row.amount, 0);
    const received = receivedCash;
    const costs = expenses.reduce((sum, row) => sum + row.amount, 0);
    const { invoices, paid, outstanding } = invoiceSummary(documents, income, salesTax);
    const invoiceTotal = invoices.reduce((sum, row) => sum + row.amount, 0);
    const pipeline = projections.filter((row) => row.flow.toLowerCase() === "income" && row.status.toLowerCase() !== "issued");
    const expected = pipeline.reduce((sum, row) => sum + row.amount, 0);
    const [events, undated] = comingUp(openTasks(), forecast, asOf);
    const priorities = [ "Refresh tax estimate", "Reconcile records"];
    undated.sort((a, b) => (priorities.includes(a) ? priorities.indexOf(a) : priorities.length) - (priorities.includes(b) ? priorities.indexOf(b) : priorities.length));
    const thisMonthCash = cash.filter((row) => monthStart(row.when) === monthStart(asOf)).reduce((sum, row) => sum + row.amount, 0);
    const thisMonth = thisMonthCash;
    const ratio = invoices.length ? (paid / invoices.length) * 100 : 0;
    const projects = pipeline.map((row) => `<li class="project"><span>${esc(shortLabel(row.description))}</span><strong>${usd(row.amount, true)}</strong></li>`).join("");
    const segments = pipeline.map((row) => `<i style="flex:${Math.max(row.amount, 0)}"></i>`).join("");
    const actions = undated.slice(0, 3).map((label) => `<li>${esc(label)}</li>`).join("") || "<li>No undated tasks.</li>";
    const more = undated.length > 3
      ? `<details><summary>${undated.length - 3} more admin items</summary><ul class="actions">${undated.slice(3).map((label) => `<li>${esc(label)}</li>`).join("")}</ul></details>`
      : "";
    const sparkRows = cash;
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
<header><div><h1>${esc(name)} <span>/ books</span></h1><small>Calendar year ${esc(year)} · USD · ${esc(timeZone)}</small></div>
</header>
<section class="hero" aria-label="Cash received"><div><h2>Money received</h2><p class="total">${usd(received)}</p></div>
<div class="hero-side"><small>${fullMonth(asOf)} so far</small><strong>${usd(thisMonth, true)}</strong>${sparkline(sparkRows)}</div></section>
${emptyNote}
<section class="metrics" aria-label="Key figures"><article class="metric"><h2>Unpaid invoices</h2><strong>${usd(outstanding, true)}</strong><small>${!invoices.length ? "Nothing issued" : outstanding === 0 ? "All settled" : "Still to collect"}</small></article>
<article class="metric pipeline"><h2>Expected income</h2><strong>${usd(expected, true)}</strong><small>${esc(expectedCaption(pipeline))}</small></article>
<article class="metric costs" title="${usd(costs)}"><h2>Operating costs</h2><strong>${usd(costs, true)}</strong><small>${esc(year)} to date</small></article></section>
<div class="board"><section class="panel chart"><div class="panel-head"><h2>Income & operating costs</h2><small>${esc(year)}</small></div>
<div class="legend"><span><i class="dot green"></i>Cash received</span><span><i class="dot coral"></i>Business costs</span><span><i class="dot"></i>Credit payments</span><span><i class="dot ghost"></i>Projected</span></div>
${chart(cash, expenses, financing, forecast, asOf, year)}</section>
<div class="side"><section class="panel"><div class="panel-head"><h2>Invoices</h2></div>
<div class="settlement"><div class="ring" style="--progress:${ratio.toFixed(1)}%" role="img" aria-label="${paid} of ${invoices.length} invoices settled"><strong>${paid}<span style="font-size:12px;color:var(--muted)">/${invoices.length}</span></strong></div>
<div class="settlement-copy"><strong>${usd(invoiceTotal, true)} invoiced</strong><small>${usd(outstanding, true)} left to collect</small>${draftNote}</div></div></section>
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
