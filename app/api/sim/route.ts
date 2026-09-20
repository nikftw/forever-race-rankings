import { spawn } from "node:child_process";
import { randomInt } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const maxDuration = 120;

function runSim(seed: number): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [
        join(process.cwd(), "tools", "run-sim.mjs"),
        "-seed",
        String(seed),
        "-iters",
        "300",
      ],
      { cwd: process.cwd(), env: process.env },
    );
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += String(chunk);
      if (stderr.length > 4000) {
        stderr = stderr.slice(-4000);
      }
    });
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stderr });
    });
  });
}

export async function POST() {
  const seed = randomInt(1, 2147483646);
  const result = await runSim(seed);
  if (result.code !== 0) {
    return NextResponse.json(
      {
        ok: false as const,
        error: result.stderr.trim() || "sim failed",
      },
      { status: 500 },
    );
  }
  const raw = await readFile(
    join(process.cwd(), "lib", "data", "sim-results.json"),
    "utf8",
  );
  return NextResponse.json({
    ok: true as const,
    results: JSON.parse(raw) as unknown,
  });
}
