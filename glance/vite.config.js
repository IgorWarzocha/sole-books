import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("..", import.meta.url));

function ledgerLive() {
  const relevant = (file) => {
    const rel = path.relative(repo, file);
    return (
      (rel.startsWith(`data${path.sep}`) && rel.endsWith(".csv"))
      || (rel.startsWith(`cashflow${path.sep}`) && rel.endsWith(".csv"))
      || rel === "todo.md"
      || rel === path.join("universal-credit", "assessment-periods.csv")
      || rel === path.join("universal-credit", "rates.csv")
      || rel === "trader.csv"
    );
  };
  const snapshot = () => {
    const files = {};
    const dataDir = path.join(repo, "data");
    if (fs.existsSync(dataDir)) {
      for (const year of fs.readdirSync(dataDir)) {
        if (!/^\d{4}-\d{2}$/.test(year)) continue;
        for (const name of ["income", "expenses", "documents"]) {
          const file = path.join(dataDir, year, `${name}.csv`);
          if (fs.existsSync(file)) files[`data/${year}/${name}.csv`] = fs.readFileSync(file, "utf8");
        }
      }
    }
    for (const name of ["projections", "actuals", "ongoing-costs", "cost-changes"]) {
      files[`cashflow/${name}.csv`] = fs.readFileSync(path.join(repo, "cashflow", `${name}.csv`), "utf8");
    }
    files["universal-credit/assessment-periods.csv"] = fs.readFileSync(
      path.join(repo, "universal-credit", "assessment-periods.csv"),
      "utf8",
    );
    files["universal-credit/rates.csv"] = fs.readFileSync(
      path.join(repo, "universal-credit", "rates.csv"),
      "utf8",
    );
    const trader = path.join(repo, "trader.csv");
    files["trader.csv"] = fs.existsSync(trader) ? fs.readFileSync(trader, "utf8") : "";
    files["todo.md"] = fs.readFileSync(path.join(repo, "todo.md"), "utf8");
    return files;
  };
  return {
    name: "ledger-live",
    configureServer(server) {
      server.watcher.add([
        path.join(repo, "data"),
        path.join(repo, "cashflow"),
        path.join(repo, "todo.md"),
        path.join(repo, "universal-credit", "assessment-periods.csv"),
        path.join(repo, "universal-credit", "rates.csv"),
        path.join(repo, "trader.csv"),
      ]);
      let timer;
      const notify = (file) => {
        if (!relevant(file)) return;
        clearTimeout(timer);
        timer = setTimeout(() => server.ws.send({ type: "custom", event: "ledger:update" }), 40);
      };
      server.watcher.on("change", notify);
      server.watcher.on("add", notify);
      server.middlewares.use("/api/ledgers", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "no-store");
        res.end(JSON.stringify(snapshot()));
      });
    },
  };
}

export default defineConfig({
  plugins: [ledgerLive()],
  server: {
    host: "0.0.0.0",
    port: 8765,
    strictPort: true,
    fs: { allow: [repo] },
  },
});
