import type { FamilyHomeEvening, FamilyMember } from "@/lib/types/fhe";

const SNAPSHOT_KEY = "noche-de-hogar:v3:family-snapshot";

export type FamilySnapshotV3 = {
  v: 3;
  familyId: string;
  lastName: string;
  members: FamilyMember[];
  agendas: FamilyHomeEvening[];
  savedAt: string;
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (raw == null || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function readFamilySnapshot(): FamilySnapshotV3 | null {
  if (typeof window === "undefined") return null;
  const p = safeParse<Partial<FamilySnapshotV3> | null>(
    localStorage.getItem(SNAPSHOT_KEY),
    null,
  );
  if (!p || p.v !== 3 || !p.familyId) return null;
  return {
    v: 3,
    familyId: p.familyId,
    lastName: p.lastName ?? "",
    members: Array.isArray(p.members) ? p.members : [],
    agendas: Array.isArray(p.agendas) ? p.agendas : [],
    savedAt: p.savedAt ?? "",
  };
}

export function writeFamilySnapshot(data: {
  familyId: string;
  lastName: string;
  members: FamilyMember[];
  agendas: FamilyHomeEvening[];
}): void {
  if (typeof window === "undefined") return;
  try {
    const snap: FamilySnapshotV3 = {
      v: 3,
      ...data,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snap));
  } catch (e) {
    console.warn("No se pudo guardar copia local de familia:", e);
  }
}

export function clearFamilySnapshot(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SNAPSHOT_KEY);
}
