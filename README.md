# Forever Race Rankings

Guild tool for **World of Warcraft: Forever**. Rank the best race for each class/spec on Horde (left) and Alliance (right) at **level 60**.

Live site: [https://nikftw.github.io/forever-race-rankings/](https://nikftw.github.io/forever-race-rankings/)

Combat is [nikftw/Forever](https://github.com/nikftw/Forever) (**MIT**), a fork of [ElliotWood/Forever](https://github.com/ElliotWood/Forever) with locked racials and `tools/rank_races`. `/audit` is the racial table.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Racial table: [http://localhost:3000/audit](http://localhost:3000/audit).

```bash
npm test
npm run lint
```

## Re-sim

Each combo uses the **Iters** control (default 1000) on a 180s Patchwerk fight (default Demon dummy). The **Dummy** control re-sims against Beast, Elemental, and the other creature types so Beast Slaying / BGH / Elemental Insight can score. **Refresh all sims** (local `next dev` / `next start` only) runs every combo again with a **new seed** and streams combo-by-combo progress. GitHub Pages is a static snapshot of the last committed JSON.

Needs [Go](https://go.dev/dl/) and a clone of the patched Forever engine beside this repo:

```bash
git clone https://github.com/nikftw/Forever.git ../wowsims-forever
```

```bash
npm run sim
```

Writes `lib/data/sim-results.json`. Omit `-seed` for a fresh seed, or pass `-seed 101` to pin one.

## What it sims

- 20–3000 iterations per class/race/spec (set **Iters** on the board), 180s generic Patchwerk (pick dummy type in the UI; Demon leaves Beast Slaying / BGH / Elemental Insight off)
- ElliotWood class APLs + Era pre-raid kits in `lib/data/era-prebis` (dungeon / crafted / world-boss; no raid or ranked PvP)
- Axe / sword / mace races are swapped onto that weapon type
- Talents from [talentsforever.com](https://talentsforever.com) `/60/` strings when the fork accepts them
- Forever racials from `lib/data/racial-audit.ts`

## What it does not sim

- Raid BiS (encrypted until first drop)
- Utility as a score (badges only: WotF, Stoneform, Skysight, professions)
- Holy Paladin, Subtlety, Holy Priest, Discipline, Resto Shaman, Resto Druid (no guild combat APL yet)
