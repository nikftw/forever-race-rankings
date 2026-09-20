import { RaceBoard } from "@/components/race-board";
import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-5 md:px-6 md:py-6">
      <header className="mb-5 max-w-3xl">
        <p className="font-[family-name:var(--font-display)] text-[11px] tracking-[0.28em] uppercase text-[var(--gold)]">
          WoW Forever · Level 60 · <Link href="/audit">Audit</Link>
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl leading-tight tracking-wide md:text-4xl">
          Race rankings
        </h1>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Combat from{" "}
          <a href="https://github.com/ElliotWood/Forever">
            ElliotWood/Forever
          </a>{" "}
          (MIT). Each ranking is a full 300-iteration raid sim. Racial numbers
          follow the{" "}
          <Link href="/audit">locked audit</Link>.
        </p>
      </header>
      <RaceBoard />
    </div>
  );
}
