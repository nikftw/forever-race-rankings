import type { WowClass } from "@/lib/types";

export const CALC_ORIGIN = "https://nikftw.github.io/forevertalent";

export type TalentOverride = {
  talents: string;
  treeSplit: string;
};

export type ParsedBuild =
  | { ok: true; talents: string; treeSplit: string }
  | { ok: false; error: string };

const LIVE_SHARE =
  /^b=1~([a-z0-9-]+)~([a-z]+)~(\d{2})~([0-9]+-[0-9]+-[0-9]+)$/;

export function foreverTreeSizes(wowClass: WowClass): [number, number, number] {
  switch (wowClass) {
    case "warrior":
      return [17, 18, 19];
    case "paladin":
      return [18, 16, 18];
    case "hunter":
      return [16, 16, 18];
    case "rogue":
      return [17, 17, 19];
    case "priest":
      return [18, 17, 18];
    case "shaman":
      return [16, 18, 16];
    case "mage":
      return [18, 17, 19];
    case "warlock":
      return [17, 19, 16];
    case "druid":
      return [17, 19, 16];
    default: {
      const exhaustive: never = wowClass;
      return exhaustive;
    }
  }
}

export function wowsimsTreeSizes(wowClass: WowClass): [number, number, number] {
  switch (wowClass) {
    case "warrior":
      return [17, 18, 18];
    case "paladin":
      return [18, 16, 18];
    case "hunter":
      return [16, 16, 18];
    case "rogue":
      return [17, 17, 19];
    case "priest":
      return [18, 17, 18];
    case "shaman":
      return [16, 18, 16];
    case "mage":
      return [18, 17, 19];
    case "warlock":
      return [17, 19, 16];
    case "druid":
      return [16, 19, 16];
    default: {
      const exhaustive: never = wowClass;
      return exhaustive;
    }
  }
}

function asWowClass(value: string): WowClass | null {
  switch (value) {
    case "warrior":
    case "paladin":
    case "hunter":
    case "rogue":
    case "priest":
    case "shaman":
    case "mage":
    case "warlock":
    case "druid":
      return value;
    default:
      return null;
  }
}

function classSlugFromParts(parts: string[]): WowClass | null {
  for (const part of parts) {
    const slug = asWowClass(part.toLowerCase());
    if (slug) {
      return slug;
    }
  }
  return null;
}

export function stripTalentExtras(raw: string): string {
  const kept: string[] = [];
  for (const seg of raw.split("-")) {
    if (seg === "" || /^\d+$/.test(seg)) {
      kept.push(seg);
      continue;
    }
    break;
  }
  while (kept.length > 3) {
    kept.pop();
  }
  while (kept.length && kept[kept.length - 1] === "") {
    kept.pop();
  }
  return kept.join("-");
}

function padTree(tree: string, size: number): string {
  if (tree.length >= size) {
    return tree.slice(0, size);
  }
  return tree + "0".repeat(size - tree.length);
}

function stripTrailingZeros(value: string): string {
  return value.replace(/0+$/, "");
}

export function canonicalTalents(talents: string): string {
  return talents
    .split("-")
    .map((tree) => stripTrailingZeros(tree))
    .join("-")
    .replace(/-+$/, "");
}

export function dashedFromForeverFlat(
  flat: string,
  wowClass: WowClass,
): string {
  const forever = foreverTreeSizes(wowClass);
  const sim = wowsimsTreeSizes(wowClass);
  const total = forever[0] + forever[1] + forever[2];
  const padded = padTree(flat, total);
  let offset = 0;
  const trees = forever.map((size, index) => {
    const slice = padded.slice(offset, offset + size).slice(0, sim[index]);
    offset += size;
    return stripTrailingZeros(slice);
  });
  return trees.join("-").replace(/-+$/, "");
}

export function foreverFlatFromDashed(
  talents: string,
  wowClass: WowClass,
): string {
  const sizes = foreverTreeSizes(wowClass);
  const trees = talents.split("-");
  let encoded = "";
  for (let index = 0; index < 3; index += 1) {
    encoded += padTree(trees[index] ?? "", sizes[index]);
  }
  return stripTrailingZeros(encoded);
}

