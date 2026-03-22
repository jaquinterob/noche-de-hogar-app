import { getSessionRows } from "@/lib/session-steps";
import type { CompletedStepKey, FamilyHomeEvening } from "@/lib/types/fhe";

export function formatDurationEs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h} h ${m % 60} min`;
  if (m > 0) return `${m} min ${s % 60} s`;
  if (s > 0) return `${s} s`;
  return "0 s";
}

export function formatTimeEs(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("es", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function formatDateTimeEs(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export type StepTimingRow = {
  key: CompletedStepKey;
  label: string;
  completedAtIso?: string;
  /** Tiempo desde el inicio de sesión o desde el momento anterior marcado. */
  durationMs?: number;
};

export type SessionTimingReport = {
  orderedSteps: StepTimingRow[];
  sessionStartedAt?: string;
  /** Último paso marcado (ISO). */
  lastStepCompletedAt?: string;
  /** Cierre oficial en la app (marcar realizada). */
  completedAt?: string;
  /** Desde sessionStartedAt hasta último paso hecho. */
  durationUntilLastStepMs?: number;
  /** Desde sessionStartedAt hasta completedAt (si existe). */
  durationUntilClosedMs?: number;
};

export function buildSessionTimingReport(
  agenda: FamilyHomeEvening,
): SessionTimingReport {
  const rows = getSessionRows(agenda);
  const keys = rows.map((r) => r.key);
  const startMs = agenda.sessionStartedAt
    ? Date.parse(agenda.sessionStartedAt)
    : NaN;

  const orderedSteps: StepTimingRow[] = [];
  let prevBoundaryMs = Number.isFinite(startMs) ? startMs : NaN;

  for (const row of rows) {
    const key = row.key;
    const iso = agenda.stepCompletedAt?.[key];
    let durationMs: number | undefined;

    if (iso) {
      const endMs = Date.parse(iso);
      if (Number.isFinite(endMs)) {
        if (Number.isFinite(prevBoundaryMs) && endMs >= prevBoundaryMs) {
          durationMs = endMs - prevBoundaryMs;
        }
        prevBoundaryMs = endMs;
      }
    }

    orderedSteps.push({
      key,
      label: row.label,
      completedAtIso: iso,
      durationMs,
    });
  }

  const completedTimes = keys
    .map((k) => agenda.stepCompletedAt?.[k])
    .filter((x): x is string => !!x)
    .map((s) => Date.parse(s))
    .filter((n) => Number.isFinite(n));
  const lastStepCompletedAt =
    completedTimes.length > 0
      ? new Date(Math.max(...completedTimes)).toISOString()
      : undefined;

  const lastMs = lastStepCompletedAt ? Date.parse(lastStepCompletedAt) : NaN;
  let durationUntilLastStepMs: number | undefined;
  if (Number.isFinite(startMs) && Number.isFinite(lastMs) && lastMs >= startMs) {
    durationUntilLastStepMs = lastMs - startMs;
  }

  const closedMs =
    agenda.status === "completed" && agenda.completedAt
      ? Date.parse(agenda.completedAt)
      : NaN;
  let durationUntilClosedMs: number | undefined;
  if (
    Number.isFinite(startMs) &&
    Number.isFinite(closedMs) &&
    closedMs >= startMs
  ) {
    durationUntilClosedMs = closedMs - startMs;
  }

  return {
    orderedSteps,
    sessionStartedAt: agenda.sessionStartedAt,
    lastStepCompletedAt,
    completedAt: agenda.completedAt,
    durationUntilLastStepMs,
    durationUntilClosedMs,
  };
}

export function hasAnySessionTiming(agenda: FamilyHomeEvening): boolean {
  if (agenda.sessionStartedAt) return true;
  const sc = agenda.stepCompletedAt;
  return !!sc && Object.keys(sc).length > 0;
}
