"use client";

import { WOW_CLASSES, classLabel } from "@/lib/data/combos";
import { raceById } from "@/lib/data/races";
import { RACIAL_AUDIT, type RacialAuditRow } from "@/lib/data/racial-audit";
import {
  replaceSimResults,
  simMeta,
  type StoredResults,
} from "@/lib/sim/engine";
import { rankClass, type RankedRace, type SpecRanking } from "@/lib/sim/rank";
import type { Faction, RaceId, Role } from "@/lib/types";
import Link from "next/link";
import { useState } from "react";

type BoardMode = "dps" | "support";

function rolesFor(mode: BoardMode): Role[] {
  return mode === "dps" ? ["dps"] : ["heal", "tank"];
}

function formatDps(value: number): string {
  return value.toFixed(1);
}

function raceHasDispute(specId: string, raceId: RankedRace["raceId"]): boolean {
  return RACIAL_AUDIT.some((row) => {
    if (!row.disputed || row.effect === null) {
      return false;
    }
    if (row.raceId === raceId) {
      return true;
    }
    return (
      row.id === "priest-starshards" &&
      specId === "priest-shadow" &&
      raceId === "nightelf"
    );
  });
}

function scoredRacialsFor(specId: string, raceId: RaceId): RacialAuditRow[] {
  return RACIAL_AUDIT.filter((row) => {
    if (row.effect === null) {
      return false;
    }
    if (row.raceId === raceId) {
      return true;
    }
    return (
      row.id === "priest-starshards" &&
      specId.startsWith("priest-") &&
      raceId === "nightelf"
    );
  });
}

