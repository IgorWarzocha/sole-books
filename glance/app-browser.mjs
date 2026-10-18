// Load the real client modules with synthetic ledgers; never read book records.
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const csv = (row) => `${Object.keys(row).join(",")}\n${Object.values(row).join(",")}\n`;
const sources = {
  "todo.md": "- [ ] First task\n- [ ] Second task\n- [ ] Third task\n- [ ] Fourth task\n",
  "trader.csv": csv({ trading_name: "Example books", time_zone: "Europe/London" }),
  "cashflow/projections.csv": "date,status,flow,description,amount_gbp,amount_usd\n",
  "cashflow/actuals.csv": "date,flow,status,amount_gbp,amount_usd\n",
  "cashflow/ongoing-costs.csv": "billing_day,amount_gbp,amount_usd,effective_from,description\n",
  "cashflow/cost-changes.csv": "effective_from,amount_gbp,amount_usd\n",
  "universal-credit/rates.csv": csv({ effective_from: "2026-04-06", taper_pence_per_pound: "55", work_allowance_gbp: "0", capital_deduction_gbp: "0", standard_allowance_gbp: "0", housing_element_gbp: "0" }),
  "universal-credit/assessment-periods.csv": csv({ period_start: "2026-05-10", period_end: "2026-06-09", report_deadline: "2026-06-10", expected_payment_date: "2026-06-16", payment_received_date: "2026-06-16", actual_paid_gbp: "10", calculation_mode: "manual", estimated_award_gbp: "10", notes: "Synthetic UI test paid on 2026-06-16" }),
};
for (const year of ["2026", "2026-27"]) {
  sources[`data/${year}/income.csv`] = csv({ received_date: "2026-05-01", amount_gbp: "100", amount_usd: "100", client: "Example", invoice_no: "", account: "Cash" });
  sources[`data/${year}/expenses.csv`] = "paid_date,claimable_gbp,claimable_usd,category\n";
  sources[`data/${year}/documents.csv`] = "date,type,number,amount_gbp,amount_usd,status\n";
  sources[`data/${year}/sales-tax.csv`] = "date,type,invoice_no,amount_usd\n";
}

const { createServer } = await import(process.env.VITE_MODULE || "vite");
const cache = await mkdtemp(join(tmpdir(), "books-browser-"));
let status = 200;
const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL(".", import.meta.url)),
  cacheDir: cache,
  logLevel: "error",
  server: { host: "127.0.0.1", port: 0 },
  plugins: [{ name: "synthetic-ledgers", configureServer(server) {
    server.middlewares.use("/api/ledgers", (_request, response) => {
      response.statusCode = status;
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(sources));
    });
  } }],
});
await server.listen();
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install({ time: new Date("2026-10-18T12:00:00Z") });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForSelector(".month");
  assert.equal(await page.locator(".metric").count(), 3);
  await page.locator('.month[data-month="May"]').click();
  assert.equal(await page.locator("#selected-month").innerText(), "May");
  await page.locator(".admin summary").click();
  if (await page.locator(".uc-toggle button").count()) {
    const wasPressed = await page.locator(".uc-toggle button").getAttribute("aria-pressed");
    await page.evaluate(() => { window.kept = [document.querySelector(".admin"), document.querySelector(".side"), document.querySelector(".metrics")]; });
    await page.locator(".uc-toggle button").click();
    assert.equal(await page.locator(".uc-toggle button").getAttribute("aria-pressed"), String(wasPressed !== "true"));
    assert.equal(await page.locator("#selected-month").innerText(), "May");
    assert.equal(await page.locator(".admin details").evaluate((node) => node.open), true);
    assert.equal(await page.locator(".uc-toggle button").evaluate((node) => node === document.activeElement), true);
    assert.equal(await page.evaluate(() => window.kept[0] === document.querySelector(".admin") && window.kept[1] === document.querySelector(".side") && window.kept[2] === document.querySelector(".metrics")), true);
  }
  await page.locator(".admin summary").focus();
  await page.evaluate(() => { window.kept = [document.querySelector(".metrics"), document.querySelector(".side > .panel"), document.querySelector(".admin"), document.querySelector(".bottom > .panel")]; });
  for (const year of ["2026", "2026-27"]) sources[`data/${year}/income.csv`] = sources[`data/${year}/income.csv`].replaceAll("100", "125");
  server.ws.send({ type: "custom", event: "ledger:update" });
  await page.waitForFunction(() => document.querySelector("#selected-income")?.textContent.includes("125"));
  assert.equal(await page.evaluate(() => window.kept[0] === document.querySelector(".metrics") && window.kept[1] === document.querySelector(".side > .panel") && window.kept[2] === document.querySelector(".admin") && window.kept[3] === document.querySelector(".bottom > .panel")), true);
  assert.equal(await page.locator(".admin details").evaluate((node) => node.open), true);
  assert.equal(await page.evaluate(() => document.activeElement.tagName), "SUMMARY");
  status = 503;
  server.ws.send({ type: "custom", event: "ledger:update" });
  await page.waitForFunction(() => document.querySelector("h1")?.textContent === "Books unavailable");
  status = 200;
  server.ws.send({ type: "custom", event: "ledger:update" });
  await page.waitForSelector(".month");
  assert.equal(await page.locator("#selected-month").innerText(), "May");
  assert.equal(await page.locator(".admin details").evaluate((node) => node.open), true);
  assert.equal(await page.evaluate(() => document.activeElement.tagName), "SUMMARY");
  assert.deepEqual(errors, []);
  console.log("Client checks passed: Vite ledger events, independent panels, month/admin/focus, UC toggle where present and error recovery.");
} finally {
  await browser.close();
  await server.close();
  await rm(cache, { recursive: true, force: true });
}
