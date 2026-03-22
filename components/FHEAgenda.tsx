import Link from "next/link";
import {
  buildSessionTimingReport,
  formatDateTimeEs,
  formatDurationEs,
  formatTimeEs,
  hasAnySessionTiming,
} from "@/lib/session-timing";
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

      {hasAnySessionTiming(agenda) ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Tiempos de la reunión
          </p>
          {(() => {
            const r = buildSessionTimingReport(agenda);
            return (
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-border pb-3">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                      Inicio (seguimiento)
                    </p>
                    <p className="font-medium text-foreground">
                      {r.sessionStartedAt
                        ? formatDateTimeEs(r.sessionStartedAt)
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                      Último momento marcado
                    </p>
                    <p className="font-medium text-foreground">
                      {r.lastStepCompletedAt
                        ? formatDateTimeEs(r.lastStepCompletedAt)
                        : "—"}
                    </p>
                  </div>
                  {agenda.status === "completed" && r.completedAt ? (
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                        Cierre en app
                      </p>
                      <p className="font-medium text-foreground">
                        {formatDateTimeEs(r.completedAt)}
                      </p>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  {r.durationUntilLastStepMs != null ? (
                    <p className="text-foreground">
                      <span className="text-muted">Hasta completar guion: </span>
                      <span className="font-semibold tabular-nums">
                        {formatDurationEs(r.durationUntilLastStepMs)}
                      </span>
                    </p>
                  ) : null}
                  {r.durationUntilClosedMs != null ? (
                    <p className="text-foreground">
                      <span className="text-muted">Hasta marcar realizada: </span>
                      <span className="font-semibold tabular-nums">
                        {formatDurationEs(r.durationUntilClosedMs)}
                      </span>
                    </p>
                  ) : null}
                </div>
                <ul className="space-y-2 border-t border-border pt-3">
                  {r.orderedSteps.map((row) => (
                    <li
                      key={row.key}
                      className="flex flex-wrap items-baseline justify-between gap-2 text-xs"
                    >
                      <span className="font-medium text-foreground">
                        {row.label}
                      </span>
                      <span className="text-right text-muted">
                        {row.completedAtIso ? (
                          <>
                            <span className="tabular-nums">
                              {formatTimeEs(row.completedAtIso)}
                            </span>
                            {row.durationMs != null ? (
                              <span className="ml-2 text-foreground">
                                · {formatDurationEs(row.durationMs)}
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <span>—</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}
        </div>
      ) : null}

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
