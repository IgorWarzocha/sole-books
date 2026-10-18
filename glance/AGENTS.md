Update only changed cards/panels, not their shared grid or the whole page. Normalize the selected month and expanded admin state before DOM comparison; preserve focus and recover those choices after an error. Keep calculation changes separate from rendering work.

`update.js` owns DOM updates and month selection. `browser.mjs` tests it with synthetic markup. `app-browser.mjs` starts isolated Vite with synthetic ledgers and exercises real update events; neither test reads book records or needs an existing server.

Run these scripts with Node and installed Playwright/Vite packages. `PLAYWRIGHT_MODULE` and `VITE_MODULE` can name their module paths; `CHROMIUM_PATH` selects an installed Chromium. Do not add a runtime browser-test dependency to the dashboard.