function liveShareTalents(payload: string): {
  classSlug: string;
  talents: string;
} | null {
  const match = LIVE_SHARE.exec(payload.replace(/^#/, ""));
  if (!match) {
    return null;
  }
  return {
    classSlug: match[2] ?? "",
    talents: canonicalTalents(match[4] ?? ""),
  };
}

function payloadFromText(raw: string): string {
  let hash = raw.trim();
  try {
    const url = new URL(hash);
    const parts = url.pathname.split("/").filter(Boolean);
    const fragment = url.hash.replace(/^#/, "").replace(/\/+$/, "");
    const live = liveShareTalents(fragment);
    if (live) {
      return fragment;
    }
    const sixty = parts.indexOf("60");
    if (sixty >= 0) {
      hash = parts[sixty + 1] ?? "";
    } else {
      const classIdx = parts.findIndex((part) => asWowClass(part.toLowerCase()));
      if (classIdx >= 0) {
        const next = parts[classIdx + 1] ?? "";
        hash = /^\d/.test(next) || next.includes("-") ? next : fragment;
      } else {
        hash = fragment || (parts[parts.length - 1] ?? "");
      }
    }
    if (!hash) {
      hash = fragment;
    }
  } catch {
    hash = raw.trim();
  }
  return hash.replace(/^#/, "").replace(/\/+$/, "");
}

export function simTalentsFromUrl(
  talentUrl: string | null,
  wowClass: WowClass,
): string {
  if (!talentUrl) {
    return "";
  }
  const live = liveShareTalents(talentUrl.replace(/^.*#/, ""));
  if (live) {
    return live.talents;
  }
  const hash = payloadFromText(talentUrl);
  const nested = liveShareTalents(hash);
  if (nested) {
    return nested.talents;
  }
  if (!/^[\d-]+$/.test(hash)) {
    return "";
  }
  return hash.includes("-")
    ? canonicalTalents(stripTalentExtras(hash))
    : dashedFromForeverFlat(hash, wowClass);
}

export function calcUrlFor(
  wowClass: WowClass,
  talents: string | null,
): string {
  const origin = `${CALC_ORIGIN}/${wowClass}/`;
  if (!talents) {
    return origin;
  }
  const dashed = talents.includes("-")
    ? canonicalTalents(stripTalentExtras(talents))
    : dashedFromForeverFlat(talents, wowClass);
  const flat = foreverFlatFromDashed(dashed, wowClass);
  return flat ? `${origin}#${flat}` : origin;
}

export function treeSplitFromTalents(talents: string): string {
  const trees = talents.split("-");
  return [0, 1, 2]
    .map((index) =>
      [...(trees[index] ?? "")].reduce(
        (sum, ch) => sum + (Number(ch) || 0),
        0,
      ),
    )
    .join("/");
}

export function parsePastedBuild(
  raw: string,
  wowClass: WowClass,
): ParsedBuild {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Paste a nikftw talent calc build link." };
  }
  if (/^\d+\/\d+\/\d+$/.test(trimmed)) {
    return {
      ok: false,
      error:
        "That is only the point split. Paste the calc link so we can sim the tree.",
    };
  }

  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    const pathClass = classSlugFromParts(parts);
    const live = liveShareTalents(url.hash.replace(/^#/, ""));
    const foundClass = live?.classSlug ?? pathClass;
    if (foundClass && foundClass !== wowClass) {
      return {
        ok: false,
        error: `That link is for ${foundClass}, not ${wowClass}.`,
      };
    }
  } catch {
    // not a URL
  }

  const hash = payloadFromText(trimmed);
  const live = liveShareTalents(hash.replace(/^.*#/, ""));
  if (live) {
    if (live.classSlug !== wowClass) {
      return {
        ok: false,
        error: `That link is for ${live.classSlug}, not ${wowClass}.`,
      };
    }
    if (!/\d/.test(live.talents)) {
      return {
        ok: false,
        error: "Could not read a talent tree from that paste.",
      };
    }
    return {
      ok: true,
      talents: live.talents,
      treeSplit: treeSplitFromTalents(live.talents),
    };
  }

  if (!hash || !/^[\d-]+$/.test(hash)) {
    return {
      ok: false,
      error: "Paste a nikftw.github.io/forevertalent link or talent string.",
    };
  }

  const talents = hash.includes("-")
    ? canonicalTalents(stripTalentExtras(hash))
    : dashedFromForeverFlat(hash, wowClass);
  if (!/\d/.test(talents)) {
    return {
      ok: false,
      error: "Could not read a talent tree from that paste.",
    };
  }

  return {
    ok: true,
    talents,
    treeSplit: treeSplitFromTalents(talents),
  };
}
