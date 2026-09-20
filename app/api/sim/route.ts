import { spawn } from "node:child_process";
import { randomInt } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { specById } from "@/lib/data/specs";
import { parsePastedSimLink } from "@/lib/sim/forever-link";
import { isMobType } from "@/lib/sim/mob-type";
import { NextResponse } from "next/server";

export const maxDuration = 300;

type SimBody = {
  spec?: string;
  talents?: string;
  mobType?: string;
  iterations?: number;
  simLink?: string;
};

const overridesPath = join(
  process.cwd(),
  "lib",
  "data",
  "talent-overrides.json",
);

const MIN_ITERS = 20;
const MAX_ITERS = 3000;
const DEFAULT_ITERS = 1000;

function parseIters(raw: unknown): number {
  const value = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(value) || value < MIN_ITERS || value > MAX_ITERS) {
    return DEFAULT_ITERS;
  }
  return value;
}

async function writeTalentOverride(
  spec: string,
  talents: string,
): Promise<void> {
  let map: Record<string, string> = {};
  try {
    map = JSON.parse(await readFile(overridesPath, "utf8")) as Record<
      string,
      string
    >;
  } catch {
    map = {};
  }
  map[spec] = talents;
  await writeFile(overridesPath, `${JSON.stringify(map, null, 2)}\n`);
}

async function readBody(request: Request): Promise<SimBody> {
  try {
    return (await request.json()) as SimBody;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const body = await readBody(request);
  const spec = typeof body.spec === "string" ? body.spec.trim() : "";
  const talents = typeof body.talents === "string" ? body.talents.trim() : "";
  const mobType = typeof body.mobType === "string" ? body.mobType.trim() : "";
  const simLink = typeof body.simLink === "string" ? body.simLink.trim() : "";
  const iterations = parseIters(body.iterations);

  if (spec) {
    try {
      specById(spec);
    } catch {
      return NextResponse.json(
        { ok: false as const, error: "unknown spec" },
        { status: 400 },
      );
    }
  }
  if (talents && !/^[\d-]+$/.test(talents)) {
    return NextResponse.json(
      { ok: false as const, error: "invalid talents" },
      { status: 400 },
    );
  }
  if (mobType && !isMobType(mobType)) {
    return NextResponse.json(
      { ok: false as const, error: "unknown mob type" },
      { status: 400 },
    );
  }
  if (simLink && !spec) {
    return NextResponse.json(
      { ok: false as const, error: "sim link needs a spec" },
      { status: 400 },
    );
  }
  const imported = simLink && spec ? parsePastedSimLink(simLink, spec) : null;
  if (imported && !imported.ok) {
    return NextResponse.json(
      { ok: false as const, error: imported.error },
      { status: 400 },
    );
  }
  if (spec && talents) {
    await writeTalentOverride(spec, talents);
  }

  const seed = randomInt(1, 2147483646);
  const args = ["-seed", String(seed), "-iters", String(iterations)];
  if (spec) {
    args.push("-spec", spec);
  }
  if (spec && talents) {
    args.push("-talents", talents);
  }
  if (imported && imported.ok) {
    args.push("-import-link", imported.url);
  }
  if (mobType) {
    args.push("-mob", mobType);
  }

  const encoder = new TextEncoder();
  const resultsPath = join(process.cwd(), "lib", "data", "sim-results.json");
  const stream = new ReadableStream({
    start(controller) {
      const child = spawn(
        process.execPath,
        [join(process.cwd(), "tools", "run-sim.mjs"), ...args],
        { cwd: process.cwd(), env: process.env },
      );
      let stderr = "";
      let stdout = "";
      const flushLines = (chunk: Buffer | string) => {
        stdout += String(chunk);
        let newline = stdout.indexOf("\n");
        while (newline >= 0) {
          const line = stdout.slice(0, newline).replace(/\r$/, "");
          stdout = stdout.slice(newline + 1);
          if (line.startsWith("SIM ")) {
            controller.enqueue(encoder.encode(`${line.slice(4)}\n`));
          }
          newline = stdout.indexOf("\n");
        }
      };
      child.stdout.on("data", flushLines);
      child.stderr.on("data", (chunk: Buffer | string) => {
        stderr += String(chunk);
        if (stderr.length > 4000) {
          stderr = stderr.slice(-4000);
        }
      });
      child.on("close", (code) => {
        void (async () => {
          if (code === 0) {
            const raw = await readFile(resultsPath, "utf8");
            controller.enqueue(
              encoder.encode(
                `${JSON.stringify({ type: "done", results: JSON.parse(raw) })}\n`,
              ),
            );
          } else {
            controller.enqueue(
              encoder.encode(
                `${JSON.stringify({
                  type: "error",
                  error: stderr.trim() || "sim failed",
                })}\n`,
              ),
            );
          }
          controller.close();
        })();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
    },
  });
}
