import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SPECS } from "@/lib/data/specs";
import {
  allSpecsHaveSimUiPath,
  parsePastedSimLink,
  simUiPathForSpec,
} from "@/lib/sim/forever-link";

const furyLink =
  "https://elliotwood.github.io/Forever/forever/warrior/dps/#eJzjYuNgcmBKYHTikmAMYIpgzGD0YBRikOpm52ILyEmsTC0SYFbg1CriYhN4kCTxiJuLWWBzBZD4nwIUmZMhcZENSJ+LlnjMB6RvZEjcBdHXSyXmswMVtecCOddKQdrYBGYUSfSzc7EIbOxiBEqtSgMSvblAYnkMUPJZusQbPi52gY2TGEEMZoG3SUbSAkwSjBqMBowZLAUcMxgZVzCy7GBkPMDI+ICR0eofC9cDJoZRQFMgNGM0iHGAV0wMTiwcjBJMXtLGBsYGpkaGxrqmpgamBoYGhiAKSBuYGgYwRrAkMWQB03HBCcaT0MDkcLgIZVk63GBi/AnlmDg0MkNYAg6zGBlWMXFKsTv8YpRgtGBWOsDMCZGKcxCEMPQcJGfNBIGT9pYQkQv2imlgcM3eaAIzx40mXiEOn9Sy1BwFMwMJe61Blls0Oh2oYo7aWorMEZD6Tx13AIEhmCxY7mCZmf+h9WTIVXtHqIxDBCMAJyFb+g==";

describe("Forever sim links", () => {
  it("maps every ranked spec onto an ElliotWood classic UI path", () => {
    assert.deepEqual(allSpecsHaveSimUiPath(), []);
    assert.equal(simUiPathForSpec("warrior-fury"), "warrior/dps");
    assert.equal(simUiPathForSpec("warrior-prot"), "warrior/protection");
    assert.equal(simUiPathForSpec("paladin-ret"), "paladin/retribution");
    assert.equal(simUiPathForSpec("priest-shadow"), "priest/dps");
    assert.equal(simUiPathForSpec("druid-bear"), "druid/feralbear");
    assert.equal(SPECS.some((spec) => spec.id === "warrior-fury"), true);
  });

  it("accepts an elliotwood Forever warrior hash for fury", () => {
    const parsed = parsePastedSimLink(furyLink, "warrior-fury");
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.path, "warrior/dps");
      assert.equal(parsed.url.startsWith("https://elliotwood.github.io/Forever/forever/warrior/dps/#"), true);
    }
  });

  it("rejects a class mismatch and a talent calc URL", () => {
    const mage = parsePastedSimLink(
      "https://elliotwood.github.io/Forever/forever/mage/dps/#eJzj",
      "warrior-fury",
    );
    assert.equal(mage.ok, false);
    const talents = parsePastedSimLink(
      "https://nikftw.github.io/forevertalent/warrior/#30305013002000000050530035150010051",
      "warrior-fury",
    );
    assert.equal(talents.ok, false);
    const prot = parsePastedSimLink(furyLink, "warrior-prot");
    assert.equal(prot.ok, false);
  });
});
