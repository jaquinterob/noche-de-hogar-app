import type { FamilyHomeEvening, FamilyMember } from "@/lib/types/fhe";

const PREFIX = "noche-de-hogar:v1:";
const KEY_MEMBERS = `${PREFIX}members`;
const KEY_AGENDAS = `${PREFIX}agendas`;
const KEY_FAMILY_LASTNAME = `${PREFIX}family-lastname`;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (raw == null || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readLegacyLastName(): string {
  if (typeof window === "undefined") return "";
  const raw = localStorage.getItem(KEY_FAMILY_LASTNAME);
  if (raw == null || raw === "") return "";
  try {
    const p = JSON.parse(raw) as unknown;
    if (typeof p === "string") return p.trim();
  } catch {
    /* texto plano */
  }
  return raw.trim();
}

/** Lee el bundle v1 (localStorage) para migrar a MongoDB. */
export function readLegacyFamilyBundle(): {
  lastName: string;
  members: FamilyMember[];
  agendas: FamilyHomeEvening[];
} {
  if (typeof window === "undefined") {
    return { lastName: "", members: [], agendas: [] };
  }
  return {
    lastName: readLegacyLastName(),
    members: safeParse<FamilyMember[]>(localStorage.getItem(KEY_MEMBERS), []),
    agendas: safeParse<FamilyHomeEvening[]>(
      localStorage.getItem(KEY_AGENDAS),
      [],
    ),
  };
}

export function clearLegacyV1Storage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY_MEMBERS);
  localStorage.removeItem(KEY_AGENDAS);
  localStorage.removeItem(KEY_FAMILY_LASTNAME);
}

export function hasLegacyV1Data(): boolean {
  const b = readLegacyFamilyBundle();
  return Boolean(
    b.lastName.trim() || b.members.length > 0 || b.agendas.length > 0,
  );
}