function SpecColumn({
  ranking,
  faction,
  selectedKey,
  onSelect,
}: {
  ranking: SpecRanking;
  faction: Faction;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  const fill =
    faction === "horde" ? "bg-[var(--horde)]" : "bg-[var(--alliance)]";
  const borderColor =
    faction === "horde" ? "border-[var(--horde)]" : "border-[var(--alliance)]";
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h3
          className={`font-[family-name:var(--font-display)] text-sm tracking-wide ${
            faction === "horde" ? "text-[var(--horde)]" : "text-[var(--alliance)]"
          }`}
        >
          {ranking.spec.name}
        </h3>
        {ranking.spec.treeSplit ? (
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--muted)]">
            {ranking.spec.treeSplit}
          </span>
        ) : (
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--gold)]">
            TODO
          </span>
        )}
      </div>
      <ol className="flex flex-col gap-px">
        {ranking.rows.map((row) => {
          const key = `${ranking.spec.id}:${row.raceId}`;
          const open = selectedKey === key;
          const race = raceById(row.raceId);
          const width = Math.max(6, row.pctOfBest * 100);
          const racials = scoredRacialsFor(ranking.spec.id, row.raceId);
          return (
            <li key={row.raceId}>
              <button
                type="button"
                onClick={() => onSelect(key)}
                className={`relative block h-7 w-full overflow-hidden text-left ${
                  open ? "ring-1 ring-[var(--gold)]" : ""
                }`}
              >
                <span className="absolute inset-0 bg-black/35" />
                <span
                  className={`absolute inset-y-0 left-0 ${fill}`}
                  style={{ width: `${width}%`, opacity: 0.72 }}
                />
                <span className="relative z-10 flex h-full items-center justify-between gap-2 px-2">
                  <span className="truncate text-[13px] leading-none">
                    {race.name}
                    {raceHasDispute(ranking.spec.id, row.raceId) ? (
                      <span className="ml-1.5 font-[family-name:var(--font-mono)] text-[9px] tracking-wider text-[var(--gold)]">
                        DISPUTED
                      </span>
                    ) : null}
                    {row.missing ? (
                      <span className="ml-1.5 font-[family-name:var(--font-mono)] text-[9px] tracking-wider text-[var(--gold)]">
                        NO SIM
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 font-[family-name:var(--font-mono)] text-[11px] leading-none text-[var(--ink)]">
                    {formatDps(row.dps)}
                    <span className="ml-1.5 text-[var(--muted)]">
                      {(row.pctOfBest * 100).toFixed(1)}%
                    </span>
                  </span>
                </span>
              </button>
              {open ? (
                <div className={`mt-1 border-l pl-2 text-[11px] text-[var(--muted)] ${borderColor}`}>
                  <p>
                    {row.iterations} iterations · seed {row.seed} · weapon{" "}
                    {row.weapon}
                    {row.kit.label ? ` · ${row.kit.label}` : ""}
                  </p>
                  <p className="mt-0.5 font-[family-name:var(--font-mono)]">
                    {row.talentSource}
                    {row.talents ? ` · ${row.talents}` : ""}
                    {ranking.spec.treeSplit ? ` · ${ranking.spec.treeSplit}` : ""}
                  </p>
                  {racials.length ? (
                    <ul className="mt-1">
                      {racials.map((racial) => (
                        <li key={racial.id}>
                          {racial.name}: {racial.chosen}
                          {racial.disputed ? " (disputed)" : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <ul className="mt-0.5 font-[family-name:var(--font-mono)]">
                    {row.contributions.map((piece) => (
                      <li key={piece.label}>
                        {piece.label}
                        {piece.dps !== 0 ? `: ${formatDps(piece.dps)}` : ""}
                      </li>
                    ))}
                  </ul>
                  {row.kit.items.length ? (
                    <ul className="mt-1">
                      {row.kit.items.map((item) => (
                        <li key={`${item.slot}-${item.name}`}>
                          {item.slot}: {item.name}{" "}
                          <span className="text-[var(--gold)]">
                            {item.source}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {row.utility.length ? (
                    <p className="mt-1">
                      Utility (not scored): {row.utility.join(" · ")}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const canResim = process.env.NEXT_PUBLIC_CAN_RESIM !== "0";

export function RaceBoard() {
  const [mode, setMode] = useState<BoardMode>("dps");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const roles = rolesFor(mode);
  const meta = simMeta();

  async function refreshSims(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/sim", { method: "POST" });
      const body = (await response.json()) as
        | { ok: true; results: StoredResults }
        | { ok: false; error: string };
      if (!response.ok || !body.ok) {
        const message =
          "error" in body && body.error
            ? body.error
            : "Re-sim failed. Needs Go and ../wowsims-forever.";
        setError(message);
        return;
      }
      replaceSimResults(body.results);
      setVersion((current) => current + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Re-sim failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)] pb-3">
        <div className="flex gap-4 font-[family-name:var(--font-display)] text-sm tracking-[0.14em] uppercase">
          <button
            type="button"
            className={mode === "dps" ? "text-[var(--ink)]" : "text-[var(--muted)]"}
            onClick={() => setMode("dps")}
          >
            DPS
          </button>
          <button
            type="button"
            className={mode === "support" ? "text-[var(--ink)]" : "text-[var(--muted)]"}
            onClick={() => setMode("support")}
          >
            Heal / Tank
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {canResim ? (
            <button
              type="button"
              onClick={() => void refreshSims()}
              disabled={busy}
              className="border border-[var(--gold)] px-2 py-1 font-[family-name:var(--font-display)] text-[11px] tracking-[0.12em] uppercase text-[var(--gold)] disabled:opacity-50"
            >
              {busy ? "Re-simming…" : "Refresh all sims"}
            </button>
          ) : null}
        </div>
      </div>
      <p className="mb-2 text-[11px] text-[var(--muted)]">
        Each combo: {meta.iterations} iterations · seed {meta.seed} ·{" "}
        {meta.fightDurationSec}s Patchwerk ({meta.mobType}) ·{" "}
        <a className="text-[var(--gold)] underline" href={meta.engineUrl}>
          {meta.engine}
        </a>{" "}
        ({meta.license})
        {meta.generatedAt ? ` · ${meta.generatedAt}` : ""}
      </p>
      <p className="mb-4 text-[11px] text-[var(--muted)]">
        Same pre-raid kit per spec; axe / sword / mace races are swapped onto
        that weapon. Talents are talentsforever /60/ 51-pt trees. Raid buffs are
        ElliotWood ForeverBuffs. Beast / elemental racials stay off on this
        dummy.{" "}
        <Link className="text-[var(--gold)] underline" href="/audit">
          Racial table
        </Link>
        .
      </p>
      {error ? (
        <p className="mb-3 text-[11px] text-[var(--horde)]">{error}</p>
      ) : null}
      {busy ? (
        <p className="mb-3 text-[11px] text-[var(--gold)]">
          Running every class/race/spec at {meta.iterations} iterations with a
          new seed. About 20 seconds locally.
        </p>
      ) : null}

      <div className="flex flex-col gap-8" key={version}>
        {WOW_CLASSES.map((wowClass) => {
          const ranked = rankClass(wowClass, roles);
          if (ranked.length === 0) {
            return null;
          }
          return (
            <article key={wowClass}>
              <h2 className="mb-2 font-[family-name:var(--font-display)] text-lg tracking-[0.18em] uppercase text-[var(--ink)]">
                {classLabel(wowClass)}
              </h2>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <section aria-label="Horde">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {ranked.map((entry) => (
                      <SpecColumn
                        key={`h-${entry.spec.id}`}
                        ranking={entry.horde}
                        faction="horde"
                        selectedKey={selectedKey}
                        onSelect={setSelectedKey}
                      />
                    ))}
                  </div>
                </section>
                <section aria-label="Alliance">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {ranked.map((entry) => (
                      <SpecColumn
                        key={`a-${entry.spec.id}`}
                        ranking={entry.alliance}
                        faction="alliance"
                        selectedKey={selectedKey}
                        onSelect={setSelectedKey}
                      />
                    ))}
                  </div>
                </section>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
