import { spawn } from "node:child_process";
import { join } from "node:path";
import { specById } from "@/lib/data/specs";
import { foreverSimPageUrl } from "@/lib/sim/forever-link";
import { NextResponse } from "next/server";

export const maxDuration = 300;

function parseSpec(raw: string | null): string {
  return raw?.trim() ?? "";
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const spec = parseSpec(query.get("spec"));
  const race = parseSpec(query.get("race"));
  if (!spec) {
    return NextResponse.json(
      { ok: false as const, error: "missing spec" },
      { status: 400 },
    );
  }
  try {
    specById(spec);
  } catch {
    return NextResponse.json(
      { ok: false as const, error: "unknown spec" },
      { status: 400 },
    );
  }

  const args = ["-link-only", "-spec", spec];
  if (race) {
    args.push("-race", race);
  }

  const result = await new Promise<{ code: number; stdout: string; stderr: string }>(
    (resolve) => {
      const child = spawn(
        process.execPath,
        [join(process.cwd(), "tools", "run-sim.mjs"), ...args],
        { cwd: process.cwd(), env: process.env },
      );
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk: Buffer | string) => {
        stdout += String(chunk);
      });
      child.stderr.on("data", (chunk: Buffer | string) => {
        stderr += String(chunk);
        if (stderr.length > 4000) {
          stderr = stderr.slice(-4000);
        }
      });
      child.on("close", (code) => {
        resolve({ code: code ?? 1, stdout, stderr });
      });
    },
  );

  const match = result.stdout.split(/\r?\n/).find((line) => line.startsWith("LINK "));
  if (result.code === 0 && match) {
    return NextResponse.json({ ok: true as const, url: match.slice(5).trim() });
  }
  return NextResponse.json(
    {
      ok: false as const,
      url: foreverSimPageUrl(spec),
      error: result.stderr.trim() || "could not build Forever link",
    },
    { status: 502 },
  );
}
