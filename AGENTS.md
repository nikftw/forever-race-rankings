<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Forever Race Rankings

## Purpose
Local guild tool that ranks WoW Forever races per class/spec on Horde and Alliance at level 60. Combat is [nikftw/Forever](https://github.com/nikftw/Forever) (MIT fork of ElliotWood/Forever) after our racial patches. Racial numbers come from `lib/data/racial-audit.ts`, not wowsims/forever Classic leftovers.

## Run
```
npm run dev
npm test
npm run lint
```

Open http://localhost:3000 for rankings and /audit for the racial truth table.

Re-sim (Go + sibling clone at `../wowsims-forever`, from https://github.com/nikftw/Forever):
```
npm run sim
```

`npm run dev` displays the last `lib/data/sim-results.json`. Each combo is 1000 iterations. The UI **Refresh all sims** button re-runs the ranker with a new seed. The **Dummy** control re-sims against Beast / Elemental / etc so type-gated racials can score. GitHub Pages is a static snapshot of the last committed JSON (needs Go + `../wowsims-forever`).

## Conventions
- Forever racials live in `lib/data/racial-audit.ts`. The ranker may only encode `effect` fields from that file into ElliotWood `racials.go`.
- Talent builds live in `lib/data/specs.ts`. If a 51-point talentsforever build is missing, set `needsOverride: true` and leave `treeSplit` null. Do not invent trees.
- Ranker gear comes from `lib/data/era-prebis` (Classic Era dungeon / crafted / world-boss). No raid drops or ranked PvP. The board lists those equipped items from `sim-results.json`.
- Exhaustive switches over unions/enums must have a `never` default.

## Do not
- Copy wowsims/forever Classic racials (Blood Elf, Draenei, Gun Spec, missing-HP Berserking, 10% Human Spirit).
- Treat Wowhead Classic tooltips as Forever truth.
- Score utility racials as DPS (Skysight / Windshaper AP-SP burst is fake; do not restore it).
- Commit secrets or large raw datasets.
