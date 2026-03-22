import type { FamilyHomeEvening, FamilyMember } from "@/lib/types/fhe";

const QUEUE_KEY = "noche-de-hogar:v3:family-sync-queue";

export type FamilySyncOp =
  | {
      id: string;
      kind: "saveAgenda";
      familyId: string;
      agenda: FamilyHomeEvening;
    }
  | { id: string; kind: "deleteAgenda"; familyId: string; agendaId: string }
  | {
      id: string;
      kind: "patchFamily";
      familyId: string;
      body: { lastName?: string; members?: FamilyMember[] };
    };

function readQueue(): FamilySyncOp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? (p as FamilySyncOp[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(ops: FamilySyncOp[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(ops));
  } catch (e) {
    console.warn("Cola de sincronización llena:", e);
  }
}

export function enqueueFamilySync(op: FamilySyncOp): void {
  const q = readQueue();
  q.push(op);
  writeQueue(q);
}

/** Evita muchas entradas del mismo guardado de agenda. */
function dedupeBeforeSaveAgenda(
  q: FamilySyncOp[],
  familyId: string,
  agendaId: string,
): FamilySyncOp[] {
  return q.filter(
    (o) =>
      !(
        o.kind === "saveAgenda" &&
        o.familyId === familyId &&
        o.agenda.id === agendaId
      ),
  );
}

function dedupeBeforeDelete(
  q: FamilySyncOp[],
  familyId: string,
  agendaId: string,
): FamilySyncOp[] {
  return q.filter(
    (o) =>
      !(
        (o.kind === "saveAgenda" &&
          o.familyId === familyId &&
          o.agenda.id === agendaId) ||
        (o.kind === "deleteAgenda" &&
          o.familyId === familyId &&
          o.agendaId === agendaId)
      ),
  );
}

function dedupeBeforePatch(q: FamilySyncOp[], familyId: string): FamilySyncOp[] {
  return q.filter(
    (o) => !(o.kind === "patchFamily" && o.familyId === familyId),
  );
}

export function dequeueFamilySync(id: string): void {
  writeQueue(readQueue().filter((o) => o.id !== id));
}

export function peekFamilySyncQueue(): FamilySyncOp[] {
  return readQueue();
}

export function clearFamilySyncQueue(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(QUEUE_KEY);
}

function newOpId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function enqueueSaveAgenda(
  familyId: string,
  agenda: FamilyHomeEvening,
): string {
  const id = newOpId();
  const q = dedupeBeforeSaveAgenda(readQueue(), familyId, agenda.id);
  q.push({ id, kind: "saveAgenda", familyId, agenda });
  writeQueue(q);
  return id;
}

export function enqueueDeleteAgenda(familyId: string, agendaId: string): string {
  const id = newOpId();
  const q = dedupeBeforeDelete(readQueue(), familyId, agendaId);
  q.push({ id, kind: "deleteAgenda", familyId, agendaId });
  writeQueue(q);
  return id;
}

export function enqueuePatchFamily(
  familyId: string,
  body: { lastName?: string; members?: FamilyMember[] },
): string {
  const q = readQueue();
  const existing = q.find(
    (o): o is Extract<FamilySyncOp, { kind: "patchFamily" }> =>
      o.kind === "patchFamily" && o.familyId === familyId,
  );
  const mergedBody = existing ? { ...existing.body, ...body } : body;
  const rest = dedupeBeforePatch(q, familyId);
  const id = newOpId();
  rest.push({ id, kind: "patchFamily", familyId, body: mergedBody });
  writeQueue(rest);
  return id;
}

/** Ejecuta la cola contra la API (mejor esfuerzo). */
export async function flushFamilySyncQueue(): Promise<void> {
  const ops = readQueue();
  if (ops.length === 0) return;

  const remaining: FamilySyncOp[] = [];

  for (const op of ops) {
    try {
      if (op.kind === "saveAgenda") {
        const res = await fetch(`/api/family/${op.familyId}/agendas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(op.agenda),
        });
        if (!res.ok) remaining.push(op);
        continue;
      }
      if (op.kind === "deleteAgenda") {
        const res = await fetch(
          `/api/family/${op.familyId}/agendas/${encodeURIComponent(op.agendaId)}`,
          { method: "DELETE" },
        );
        if (!res.ok) remaining.push(op);
        continue;
      }
      if (op.kind === "patchFamily") {
        const res = await fetch(`/api/family/${op.familyId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(op.body),
        });
        if (!res.ok) remaining.push(op);
        continue;
      }
    } catch {
      remaining.push(op);
    }
  }

  writeQueue(remaining);
}
