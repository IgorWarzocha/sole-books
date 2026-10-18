// Apply ledger changes at panel boundaries without resetting local UI state.
export function selectMonth(root, month) {
  const button = [...root.querySelectorAll(".month")].find((item) => item.dataset.month === month);
  if (!button) return;
  root.querySelectorAll(".month").forEach((item) => {
    const selected = item === button;
    item.classList.toggle("selected", selected);
    item.setAttribute("aria-pressed", String(selected));
  });
  for (const field of ["month", "income", "cost", "credit", "uc"]) {
    const readout = root.querySelector(`#selected-${field}`);
    if (readout) readout.textContent = button.dataset[field];
  }
}

function focusTarget(root) {
  const node = root.ownerDocument.activeElement;
  if (!root.contains(node)) return null;
  let selector;
  if (node.id) selector = `#${CSS.escape(node.id)}`;
  else if (node.matches(".month")) selector = `.month[data-month="${CSS.escape(node.dataset.month)}"]`;
  else if (node.matches(".uc-toggle button")) selector = ".uc-toggle button";
  else if (node.matches(".admin summary")) selector = ".admin summary";
  return selector ? { node, selector } : null;
}

function replaceChanged(live, fresh) {
  if (!live || !fresh) throw new Error("Incomplete dashboard layout");
  if (!live.isEqualNode(fresh)) live.replaceWith(fresh);
}

function updateChildren(live, fresh) {
  if (!live || !fresh) throw new Error("Incomplete dashboard layout");
  const children = [...fresh.children];
  children.forEach((child, index) => {
    const current = live.children[index];
    if (!current) live.append(child);
    else replaceChanged(current, child);
  });
  while (live.children.length > children.length) live.lastElementChild.remove();
}

export function createDashboardUpdater(root) {
  let month = null, expanded = false, pendingFocus = null;
  return function patch(html) {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    const next = template.content.querySelector("main");
    if (!next) throw new Error("Missing dashboard content");
    const current = root.querySelector("main");
    const wasDashboard = Boolean(current?.querySelector(".board"));
    const isDashboard = Boolean(next.querySelector(".board"));
    if (wasDashboard) {
      month = current.querySelector(".month.selected")?.dataset.month ?? null;
      expanded = current.querySelector(".admin details")?.open ?? false;
    }
    const focus = focusTarget(root) ?? pendingFocus;
    // Normalize interaction state before comparison, so it isn't mistaken for
    // a ledger change. Readouts use the new values for the selected month.
    if (isDashboard) {
      selectMonth(next, month);
      const details = next.querySelector(".admin details");
      if (details) details.open = expanded;
    }
    if (!current || !wasDashboard || !isDashboard) {
      root.replaceChildren(next);
    } else {
      for (const selector of ["header", ".hero", ".board > .chart"]) {
        replaceChanged(current.querySelector(selector), next.querySelector(selector));
      }
      for (const selector of [".metrics", ".side", ".bottom"]) {
        updateChildren(current.querySelector(selector), next.querySelector(selector));
      }
      const oldEmpty = current.querySelector(":scope > .empty");
      const newEmpty = next.querySelector(":scope > .empty");
      if (oldEmpty && newEmpty) replaceChanged(oldEmpty, newEmpty);
      else if (oldEmpty) oldEmpty.remove();
      else if (newEmpty) current.insertBefore(newEmpty, current.querySelector(".metrics"));
    }
    if (isDashboard) {
      if (focus && root.ownerDocument.activeElement !== focus.node) {
        root.querySelector(focus.selector)?.focus({ preventScroll: true });
      }
      pendingFocus = null;
    } else {
      pendingFocus = focus;
    }
  };
}
