import { spawnSync } from "node:child_process";
import { existsSync, renameSync } from "node:fs";
import { join } from "node:path";

const api = join(process.cwd(), "app", "api");
const parked = join(process.cwd(), ".pages-api-tmp");

if (existsSync(api)) {
  renameSync(api, parked);
}

try {
  const result = spawnSync("npx", ["next", "build"], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: true,
    env: { ...process.env, GITHUB_PAGES: "1" },
  });
  process.exit(result.status ?? 1);
} finally {
  if (existsSync(parked)) {
    renameSync(parked, api);
  }
}
