import test, { describe, it } from "node:test";
import assert from "node:assert";
import {
  briefFromPrompt,
  buildEInvite,
  defaultBrief,
} from "../lib/engine";

describe("Multilingual Engine — Indian Languages & Imagen E-Invites", () => {
  it("extracts parameters accurately from Telugu voice prompt", () => {
    const telugu = "మా అన్నయ్య నిశ్చితార్థం, 80 మంది అతిథులు, ₹6 లక్షల బడ్జెట్, హైదరాబాద్, 8 వారాల్లో, శాకాహారం";
    const brief = briefFromPrompt(telugu);

    assert.strictEqual(brief.eventType, "engagement");
    assert.strictEqual(brief.guests, 80);
    assert.strictEqual(brief.budgetInr, 600000);
    assert.strictEqual(brief.city, "Hyderabad");
    assert.strictEqual(brief.constraints.includes("Pure vegetarian"), true);
  });

  it("extracts parameters accurately from Hindi voice prompt", () => {
    const hindi = "मेरे भाई की सगाई, 120 मेहमान, ₹8 लाख बजट, हैदराबाद, शुद्ध शाकाहारी";
    const brief = briefFromPrompt(hindi);

    assert.strictEqual(brief.eventType, "engagement");
    assert.strictEqual(brief.guests, 120);
    assert.strictEqual(brief.budgetInr, 800000);
    assert.strictEqual(brief.constraints.includes("Pure vegetarian"), true);
  });

  it("generates culturally authentic e-invites across 5 Indian languages", () => {
    const brief = defaultBrief();

    const teInvite = buildEInvite(brief, "te");
    assert.strictEqual(teInvite.language, "te");
    assert.strictEqual(teInvite.blessingText.includes("శ్రీ రస్తు"), true);

    const hiInvite = buildEInvite(brief, "hi");
    assert.strictEqual(hiInvite.language, "hi");
    assert.strictEqual(hiInvite.blessingText.includes("श्री गणेशाय नमः"), true);

    const enInvite = buildEInvite(brief, "en");
    assert.strictEqual(enInvite.language, "en");
    assert.strictEqual(enInvite.invitationText.includes("invite you to celebrate"), true);

    const taInvite = buildEInvite(brief, "ta");
    assert.strictEqual(taInvite.language, "ta");
    assert.strictEqual(taInvite.blessingText.includes("கணேசாய"), true);

    const knInvite = buildEInvite(brief, "kn");
    assert.strictEqual(knInvite.language, "kn");
    assert.strictEqual(knInvite.blessingText.includes("ಗಣೇಶಾಯ"), true);
  });
});
