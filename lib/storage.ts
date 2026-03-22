import type { FamilyHomeEvening, FamilyMember } from "@/lib/types/fhe";

const PREFIX = "noche-de-hogar:v1:";
const KEY_MEMBERS = `${PREFIX}members`;
const KEY_AGENDAS = `${PREFIX}agendas`;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (raw == null || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getMembers(): FamilyMember[] {
  if (typeof window === "undefined") return [];
  return safeParse<FamilyMember[]>(localStorage.getItem(KEY_MEMBERS), []);
}

export function setMembers(members: FamilyMember[]): void {
  localStorage.setItem(KEY_MEMBERS, JSON.stringify(members));
}

export function getAgendas(): FamilyHomeEvening[] {
  if (typeof window === "undefined") return [];
  return safeParse<FamilyHomeEvening[]>(localStorage.getItem(KEY_AGENDAS), []);
}

export function setAgendas(agendas: FamilyHomeEvening[]): void {
  localStorage.setItem(KEY_AGENDAS, JSON.stringify(agendas));
}

export function getAgendaById(id: string): FamilyHomeEvening | undefined {
  return getAgendas().find((a) => a.id === id);
}

export function upsertAgenda(agenda: FamilyHomeEvening): void {
  const list = getAgendas();
  const i = list.findIndex((a) => a.id === agenda.id);
  if (i >= 0) list[i] = agenda;
  else list.push(agenda);
  setAgendas(list);
}

export function deleteAgenda(id: string): void {
  setAgendas(getAgendas().filter((a) => a.id !== id));
}

export function markAgendaCompleted(id: string): void {
  const a = getAgendaById(id);
  if (!a || a.status === "completed") return;
  upsertAgenda({
    ...a,
    status: "completed",
    completedAt: new Date().toISOString(),
  });
}

export function updateAgendaCompletedSteps(
  id: string,
  steps: FamilyHomeEvening["completedSteps"],
): void {
  const a = getAgendaById(id);
  if (!a || a.status === "completed") return;
  upsertAgenda({ ...a, completedSteps: { ...a.completedSteps, ...steps } });
}
