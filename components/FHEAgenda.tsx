import Link from "next/link";
import type { FamilyHomeEvening } from "@/lib/types/fhe";

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function FHEAgenda({
  agenda,
  showSeguimientoCta,
}: {
  agenda: FamilyHomeEvening;
  showSeguimientoCta?: boolean;
}) {
  const rows: { k: string; v: string; url?: string }[] = [
    { k: "Fecha", v: fmtDate(agenda.date) },
    { k: "Preside", v: agenda.preside },
    { k: "Dirige", v: agenda.conducts },
    { k: "Bienvenida", v: agenda.welcomeBy },
    {
      k: "Primer himno",
      v: agenda.openingHymn,
      url: agenda.openingHymnUrl || undefined,
    },
    { k: "Primera oración", v: agenda.openingPrayer },
    { k: "Pensamiento espiritual", v: agenda.spiritualThoughtBy },
    ...(agenda.optionalHymn || agenda.optionalHymnUrl
      ? [
          {
            k: "Segundo himno",
            v: agenda.optionalHymn || "—",
            url: agenda.optionalHymnUrl || undefined,
          },
        ]
      : []),
    { k: "Mensaje principal", v: agenda.mainMessageBy },
    {
      k: "Actividad",
      v: agenda.activityDescription?.trim()
        ? `${agenda.activityBy} — ${agenda.activityDescription}`
        : agenda.activityBy,
    },
    {
      k: "Último himno",
      v: agenda.closingHymn,
      url: agenda.closingHymnUrl || undefined,
    },
    { k: "Oración final", v: agenda.closingPrayer },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Noche de Hogar</p>
          <h1 className="text-2xl font-semibold capitalize text-foreground">
            {fmtDate(agenda.date)}
          </h1>
          {agenda.status === "completed" && agenda.completedAt ? (
            <p className="mt-1 text-xs text-muted">
              Realizada el{" "}
              {new Date(agenda.completedAt).toLocaleString("es")}
            </p>
          ) : null}
        </div>
        {showSeguimientoCta ? (
          <Link
            href={`/agenda/${agenda.id}/seguimiento`}
            className="rounded-xl bg-accent px-5 py-3 text-center text-sm font-semibold text-accent-foreground shadow-md transition hover:opacity-95"
          >
            Iniciar / Seguir reunión
          </Link>
        ) : null}
      </div>

      <ul className="space-y-4 rounded-xl border border-border bg-card p-4">
        {rows.map((r) => (
          <li
            key={r.k}
            className="border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {r.k}
            </p>
            <p className="mt-1 break-words text-foreground">{r.v || "—"}</p>
            {r.url ? (
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm font-medium text-foreground underline decoration-neutral-400 underline-offset-2 hover:decoration-foreground dark:decoration-neutral-500"
              >
                Ver en sitio oficial ↗
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
