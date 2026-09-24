import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const home = homedir();
const progGoBin = "C:\\Program Files\\Go\\bin\\go.exe";
const goBin = existsSync(progGoBin)
  ? progGoBin
  : existsSync(join(home, "sdk", "go", "bin", "go.exe"))
    ? join(home, "sdk", "go", "bin", "go.exe")
    : "go";
const go = goBin;
const wowsims = resolve(process.cwd(), "..", "wowsims-forever");
const out = resolve(process.cwd(), "lib", "data", "sim-results.json");

if (!existsSync(join(wowsims, "go.mod"))) {
  console.error(
    `Missing patched Forever clone at ${wowsims}. Clone https://github.com/nikftw/Forever there first.`,
  );
  process.exit(1);
}

const extra = process.argv.slice(2);
const result = spawnSync(
  go,
  ["run", "--tags=with_db", "./tools/rank_races", "-out", out, ...extra],
  {
    cwd: wowsims,
    stdio: "inherit",
    env: {
      ...process.env,
      PATH: `${join(home, "sdk", "go", "bin")};${join(home, "go", "bin")};${process.env.PATH ?? ""}`,
      GOPATH: join(home, "go"),
      GOCACHE: join(home, "sdk", "gocache"),
    },
  },
);

process.exit(result.status ?? 1);
