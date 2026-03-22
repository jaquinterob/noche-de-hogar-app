"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useFamilyData } from "@/components/FamilyDataProvider";
import {
  buildSessionTimingReport,
  formatDurationEs,
  hasAnySessionTiming,
} from "@/lib/session-timing";

export default function AgendasPage() {
  const { agendas, loading } = useFamilyData();

  const list = useMemo(() => {
    const a = [...agendas];
    a.sort(
      (x, y) => new Date(y.date).getTime() - new Date(x.date).getTime(),
    );
    return a;
  }, [agendas]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Agendas</h1>
      {loading && list.length === 0 ? (
        <p className="text-muted">Cargando…</p>
      ) : null}
      {list.length === 0 && !loading ? (
        <p className="text-muted">
          No hay agendas aún.{" "}
          <Link
            href="/planificar"
            className="text-foreground underline decoration-neutral-400 underline-offset-2 dark:decoration-neutral-500"
          >
            Planificar
          </Link>
        </p>
      ) : null}
      {list.length > 0 ? (
        <ul className="space-y-3">
          {list.map((a) => (
            <li key={a.id}>
              <Link
                href={`/agenda/${a.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-4 transition hover:border-neutral-400 dark:hover:border-neutral-500"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {new Date(a.date).toLocaleDateString("es", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-muted">Preside: {a.preside}</p>
                  {(() => {
                    if (!hasAnySessionTiming(a)) return null;
                    const r = buildSessionTimingReport(a);
                    const ms =
                      r.durationUntilClosedMs ?? r.durationUntilLastStepMs;
                    if (ms == null) return null;
                    return (
                      <p className="mt-1 text-xs text-muted">
                        Duración registrada: {formatDurationEs(ms)}
                      </p>
                    );
                  })()}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    a.status === "completed"
                      ? "bg-muted/30 text-muted"
                      : "bg-neutral-200 text-foreground dark:bg-neutral-800 dark:text-neutral-100"
                  }`}
                >
                  {a.status === "completed" ? "Realizada" : "Planificada"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
