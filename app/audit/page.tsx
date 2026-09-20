import { scoredAuditRows } from "@/lib/data/racial-audit";
import { SiteFooter } from "@/components/site-footer";
import Link from "next/link";

export default function AuditPage() {
  const rows = scoredAuditRows();
  const disputed = rows.filter((row) => row.disputed);
  const locked = rows.filter((row) => !row.disputed);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6">
      <p className="font-[family-name:var(--font-display)] text-[11px] tracking-[0.28em] uppercase text-[var(--gold)]">
        <Link href="/">Rankings</Link> · Audit
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-wide md:text-4xl">
        Locked racials
      </h1>

      <h2 className="mt-6 font-[family-name:var(--font-display)] text-lg tracking-[0.16em] uppercase">
        Scored
      </h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-[11px] tracking-wider text-[var(--muted)] uppercase">
              <th className="py-1.5 pr-3 font-normal">Racial</th>
              <th className="py-1.5 pr-3 font-normal">Race</th>
              <th className="py-1.5 pr-3 font-normal">Locked number</th>
              <th className="py-1.5 font-normal">Sim</th>
            </tr>
          </thead>
          <tbody>
            {locked.map((row) => (
              <tr key={row.id} className="border-b border-[var(--line)]/60 align-top">
                <td className="py-2 pr-3">{row.name}</td>
                <td className="py-2 pr-3 text-[var(--muted)]">{row.raceId}</td>
                <td className="py-2 pr-3">{row.chosen}</td>
                <td className="py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--gold)]">
                  {row.simUses}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {disputed.length ? (
        <>
          <h2 className="mt-10 font-[family-name:var(--font-display)] text-lg tracking-[0.16em] uppercase text-[var(--gold)]">
            Still disputed
          </h2>
          <div className="mt-3 flex flex-col gap-4">
            {disputed.map((row) => (
              <article key={row.id} className="border-t border-[var(--line)] pt-3">
                <h3 className="font-[family-name:var(--font-display)] text-xl">
                  {row.name}
                </h3>
                <p className="mt-1 text-sm">{row.chosen}</p>
                {row.disputeNote ? (
                  <p className="mt-1 text-sm text-[var(--muted)]">{row.disputeNote}</p>
                ) : null}
                <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--gold)]">
                  {row.simUses}
                </p>
              </article>
            ))}
          </div>
        </>
      ) : null}
      <SiteFooter />
    </div>
  );
}
