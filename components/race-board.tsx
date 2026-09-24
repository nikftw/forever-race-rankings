"use client";

import { BOARD_ROWS } from "@/lib/data/combos";
import { raceById } from "@/lib/data/races";
import { RACIAL_AUDIT, type RacialAuditRow } from "@/lib/data/racial-audit";
import { specById, type SpecDef } from "@/lib/data/specs";
import {
  replaceSimResults,
  simMeta,
  storedTalentsForSpec,
  upsertSimRow,
  type StoredResults,
  type StoredRow,
} from "@/lib/sim/engine";
import {
  asMobType,
  isMobType,
  MOB_TYPES,
  mobTypeLabel,
} from "@/lib/sim/mob-type";
import { rankSpec, type RankedRace, type SpecRanking } from "@/lib/sim/rank";
import {
  foreverSimPageUrl,
  parsePastedSimLink,
} from "@/lib/sim/forever-link";
import {
  calcUrlFor,
  parsePastedBuild,
  simTalentsFromUrl,
  treeSplitFromTalents,
  type TalentOverride,
} from "@/lib/sim/talents";
import { assertNever, type Faction, type RaceId, type Role } from "@/lib/types";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";

type BoardMode = "dps" | "tank";

const OVERRIDE_KEY = "forever-talent-overrides";
const ITERS_KEY = "forever-sim-iters-1000";
const MIN_ITERS = 20;
const MAX_ITERS = 3000;
const DEFAULT_ITERS = 1000;

function clampIters(raw: number): number {
  if (!Number.isInteger(raw) || raw < MIN_ITERS) {
    return MIN_ITERS;
  }
  if (raw > MAX_ITERS) {
    return MAX_ITERS;
  }
  return raw;
}

function iterSnapshot(): string {
  if (typeof window === "undefined") {
    return String(DEFAULT_ITERS);
  }
  return window.localStorage.getItem(ITERS_KEY) ?? String(DEFAULT_ITERS);
}

function subscribeIters(listener: () => void): () => void {
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}

function writeIters(next: number): void {
  window.localStorage.setItem(ITERS_KEY, String(clampIters(next)));
  window.dispatchEvent(new Event("storage"));
}

