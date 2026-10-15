// UC inputs are reconciled by assessment period, never inferred from tax rows.
export function money(value, label) {
  if (!/^-?\d+(\.\d{1,2})?$/.test(String(value ?? "").trim())) throw new Error(`UC: missing or invalid ${label}`);
  const amount = Math.round(Number(value) * 100);
  if (!Number.isSafeInteger(amount)) throw new Error(`UC: invalid ${label}`);
  return amount;
}

function date(value, label) {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "") || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`UC: invalid ${label}`);
  }
  return value;
}

export function calculatePeriods(periods, rates) {
  let carriedLoss = null;
  let previousEnd = null;
  return [...periods].sort((a, b) => a.period_start.localeCompare(b.period_start)).map((row) => {
    const start = date(row.period_start, "period start");
    const end = date(row.period_end, "period end");
    if (!(row.notes || "").trim()) throw new Error("UC: period needs reconciliation evidence or forecast assumptions in notes");
    if (end < start || (previousEnd && start <= previousEnd)) throw new Error("UC: overlapping or reversed periods");
    const nextStart = previousEnd && new Date(Date.parse(`${previousEnd}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
    const contiguous = start === nextStart;
    previousEnd = end;
    if (row.report_deadline) date(row.report_deadline, "report deadline");
    if (row.expected_payment_date) date(row.expected_payment_date, "expected payment date");
    if ((row.actual_paid_gbp || "").trim()) {
      date(row.payment_received_date, "payment received date");
      if (money(row.actual_paid_gbp, "actual payment") < 0) throw new Error("UC: negative payment");
    }
    if (row.calculation_mode === "manual") {
      if (!(row.notes || "").trim()) throw new Error("UC: manual estimate needs evidence or assumptions in notes");
      const award = money(row.estimated_award_gbp, "manual estimate");
      if (award < 0) throw new Error("UC: negative estimate");
      carriedLoss = null;
      return { ...row, award, loss: null, deduction: null, net: null };
    }
    if (row.calculation_mode !== "calculate") throw new Error("UC: choose calculate or manual mode");
    if (row.forecast_scope !== "single_self_employment") throw new Error("UC: household or surplus-earnings cases need manual mode");
    const nonnegative = (field) => {
      const amount = money(row[field], field);
      if (amount < 0) throw new Error(`UC: negative ${field}`);
      return amount;
    };
    const income = nonnegative("income_gbp");
    const expenses = nonnegative("expenses_gbp");
    const mif = nonnegative("minimum_income_floor_gbp");
    const opening = nonnegative("loss_brought_forward_gbp");
    if (mif > 0 && (opening > 0 || expenses > income)) throw new Error("UC: MIF with losses needs manual mode and DWP loss treatment");
    if (contiguous && carriedLoss !== null && opening !== carriedLoss) throw new Error("UC: loss brought forward does not match preceding period");
    const eligibleRates = rates.filter((rate) => date(rate.effective_from, "rate effective date") <= start)
      .sort((a, b) => a.effective_from.localeCompare(b.effective_from));
    const rate = eligibleRates.at(-1);
    if (!rate) throw new Error("UC: no rates effective for assessment period");
    const taper = Number(rate.taper_pence_per_pound);
    if (!Number.isInteger(taper) || taper <= 0 || taper > 100) throw new Error("UC: invalid taper");
    const allowance = money(rate.work_allowance_gbp, "work allowance");
    const capital = money(rate.capital_deduction_gbp, "capital deduction");
    const entitlement = nonnegative("gross_entitlement_gbp");
    const other = nonnegative("other_deductions_gbp");
    if (allowance < 0 || capital < 0) throw new Error("UC: negative allowance or capital deduction");
    const afterLoss = income - expenses - opening;
    carriedLoss = Math.max(0, -afterLoss);
    const net = Math.max(mif, afterLoss, 0);
    const counted = Math.max(0, net - allowance);
    // Surplus rules depend on claimant circumstances. Do not silently lose them.
    if (counted * taper >= Math.max(0, entitlement - capital - other) * 100 + 250000 * taper) {
      throw new Error("UC: possible surplus earnings, use manual mode with DWP earnings and loss figures");
    }
    const deduction = Math.floor((counted * taper + 50) / 100);
    const award = Math.max(0, entitlement - deduction - capital - other);
    return { ...row, award, loss: carriedLoss, deduction, net };
  });
}

export function paymentRows(periods, asOf, actual, { from = "", to = "9999-12-31" } = {}) {
  return periods.flatMap((row) => {
    const paid = (row.actual_paid_gbp || "").trim() !== "";
    if (actual !== paid) return [];
    const when = actual ? row.payment_received_date : row.expected_payment_date;
    if (!when || (actual ? when > asOf : when < asOf)) return [];
    if (when < from || when > to) return [];
    return [{ when, amount: actual ? money(row.actual_paid_gbp, "actual payment") : row.award }];
  });
}
