import test, { describe, it } from "node:test";
import assert from "node:assert";
import {
  buildPlan,
  defaultBrief,
  activatePlanB,
  buildRisks,
} from "../lib/engine";

describe("Plan Health Score & Risk Radar Module", () => {
  it("initializes top 5 event-specific risks with mitigations and Plan B labels", () => {
    const brief = defaultBrief();
    const risks = buildRisks(brief);

    assert.strictEqual(risks.length, 5);
    risks.forEach((risk) => {
      assert.strictEqual(typeof risk.id, "string");
      assert.strictEqual(typeof risk.title, "string");
      assert.strictEqual(typeof risk.mitigation, "string");
      assert.strictEqual(typeof risk.planBLabel, "string");
      assert.strictEqual(risk.activePlanB, false);
      assert.strictEqual(risk.probabilityPercent >= 0 && risk.probabilityPercent <= 100, true);
    });
  });

  it("activates Plan B on a specific risk and boosts the health score", () => {
    const plan = buildPlan(defaultBrief());
    const initialScore = plan.health.score;
    const targetRisk = plan.risks[0];

    assert.strictEqual(targetRisk.activePlanB, false);

    const updated = activatePlanB(plan, targetRisk.id);
    const updatedRisk = updated.risks.find((r) => r.id === targetRisk.id);

    assert.strictEqual(updatedRisk?.activePlanB, true);
    assert.strictEqual(updated.health.score >= initialScore, true);
  });

  it("toggles Plan B off on a second tap", () => {
    const plan = buildPlan(defaultBrief());
    const targetId = plan.risks[1].id;

    const activated = activatePlanB(plan, targetId);
    assert.strictEqual(activated.risks.find((r) => r.id === targetId)?.activePlanB, true);

    const deactivated = activatePlanB(activated, targetId);
    assert.strictEqual(deactivated.risks.find((r) => r.id === targetId)?.activePlanB, false);
  });
});
