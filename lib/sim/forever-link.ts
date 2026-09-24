import { SPECS } from "@/lib/data/specs";

export const FOREVER_SIM_ORIGIN = "https://elliotwood.github.io/Forever/forever";

const SIM_UI_PATH: Record<string, string> = {
  "warrior-fury": "warrior/dps",
  "warrior-arms": "warrior/dps",
  "warrior-prot": "warrior/protection",
  "paladin-ret": "paladin/retribution",
  "paladin-prot": "paladin/protection",
  "paladin-holy": "paladin/holy",
  "hunter-survival": "hunter/dps",
  "hunter-mm": "hunter/dps",
  "hunter-bm": "hunter/dps",
  "rogue-combat": "rogue/dps",
  "rogue-assassination": "rogue/dps",
  "rogue-subtlety": "rogue/dps",
  "priest-shadow": "priest/dps",
  "priest-disc": "priest/healer",
  "priest-holy": "priest/healer",
  "shaman-enhance": "shaman/enhancement",
  "shaman-ele": "shaman/elemental",
  "shaman-resto": "shaman/restoration",
  "mage-fire": "mage/dps",
  "mage-frostfire": "mage/dps",
  "mage-arcane": "mage/dps",
  "warlock-affliction": "warlock/dps",
  "warlock-demo": "warlock/dps",
  "warlock-destro": "warlock/dps",
  "druid-feral": "druid/feralcat",
  "druid-balance": "druid/balance",
  "druid-resto": "druid/restoration",
  "druid-bear": "druid/feralbear",
};

export type ParsedSimLink =
  | { ok: true; url: string; path: string }
  | { ok: false; error: string };

export function simUiPathForSpec(specId: string): string {
  const path = SIM_UI_PATH[specId];
  if (!path) {
    throw new Error(`no Forever sim UI for ${specId}`);
  }
  return path;
}

export function foreverSimPageUrl(specId: string): string {
  return `${FOREVER_SIM_ORIGIN}/${simUiPathForSpec(specId)}/`;
}

export function allSpecsHaveSimUiPath(): string[] {
  return SPECS.map((spec) => spec.id).filter((id) => !SIM_UI_PATH[id]);
}

export function parsePastedSimLink(
  raw: string,
  specId: string,
): ParsedSimLink {
  const text = raw.trim();
  if (!text) {
    return { ok: false, error: "Paste an ElliotWood Forever sim link" };
  }
  const hashAt = text.indexOf("#");
  if (hashAt < 0 || hashAt === text.length - 1) {
    return {
      ok: false,
      error: "That link has no sim hash. Export Link from the Forever sim.",
    };
  }
  const before = text.slice(0, hashAt).replace(/\/+$/, "");
  const hash = text.slice(hashAt + 1).replace(/\s+/g, "");
  const pathMatch = before.match(/\/(?:classic|forever)\/([a-z0-9_]+\/[a-z0-9_]+)$/i);
  if (!pathMatch) {
    return {
      ok: false,
      error: "Need a Forever /forever/{class}/{spec}/# link",
    };
  }
  const path = pathMatch[1].toLowerCase();
  const expected = simUiPathForSpec(specId);
  if (path !== expected) {
    return {
      ok: false,
      error: `That link is ${path}, this spec uses ${expected}`,
    };
  }
  return {
    ok: true,
    path,
    url: `${FOREVER_SIM_ORIGIN}/${path}/#${hash}`,
  };
}
