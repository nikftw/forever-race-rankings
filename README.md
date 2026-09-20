# Forever Race Rankings

Guild tool for **World of Warcraft: Forever**. Rank the best race for each class/spec on Horde (left) and Alliance (right) at **level 60**.

Live site: [https://nikftw.github.io/forever-race-rankings/](https://nikftw.github.io/forever-race-rankings/)

Combat is [ElliotWood/Forever](https://github.com/ElliotWood/Forever) (**MIT**), patched to the locked racial audit. `/audit` is the racial table.

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

Each combo is **300 iterations** of a 180s Demon Patchwerk fight. The **Refresh all sims** button (local `next dev` / `next start` only) runs every combo again with a **new seed**. GitHub Pages is a static snapshot of the last committed JSON.

Needs [Go](https://go.dev/dl/) and a clone of ElliotWood/Forever at `../wowsims-forever`.

```bash
npm run sim
```

Writes `lib/data/sim-results.json`. Omit `-seed` for a fresh seed, or pass `-seed 101` to pin one.

## What it sims

- 300 iterations per class/race/spec, 180s generic Patchwerk (Demon dummy so Beast Slaying / BGH / Elemental Insight stay off)
- ElliotWood class APLs + the same pre-raid gear preset for every race of a spec
- Axe / sword / mace races are swapped onto that weapon type
- Talents from [talentsforever.com](https://talentsforever.com) `/60/` strings when the fork accepts them
- Forever racials from `lib/data/racial-audit.ts`

## What it does not sim

- Raid BiS (encrypted until first drop)
- Utility as a score (badges only: WotF, Stoneform, Skysight, professions)
- Holy Paladin, Subtlety, Holy Priest, Discipline, Resto Shaman, Resto Druid (no guild combat APL yet)
