import { SPECS } from "@/lib/data/specs";

export const FOREVER_SIM_ORIGIN = "https://elliotwood.github.io/Forever/classic";

const SIM_UI_PATH: Record<string, string> = {
  "warrior-fury": "warrior",
  "warrior-arms": "warrior",
  "warrior-prot": "tank_warrior",
  "paladin-ret": "retribution_paladin",
  "paladin-prot": "protection_paladin",
  "paladin-holy": "holy_paladin",
  "hunter-survival": "hunter",
  "hunter-mm": "hunter",
  "hunter-bm": "hunter",
  "rogue-combat": "rogue",
  "rogue-assassination": "rogue",
  "rogue-subtlety": "rogue",
  "priest-shadow": "shadow_priest",
  "priest-disc": "healing_priest",
  "priest-holy": "healing_priest",
  "shaman-enhance": "enhancement_shaman",
  "shaman-ele": "elemental_shaman",
  "shaman-resto": "restoration_shaman",
  "mage-fire": "mage",
  "mage-frostfire": "mage",
  "mage-arcane": "mage",
  "warlock-affliction": "warlock",
  "warlock-demo": "warlock",
  "warlock-destro": "warlock",
  "druid-feral": "feral_druid",
  "druid-balance": "balance_druid",
  "druid-resto": "restoration_druid",
  "druid-bear": "feral_tank_druid",
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
  const pathMatch = before.match(/\/classic\/([a-z0-9_]+)$/i);
  if (!pathMatch) {
    return {
      ok: false,
      error: "Need a Forever classic/{class}/# link",
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
