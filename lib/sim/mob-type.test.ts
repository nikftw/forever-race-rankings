import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  asMobType,
  dummyRacialNote,
  isMobType,
  mobTypeLabel,
} from "@/lib/sim/mob-type";

describe("patchwerk dummy types", () => {
  it("accepts wowsims creature types and defaults unknown strings to Demon", () => {
    assert.equal(isMobType("Beast"), true);
    assert.equal(isMobType("Elemental"), true);
    assert.equal(isMobType("demon"), false);
    assert.equal(asMobType("Beast"), "Beast");
    assert.equal(asMobType("not-a-type"), "Demon");
    assert.equal(mobTypeLabel("Unknown"), "None");
  });

  it("explains which type-gated racials are on", () => {
    assert.match(dummyRacialNote("Beast"), /Beast Slaying/);
    assert.match(dummyRacialNote("Elemental"), /Elemental Insight/);
    assert.match(dummyRacialNote("Demon"), /off on this Demon dummy/);
  });
});