function rolesFor(mode: BoardMode): Role[] {
  switch (mode) {
    case "dps":
      return ["dps"];
    case "tank":
      return ["tank"];
    default:
      return assertNever(mode, "board mode");
  }
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

function specTalents(spec: SpecDef, override?: TalentOverride): string {
  return override?.talents ?? simTalentsFromUrl(spec.talentUrl, spec.wowClass);
}

function applyTalentOverride(
  spec: SpecDef,
  override?: TalentOverride,
): SpecDef {
  if (!override) {
    return spec;
  }
  return {
    ...spec,
    treeSplit: override.treeSplit,
    talentUrl: calcUrlFor(spec.wowClass, override.talents),
    talentNote: "custom paste",
  };
}

const overrideListeners = new Set<() => void>();

function emitOverrides(): void {
  for (const listener of overrideListeners) {
    listener();
  }
}

function subscribeOverrides(listener: () => void): () => void {
  overrideListeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === OVERRIDE_KEY) {
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    overrideListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function overrideSnapshot(): string {
  try {
    return window.localStorage.getItem(OVERRIDE_KEY) ?? "{}";
  } catch {
    return "{}";
  }
}

function parseOverrides(raw: string): Record<string, TalentOverride> {
  try {
    const parsed = JSON.parse(raw) as Record<string, TalentOverride>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeOverrides(next: Record<string, TalentOverride>): void {
  window.localStorage.setItem(OVERRIDE_KEY, JSON.stringify(next));
  emitOverrides();
}

type EditorKind = "talents" | "gear";

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-4 w-4 items-center justify-center text-[var(--gold)] hover:text-[var(--ink)] disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-3 w-3">
      <path
        d="M11.2 2.2a1.2 1.2 0 0 1 1.7 1.7L5.6 11.2 3 12l.8-2.6 7.4-7.2Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M3 13.2h10"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArmorIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-3 w-3">
      <path
        d="M8 1.6 3.2 3.4v3.3c0 3.4 1.9 5.8 4.8 7.1 2.9-1.3 4.8-3.7 4.8-7.1V3.4L8 1.6Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M8 4.2v7.2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PasteIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-3 w-3">
      <path
        d="M5.2 3.2h5.6v1.4H5.2V3.2Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M4.2 4.6h7.6v9.2H4.2V4.6Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M6.4 8h3.2M6.4 10.4h3.2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-3 w-3">
      <path
        d="M2.5 8a5.5 5.5 0 1 0 1.2-3.4L2 6.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 3.5v3h3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpecColumn({
  ranking,
  faction,
  selectedKey,
  onSelect,
  override,
  editing,
  draft,
  parseError,
  applying,
  openingSim,
  onEdit,
  onOpenSim,
  onEditGear,
  onDraft,
  onCancel,
  onApply,
  onResim,
}: {
  ranking: SpecRanking;
  faction: Faction;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  override?: TalentOverride;
  editing: EditorKind | null;
  draft: string;
  parseError: string | null;
  applying: boolean;
  openingSim: boolean;
  onEdit: () => void;
  onOpenSim: () => void;
  onEditGear: () => void;
  onDraft: (value: string) => void;
  onCancel: () => void;
  onApply: () => void;
  onResim?: () => void;
}) {
  const fill =
    faction === "horde" ? "bg-[var(--horde)]" : "bg-[var(--alliance)]";
  const borderColor =
    faction === "horde" ? "border-[var(--horde)]" : "border-[var(--alliance)]";
  const talents = specTalents(ranking.spec, override);
  const calcUrl = calcUrlFor(ranking.spec.wowClass, talents || null);
  const splitLabel = ranking.spec.treeSplit ?? "TODO";
  const stale = ranking.rows.some(
    (row) => override && override.talents !== row.talents && !row.missing,
  );
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1">
        <div className="flex items-center justify-between gap-2">
          <h3
            className={`font-[family-name:var(--font-display)] text-sm tracking-wide ${
              faction === "horde" ? "text-[var(--horde)]" : "text-[var(--alliance)]"
            }`}
          >
            {ranking.spec.name}
          </h3>
          <div className="flex shrink-0 items-center gap-1">
            <a
              href={calcUrl}
              target="_blank"
              rel="noreferrer"
              title="Open in the nikftw talent calc"
              className={`font-[family-name:var(--font-mono)] text-[10px] underline decoration-[var(--line)] underline-offset-2 hover:text-[var(--gold)] ${
                ranking.spec.treeSplit
                  ? "text-[var(--muted)]"
                  : "text-[var(--gold)]"
              }`}
            >
              {splitLabel}
            </a>
            <IconButton
              label={`Edit ${ranking.spec.name} talents`}
              disabled={applying}
              onClick={onEdit}
            >
              <PencilIcon />
            </IconButton>
            <IconButton
              label={
                openingSim
                  ? `Opening ${ranking.spec.name} in Forever…`
                  : `Open ${ranking.spec.name} in Forever to amend gear`
              }
              disabled={openingSim || applying}
              onClick={onOpenSim}
            >
              <ArmorIcon />
            </IconButton>
            <IconButton
              label={`Paste a Forever sim link for ${ranking.spec.name}`}
              disabled={applying}
              onClick={onEditGear}
            >
              <PasteIcon />
            </IconButton>
            {canResim && onResim ? (
              <IconButton
                label={
                  applying
                    ? `Re-simming ${ranking.spec.name}…`
                    : `Re-sim ${ranking.spec.name}`
                }
                disabled={applying}
                onClick={onResim}
              >
                <RefreshIcon />
              </IconButton>
            ) : null}
          </div>
        </div>
        {editing ? (
          <form
            className="mt-1 flex flex-col gap-1"
            onSubmit={(event) => {
              event.preventDefault();
              onApply();
            }}
          >
            <input
              value={draft}
              onChange={(event) => onDraft(event.target.value)}
              placeholder={
                editing === "gear"
                  ? "Paste an elliotwood.github.io/Forever classic/# link"
                  : "Paste a nikftw.github.io/forevertalent link"
              }
              autoFocus
              className="w-full border border-[var(--line)] bg-black/30 px-1.5 py-1 font-[family-name:var(--font-mono)] text-[10px] text-[var(--ink)] outline-none focus:border-[var(--gold)]"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={applying}
                className="font-[family-name:var(--font-display)] text-[10px] tracking-[0.12em] uppercase text-[var(--gold)] disabled:opacity-50"
              >
                {applying ? "Using…" : "Use"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="font-[family-name:var(--font-display)] text-[10px] tracking-[0.12em] uppercase text-[var(--muted)]"
              >
                Cancel
              </button>
            </div>
            {parseError ? (
              <p className="text-[10px] text-[var(--horde)]">{parseError}</p>
            ) : null}
          </form>
        ) : null}
        {stale ? (
          <p className="mt-0.5 text-[10px] text-[var(--gold)]">
            Custom tree — DPS updates after a local re-sim
          </p>
        ) : null}
      </div>
      <ol className="flex flex-col gap-px">
        {ranking.rows.map((row) => {
          const key = `${ranking.spec.id}:${row.raceId}`;
          const open = selectedKey === key;
          const race = raceById(row.raceId);
          const width = Math.max(6, row.pctOfBest * 100);
          const racials = scoredRacialsFor(ranking.spec.id, row.raceId);
          const shownTalents = override?.talents ?? row.talents;
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
                    {override ? "custom" : row.talentSource}
                    {shownTalents ? ` · ${shownTalents}` : ""}
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
                      {row.kit.items.map((item, index) => (
                        <li key={`${item.slot}-${item.name}-${index}`}>
                          {item.slot}: {item.name}{" "}
                          <span className="text-[var(--gold)]">
                            {item.source === "wowsims" ? "sim" : item.source}
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

type ClassEntry = {
  spec: SpecDef;
  horde: SpecRanking;
  alliance: SpecRanking;
};

function factionLabel(faction: Faction): string {
  switch (faction) {
    case "horde":
      return "Horde";
    case "alliance":
      return "Alliance";
    default:
      return assertNever(faction, "faction");
  }
}

function rankingFor(entry: ClassEntry, faction: Faction): SpecRanking {
  switch (faction) {
    case "horde":
      return entry.horde;
    case "alliance":
      return entry.alliance;
    default:
      return assertNever(faction, "faction");
  }
}

function FactionSpecs({
  ranked,
  faction,
  selectedKey,
  onSelect,
  overrides,
  editingId,
  editorKind,
  draft,
  parseError,
  busySpec,
  openingSimId,
  openEditor,
  openGearEditor,
  openForeverSim,
  setDraft,
  setEditingId,
  setParseError,
  applyDraft,
  onResimSpec,
}: {
  ranked: ClassEntry[];
  faction: Faction;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  overrides: Record<string, TalentOverride>;
  editingId: string | null;
  editorKind: EditorKind;
  draft: string;
  parseError: string | null;
  busySpec: string | null;
  openingSimId: string | null;
  openEditor: (spec: SpecDef, faction: Faction) => void;
  openGearEditor: (spec: SpecDef, faction: Faction) => void;
  openForeverSim: (spec: SpecDef, raceId: string) => void;
  setDraft: (value: string) => void;
  setEditingId: (value: string | null) => void;
  setParseError: (value: string | null) => void;
  applyDraft: (spec: SpecDef) => Promise<void>;
  onResimSpec: (spec: SpecDef) => void;
}) {
  return (
    <section aria-label={factionLabel(faction)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
        {ranked.map((entry) => (
          <SpecColumn
            key={`${faction}-${entry.spec.id}`}
            ranking={rankingFor(entry, faction)}
            faction={faction}
            selectedKey={selectedKey}
            onSelect={onSelect}
            override={overrides[entry.spec.id]}
            editing={
              editingId === `${entry.spec.id}:${faction}` ? editorKind : null
            }
            draft={draft}
            parseError={parseError}
            applying={busySpec === entry.spec.id}
            openingSim={openingSimId === entry.spec.id}
            onEdit={() => openEditor(entry.spec, faction)}
            onOpenSim={() =>
              openForeverSim(
                entry.spec,
                rankingFor(entry, faction).rows[0]?.raceId ?? "",
              )
            }
            onEditGear={() => openGearEditor(entry.spec, faction)}
            onDraft={setDraft}
            onCancel={() => {
              setEditingId(null);
              setParseError(null);
            }}
            onApply={() => void applyDraft(entry.spec)}
            onResim={() => onResimSpec(entry.spec)}
          />
        ))}
      </div>
    </section>
  );
}

const canResim = process.env.NEXT_PUBLIC_CAN_RESIM !== "0";

export function RaceBoard() {
  const [mode, setMode] = useState<BoardMode>("dps");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorKind, setEditorKind] = useState<EditorKind>("talents");
  const [draft, setDraft] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [busySpec, setBusySpec] = useState<string | null>(null);
  const [openingSimId, setOpeningSimId] = useState<string | null>(null);
  const [pendingMob, setPendingMob] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    index: number;
    total: number;
    label: string;
  } | null>(null);
  const [itersText, setItersText] = useState(String(DEFAULT_ITERS));
  const overrideRaw = useSyncExternalStore(
    subscribeOverrides,
    overrideSnapshot,
    () => "{}",
  );
  const itersRaw = useSyncExternalStore(
    subscribeIters,
    iterSnapshot,
    () => String(DEFAULT_ITERS),
  );
  const overrides = useMemo(() => parseOverrides(overrideRaw), [overrideRaw]);
  const iterations = clampIters(Number(itersRaw) || DEFAULT_ITERS);
  const roles = rolesFor(mode);
  const meta = simMeta();
  const dummy = asMobType(pendingMob ?? meta.mobType);

  async function postSim(body?: {
    spec?: string;
    talents?: string;
    mobType?: string;
    simLink?: string;
  }): Promise<boolean> {
    const response = await fetch("/api/sim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mobType: dummy,
        iterations,
        ...body,
      }),
    });
    if (!response.ok || !response.body) {
      setError("Re-sim failed. Needs Go and ../wowsims-forever.");
      return false;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let ok = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.indexOf("\n");
      while (newline >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line) {
          const eventOk = applySimEvent(line);
          if (eventOk === false) {
            return false;
          }
          if (eventOk === "done") {
            ok = true;
          }
        }
        newline = buffer.indexOf("\n");
      }
    }
    return ok;
  }

  function applySimEvent(line: string): boolean | "done" {
    let event: {
      type?: string;
      index?: number;
      total?: number;
      error?: string;
      row?: StoredRow;
      results?: StoredResults;
    };
    try {
      event = JSON.parse(line) as typeof event;
    } catch {
      return true;
    }
    if (event.type === "start") {
      setProgress({
        index: 0,
        total: event.total ?? 0,
        label: `0 / ${event.total ?? 0}`,
      });
      return true;
    }
    if (event.type === "combo" && event.row) {
      upsertSimRow(event.row);
      setVersion((current) => current + 1);
      setProgress({
        index: event.index ?? 0,
        total: event.total ?? 0,
        label: `${event.row.specId} ${event.row.raceId}  ${event.index ?? 0} / ${event.total ?? 0}`,
      });
      return true;
    }
    if (event.type === "done" && event.results) {
      replaceSimResults(event.results);
      setVersion((current) => current + 1);
      setProgress(null);
      return "done";
    }
    if (event.type === "error") {
      setError(event.error || "Re-sim failed. Needs Go and ../wowsims-forever.");
      setProgress(null);
      return false;
    }
    return true;
  }

  async function refreshSims(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await postSim();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Re-sim failed.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function changeMobType(next: string): Promise<void> {
    if (!isMobType(next) || next === dummy) {
      return;
    }
    setPendingMob(next);
    setBusy(true);
    setError(null);
    try {
      const ok = await postSim({ mobType: next });
      if (!ok) {
        setPendingMob(null);
      }
    } catch (cause) {
      setPendingMob(null);
      setError(cause instanceof Error ? cause.message : "Re-sim failed.");
    } finally {
      setBusy(false);
      setPendingMob(null);
      setProgress(null);
    }
  }

  function openEditor(spec: SpecDef, faction: Faction): void {
    const key = `${spec.id}:${faction}`;
    const override = overrides[spec.id];
    setEditingId(key);
    setEditorKind("talents");
    setParseError(null);
    setDraft(calcUrlFor(spec.wowClass, specTalents(spec, override) || null));
  }

  function openGearEditor(spec: SpecDef, faction: Faction): void {
    setEditingId(`${spec.id}:${faction}`);
    setEditorKind("gear");
    setParseError(null);
    setDraft("");
  }

  async function openForeverSim(spec: SpecDef, raceId: string): Promise<void> {
    const fallback = foreverSimPageUrl(spec.id);
    if (!canResim) {
      window.open(fallback, "_blank", "noopener,noreferrer");
      return;
    }
    setOpeningSimId(spec.id);
    try {
      const params = new URLSearchParams({ spec: spec.id });
      if (raceId) {
        params.set("race", raceId);
      }
      const response = await fetch(`/api/sim-link?${params.toString()}`);
      const data = (await response.json()) as { url?: string };
      window.open(
        typeof data.url === "string" && data.url ? data.url : fallback,
        "_blank",
        "noopener,noreferrer",
      );
    } catch {
      window.open(fallback, "_blank", "noopener,noreferrer");
    } finally {
      setOpeningSimId(null);
    }
  }

  async function applyDraft(spec: SpecDef): Promise<void> {
    if (editorKind === "gear") {
      const parsed = parsePastedSimLink(draft, spec.id);
      if (!parsed.ok) {
        setParseError(parsed.error);
        return;
      }
      setEditingId(null);
      setParseError(null);
      if (!canResim) {
        setError("Importing gear needs a local Go + ../wowsims-forever checkout.");
        return;
      }
      setBusySpec(spec.id);
      setError(null);
      try {
        const ok = await postSim({ spec: spec.id, simLink: parsed.url });
        if (ok) {
          const talents = storedTalentsForSpec(spec.id);
          if (talents) {
            writeOverrides({
              ...overrides,
              [spec.id]: {
                talents,
                treeSplit: treeSplitFromTalents(talents),
              },
            });
          }
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Re-sim failed.");
      } finally {
        setBusySpec(null);
        setProgress(null);
      }
      return;
    }
    if (editorKind !== "talents") {
      return assertNever(editorKind, "editor");
    }
    const parsed = parsePastedBuild(draft, spec.wowClass);
    if (!parsed.ok) {
      setParseError(parsed.error);
      return;
    }
    const next = {
      ...overrides,
      [spec.id]: { talents: parsed.talents, treeSplit: parsed.treeSplit },
    };
    writeOverrides(next);
    setEditingId(null);
    setParseError(null);
    if (!canResim) {
      return;
    }
    setBusySpec(spec.id);
    setError(null);
    try {
      await postSim({ spec: spec.id, talents: parsed.talents });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Re-sim failed.");
    } finally {
      setBusySpec(null);
      setProgress(null);
    }
  }

  async function resimSpec(spec: SpecDef): Promise<void> {
    if (!canResim) {
      return;
    }
    setBusySpec(spec.id);
    setError(null);
    try {
      const override = overrides[spec.id];
      await postSim({
        spec: spec.id,
        talents: override?.talents,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Re-sim failed.");
    } finally {
      setBusySpec(null);
      setProgress(null);
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
            className={mode === "tank" ? "text-[var(--ink)]" : "text-[var(--muted)]"}
            onClick={() => setMode("tank")}
          >
            Tank
          </button>
          <Link href="/audit" className="plain-nav">
            Racial audit
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <label className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
            <span className="font-[family-name:var(--font-display)] tracking-[0.12em] uppercase">
              Iters
            </span>
            <input
              type="number"
              min={MIN_ITERS}
              max={MAX_ITERS}
              step={20}
              value={itersText}
              disabled={!canResim || busy || busySpec !== null}
              onChange={(event) => setItersText(event.target.value)}
              onBlur={() => {
                const next = clampIters(Number(itersText) || DEFAULT_ITERS);
                setItersText(String(next));
                writeIters(next);
              }}
              title={`${MIN_ITERS}–${MAX_ITERS} iterations per combo`}
              className="w-16 border border-[var(--line)] bg-black/30 px-1.5 py-1 font-[family-name:var(--font-mono)] text-[11px] text-[var(--ink)] outline-none focus:border-[var(--gold)] disabled:opacity-50"
            />
          </label>
          <label className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
            <span className="font-[family-name:var(--font-display)] tracking-[0.12em] uppercase">
              Dummy
            </span>
            <select
              value={dummy}
              disabled={!canResim || busy || busySpec !== null}
              onChange={(event) => void changeMobType(event.target.value)}
              title={
                canResim
                  ? "Re-sim against this creature type"
                  : "Re-sim locally to change dummy type"
              }
              className="border border-[var(--line)] bg-black/30 px-1.5 py-1 font-[family-name:var(--font-mono)] text-[11px] text-[var(--ink)] outline-none focus:border-[var(--gold)] disabled:opacity-50"
            >
              {MOB_TYPES.map((mob) => (
                <option key={mob} value={mob}>
                  {mobTypeLabel(mob)}
                </option>
              ))}
            </select>
          </label>
          {canResim ? (
            <button
              type="button"
              onClick={() => void refreshSims()}
              disabled={busy || busySpec !== null}
              className="border border-[var(--gold)] px-2 py-1 font-[family-name:var(--font-display)] text-[11px] tracking-[0.12em] uppercase text-[var(--gold)] disabled:opacity-50"
            >
              {busy ? "Re-simming…" : "Refresh all sims"}
            </button>
          ) : null}
        </div>
      </div>
      {error ? (
        <p className="mb-3 text-[11px] text-[var(--horde)]">{error}</p>
      ) : null}
      {busy || busySpec || progress ? (
        <div className="mb-3">
          <p className="text-[11px] text-[var(--gold)]">
            {progress
              ? `${progress.label} · ${iterations} iterations vs ${mobTypeLabel(dummy)}`
              : busySpec
                ? `Re-simming ${busySpec} at ${iterations} iterations.`
                : `Running every class/race/spec at ${iterations} iterations vs ${mobTypeLabel(dummy)}.`}
          </p>
          {progress && progress.total > 0 ? (
            <div className="mt-1 h-1.5 overflow-hidden bg-[var(--line)]">
              <div
                className="h-full bg-[var(--gold)]"
                style={{
                  width: `${Math.min(100, (progress.index / progress.total) * 100)}%`,
                }}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-8" key={version}>
        {BOARD_ROWS.map((row) => {
          const ranked = row.flatMap((specId) => {
            const base = specById(specId);
            if (!roles.includes(base.role)) {
              return [];
            }
            const spec = applyTalentOverride(base, overrides[base.id]);
            return [
              {
                spec,
                horde: { ...rankSpec(spec, "horde"), spec },
                alliance: { ...rankSpec(spec, "alliance"), spec },
              },
            ];
          });
          if (ranked.length === 0) {
            return null;
          }
          const factions: Faction[] = ["horde", "alliance"];
          return (
            <div
              key={row.join("-")}
              className="grid grid-cols-1 gap-5 lg:grid-cols-2"
            >
              {factions.map((faction) => (
                <FactionSpecs
                  key={faction}
                  ranked={ranked}
                  faction={faction}
                  selectedKey={selectedKey}
                  onSelect={(key) =>
                    setSelectedKey((current) => (current === key ? null : key))
                  }
                  overrides={overrides}
                  editingId={editingId}
                  editorKind={editorKind}
                  draft={draft}
                  parseError={parseError}
                  busySpec={busySpec}
                  openingSimId={openingSimId}
                  openEditor={openEditor}
                  openGearEditor={openGearEditor}
                  openForeverSim={(spec, raceId) => {
                    void openForeverSim(spec, raceId);
                  }}
                  setDraft={setDraft}
                  setEditingId={setEditingId}
                  setParseError={setParseError}
                  applyDraft={applyDraft}
                  onResimSpec={(spec) => void resimSpec(spec)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
