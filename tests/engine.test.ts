import test, { describe, it } from "node:test";
import assert from "node:assert";
import {
  allocate,
  buildPlan,
  buildBudget,
  buildDiff,
  defaultBrief,
  rankTradeoffs,
  updateBudgetAmount,
} from "../lib/engine";

describe("Planning Engine — Living Plan & Replanning", () => {
  it("guarantees budget allocation percentages sum exactly to the total", () => {
    const total = 600000;
    const percentages = [24, 29, 12, 10, 7, 5, 4, 9];
    const amounts = allocate(total, percentages);
    const sum = amounts.reduce((a, b) => a + b, 0);
    assert.strictEqual(sum, total);
  });

  it("builds a baseline plan with all required domain structures", () => {
    const brief = defaultBrief();
    const plan = buildPlan(brief);

    assert.strictEqual(plan.brief.guests, 80);
    assert.strictEqual(plan.budget.totalInr, 600000);
    assert.strictEqual(plan.budget.lines.length, 8);
    assert.strictEqual(plan.timeline.milestones.length > 5, true);
    assert.strictEqual(plan.vendors.length > 4, true);
    assert.strictEqual(plan.health.score >= 60, true);
    assert.strictEqual(plan.critic.pass, true);
  });

  it("rebalances instantly when guests increase from 80 to 120", () => {
    const baseBrief = defaultBrief();
    const basePlan = buildPlan(baseBrief);

    const scaledBrief = { ...baseBrief, guests: 120 };
    const scaledPlan = buildPlan(scaledBrief, basePlan);

    const diff = buildDiff(basePlan, scaledPlan, "80 to 120 guests");

    // Catering should increase to feed 40 additional guests
    const baseCatering = basePlan.budget.lines.find((l) => l.id === "catering")?.amountInr ?? 0;
    const scaledCatering = scaledPlan.budget.lines.find((l) => l.id === "catering")?.amountInr ?? 0;
    assert.strictEqual(scaledCatering > baseCatering, true);

    // Decor absorbs catering pressure
    const baseDecor = basePlan.budget.lines.find((l) => l.id === "decor")?.amountInr ?? 0;
    const scaledDecor = scaledPlan.budget.lines.find((l) => l.id === "decor")?.amountInr ?? 0;
    assert.strictEqual(scaledDecor <= baseDecor, true);

    // Net budget invariant: total stays ₹600,000
    assert.strictEqual(scaledPlan.budget.totalInr, 600000);
    assert.strictEqual(diff.deltas.length > 0, true);
  });

  it("ranks top 3 trade-offs with positive savings", () => {
    const plan = buildPlan(defaultBrief());
    const tradeoffs = rankTradeoffs(plan);

    assert.strictEqual(tradeoffs.length, 3);
    assert.strictEqual(tradeoffs[0].rank, 1);
    assert.strictEqual(tradeoffs[1].rank, 2);
    assert.strictEqual(tradeoffs[2].rank, 3);
    assert.strictEqual(tradeoffs[0].savingInr >= tradeoffs[1].savingInr, true);
    assert.strictEqual(tradeoffs[1].savingInr >= tradeoffs[2].savingInr, true);
  });

  it("absorbs manual budget edits from contingency first", () => {
    const plan = buildPlan(defaultBrief());
    const initialVenue = plan.budget.lines.find((l) => l.id === "venue")?.amountInr ?? 0;
    const initialContingency = plan.budget.lines.find((l) => l.id === "contingency")?.amountInr ?? 0;

    // Increase venue by ₹20,000
    const updated = updateBudgetAmount(plan, "venue", initialVenue + 20000);
    const newVenue = updated.budget.lines.find((l) => l.id === "venue")?.amountInr ?? 0;
    const newContingency = updated.budget.lines.find((l) => l.id === "contingency")?.amountInr ?? 0;

    assert.strictEqual(newVenue, initialVenue + 20000);
    assert.strictEqual(newContingency < initialContingency, true);
    assert.strictEqual(updated.budget.totalInr, plan.budget.totalInr);
  });
});
