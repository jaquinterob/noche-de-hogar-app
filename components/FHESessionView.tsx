"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  getSessionRows,
  type SessionRow,
} from "@/lib/session-steps";
import {
  getAgendaById,
  markAgendaCompleted,
  updateAgendaCompletedSteps,
} from "@/lib/storage";
import type {
  CompletedStepKey,
  CompletedSteps,
  FamilyHomeEvening,
} from "@/lib/types/fhe";

export function FHESessionView({ agenda }: { agenda: FamilyHomeEvening }) {
  const router = useRouter();
  const [local, setLocal] = useState(agenda);
  const rows = useMemo(() => getSessionRows(local), [local]);
  const planned = local.status === "planned";

  const steps = useMemo(() => rows.map((r) => r.key), [rows]);
  const doneCount = steps.filter(
    (k) => local.completedSteps?.[k],
  ).length;
  const total = steps.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const allDone = total > 0 && doneCount === total;

  function toggle(key: CompletedStepKey, checked: boolean) {
    if (!planned) return;
    const nextSteps: CompletedSteps = {
      ...local.completedSteps,
      [key]: checked,
    };
    const next = { ...local, completedSteps: nextSteps };
    setLocal(next);
    updateAgendaCompletedSteps(local.id, { [key]: checked });
  }

  function confirmComplete() {
    if (
      !confirm(
        "¿Marcar esta Noche de Hogar como realizada? No podrás editarla ni borrarla después.",
      )
    ) {
      return;
    }
    markAgendaCompleted(local.id);
    const fresh = getAgendaById(local.id);
    if (fresh) setLocal(fresh);
    router.refresh();
  }

  return (
    <div className="min-h-[70vh] space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-neutral-200/40 p-6 shadow-lg dark:via-card dark:to-neutral-800/60">
        <p className="text-sm font-medium text-foreground">Seguimiento en vivo</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Esta noche en familia
        </h1>
        <p className="mt-2 text-sm text-muted">
          {new Date(local.date).toLocaleDateString("es", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs text-muted">
            <span>Progreso</span>
            <span>
              {doneCount} / {total}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-500 ease-out dark:bg-neutral-200"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {allDone && planned && (
          <div
            className="mt-4 rounded-lg bg-neutral-200 px-3 py-2 text-center text-sm font-medium text-foreground dark:bg-neutral-800"
            role="status"
          >
            ¡Has completado todos los momentos! Puedes cerrar la reunión.
          </div>
        )}
      </div>

      <ol className="space-y-3">
        {rows.map((row, i) => (
          <SessionRowItem
            key={row.key}
            index={i + 1}
            row={row}
            agenda={local}
            planned={planned}
            checked={!!local.completedSteps?.[row.key]}
            onToggle={(c) => toggle(row.key, c)}
          />
        ))}
      </ol>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/agenda/${local.id}`}
          className="text-center text-sm text-muted hover:text-foreground"
        >
          ← Ver agenda completa
        </Link>
        {planned ? (
          <button
            type="button"
            onClick={confirmComplete}
            className="rounded-xl border border-border bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-sm transition hover:opacity-90 dark:bg-neutral-100 dark:text-neutral-950"
          >
            Marcar como realizada
          </button>
        ) : (
          <p className="text-sm text-muted">
            Esta reunión está en el histórico (solo lectura).
          </p>
        )}
      </div>
    </div>
  );
}

function SessionRowItem({
  index,
  row,
  agenda,
  planned,
  checked,
  onToggle,
}: {
  index: number;
  row: SessionRow;
  agenda: FamilyHomeEvening;
  planned: boolean;
  checked: boolean;
  onToggle: (c: boolean) => void;
}) {
  const detail = row.detail(agenda);
  const url = row.hymnUrl?.(agenda);

  return (
    <li
      className={`flex gap-4 rounded-xl border p-4 transition-colors ${
        checked
          ? "border-neutral-400 bg-neutral-100 dark:border-neutral-500 dark:bg-neutral-800/80"
          : "border-border bg-card"
      }`}
    >
      <div className="flex min-h-[44px] min-w-[44px] items-center justify-center">
        {planned ? (
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onToggle(e.target.checked)}
            className="h-6 w-6 rounded border-border accent-neutral-900 focus:ring-ring dark:accent-neutral-200"
            aria-label={`Marcar: ${row.label}`}
          />
        ) : (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-border text-sm font-bold text-muted"
            aria-hidden
          >
            {checked ? "✓" : index}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-xs font-bold text-muted">{index}.</span>
          <span className="font-semibold text-foreground">{row.label}</span>
        </div>
        <p className="mt-1 break-words text-sm text-foreground/90">
          {detail}
        </p>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex min-h-[44px] items-center text-sm font-semibold text-foreground underline decoration-neutral-400 underline-offset-2 hover:decoration-foreground dark:decoration-neutral-500"
          >
            Abrir himno en sitio oficial ↗
          </a>
        ) : null}
      </div>
    </li>
  );
}
