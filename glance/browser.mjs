// Optional Playwright regressions. All markup is synthetic; no ledgers are read.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const source = await readFile(new URL("./update.js", import.meta.url), "utf8");
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

function dashboard({ income = "100", costTitle = "20", invoices = "50", admin = "Review", empty = false, uc = true } = {}) {
  const month = (name, value, selected) => `<button class="month${selected ? " selected" : ""}" data-month="${name}" data-income="${value}" data-cost="20" data-credit="0" data-uc="10" aria-pressed="${selected}">${name}</button>`;
  return `<main>
    <header><h1>Example books</h1><label class="uc-toggle"><button aria-pressed="${uc}">UC</button></label></header>
    <section class="hero">Money received</section>
    ${empty ? '<p class="empty">Nothing recorded yet.</p>' : ""}
    <section class="metrics"><article class="metric">Unpaid</article><article class="metric pipeline">Expected</article><article class="metric costs" title="${costTitle}">20</article></section>
    <div class="board"><section class="panel chart">${month("Apr", income, false)}${month("May", "200", true)}
      <div><span id="selected-month">May</span><span id="selected-income">200</span><span id="selected-cost">20</span><span id="selected-credit">0</span><span id="selected-uc">10</span></div></section>
      <div class="side"><section class="panel">Invoices ${invoices}</section><section class="panel">Pipeline</section></div></div>
    <div class="bottom"><section class="panel">Coming up</section><section class="panel admin"><h2>Admin</h2><details><summary>More</summary><ul><li>${admin}</li></ul></details></section></div>
  </main>`;
}

try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("http://books.test/**", (route) => {
    if (route.request().url().endsWith("/update.js")) return route.fulfill({ contentType: "text/javascript", body: source });
    return route.fulfill({ contentType: "text/html", body: `<div id="app"></div><script type="module">
      import {createDashboardUpdater,selectMonth} from '/update.js';
      const app=document.querySelector('#app');
      window.patch=createDashboardUpdater(app);
      app.addEventListener('click', event => {const button=event.target.closest('.month');if(button)selectMonth(app,button.dataset.month);});
    </script>` });
  });
  await page.goto("http://books.test/");
  await page.waitForFunction(() => typeof window.patch === "function");
  const patch = (html) => page.evaluate((html) => window.patch(html), html);
  const remember = (selectors) => page.evaluate((selectors) => {
    window.kept = Object.fromEntries(selectors.map((selector) => [selector, document.querySelector(selector)]));
    if (Object.values(window.kept).some((node) => !node)) throw new Error("Missing test element");
  }, selectors);
  async function unchanged() {
    assert.deepEqual(await page.evaluate(() => Object.entries(window.kept)
      .filter(([selector, node]) => node !== document.querySelector(selector)).map(([selector]) => selector)), []);
  }

  await patch(dashboard());
  await page.locator('.month[data-month="Apr"]').click();
  await page.locator("summary").click();
  await remember(["main", "header", ".hero", ".metrics", ".metric", ".board", ".chart", ".side", ".side > section", ".bottom", ".admin", "summary"]);
  await patch(dashboard());
  await unchanged();
  assert.equal(await page.locator("details").evaluate((node) => node.open), true);
  assert.equal(await page.locator("#selected-month").innerText(), "Apr");
  assert.equal(await page.locator("#selected-income").innerText(), "100");

  // Outer attributes count as changes; other metrics and all panels stay put.
  await remember(["main", "header", ".metric:first-child", ".metric.pipeline", ".chart", ".side > section", ".bottom"]);
  await patch(dashboard({ costTitle: "25" }));
  await unchanged();
  assert.equal(await page.locator(".metric.costs").getAttribute("title"), "25");
  assert.equal(await page.locator(".metric").count(), 3);

  await remember([".chart", ".side > section:nth-child(2)", ".bottom", "summary"]);
  await patch(dashboard({ costTitle: "25", invoices: "75" }));
  await unchanged();
  assert.match(await page.locator(".side > section:first-child").innerText(), /75/);

  await page.locator('.month[data-month="Apr"]').focus();
  await remember([".hero", ".side > section", ".bottom"]);
  await patch(dashboard({ costTitle: "25", invoices: "75", income: "150" }));
  await unchanged();
  assert.equal(await page.locator("#selected-income").innerText(), "150");
  assert.equal(await page.evaluate(() => document.activeElement.dataset.month), "Apr");

  await page.locator("summary").focus();
  const updated = { costTitle: "25", invoices: "75", income: "150", admin: "Reconcile" };
  await remember([".chart", ".bottom > section:first-child", ".side > section"]);
  await patch(dashboard(updated));
  await unchanged();
  assert.equal(await page.locator("details").evaluate((node) => node.open), true);
  assert.equal(await page.evaluate(() => document.activeElement.tagName), "SUMMARY");

  await patch("<main><h1>Books unavailable</h1></main>");
  await patch("<main><h1>Books unavailable</h1></main>");
  await patch(dashboard(updated));
  assert.equal(await page.locator("details").evaluate((node) => node.open), true);
  assert.equal(await page.locator("#selected-month").innerText(), "Apr");
  assert.equal(await page.evaluate(() => document.activeElement.tagName), "SUMMARY");

  await page.locator(".uc-toggle button").focus();
  await patch(dashboard({ ...updated, uc: false }));
  assert.equal(await page.locator(".uc-toggle button").evaluate((node) => node === document.activeElement), true);
  assert.equal(await page.locator(".uc-toggle button").getAttribute("aria-pressed"), "false");
  await remember(["main", ".chart", ".side", ".bottom"]);
  await patch(dashboard({ ...updated, uc: false, empty: true }));
  assert.equal(await page.locator("main > .empty").count(), 1);
  await patch(dashboard({ ...updated, uc: false }));
  assert.equal(await page.locator("main > .empty").count(), 0);
  await unchanged();
  await assert.rejects(patch("<p>Missing main</p>"), /Missing dashboard content/);
  assert.deepEqual(errors, []);
  console.log("Dashboard browser checks passed: independent panels, changed attributes, month/readouts, focus, details and error recovery.");
} finally {
  await browser.close();
}
