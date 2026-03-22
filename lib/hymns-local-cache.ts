import type { HymnJSON } from "@/lib/hymn-serialize";

const CACHE_KEY = "noche-de-hogar:v3:hymns-cache";

export type HymnsCachePayload = {
  v: 3;
  updatedAt: string;
  /** Lista completa para búsqueda / catálogo offline */
  hymns: HymnJSON[];
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (raw == null || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Himnos sin letras ni URLs largas (caben mejor en localStorage). */
export function slimHymnForCache(h: HymnJSON): HymnJSON {
  return {
    ...h,
    lyrics: "",
    audioUrl: "",
    sheetMusicUrl: "",
  };
}

export function readHymnsCache(): HymnJSON[] | null {
  if (typeof window === "undefined") return null;
  const p = safeParse<Partial<HymnsCachePayload> | null>(
    localStorage.getItem(CACHE_KEY),
    null,
  );
  if (!p || p.v !== 3 || !Array.isArray(p.hymns) || p.hymns.length === 0) {
    return null;
  }
  return p.hymns;
}

export function writeHymnsCache(hymns: HymnJSON[]): boolean {
  if (typeof window === "undefined") return false;
  const payload: HymnsCachePayload = {
    v: 3,
    updatedAt: new Date().toISOString(),
    hymns,
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    try {
      const slim = hymns.map(slimHymnForCache);
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          v: 3,
          updatedAt: new Date().toISOString(),
          hymns: slim,
        } satisfies HymnsCachePayload),
      );
      return true;
    } catch (e2) {
      console.warn("No se pudo guardar caché de himnos:", e2);
      return false;
    }
  }
}

function escapeRx(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Misma lógica aproximada que GET /api/hymns/search (límite 50). */
export function searchHymnsLocal(all: HymnJSON[], q: string): HymnJSON[] {
  const t = q.trim();
  if (t.length < 1) return [];

  const LIMIT = 50;

  if (/^\d+$/.test(t)) {
    const num = parseInt(t, 10);
    const byNum = all
      .filter((h) => h.number >= num && h.number < num + 100)
      .sort((a, b) => a.number - b.number);
    const filtered = byNum.filter((h) => String(h.number).startsWith(t));
    const rows = filtered.length > 0 ? filtered : byNum;
    return rows.slice(0, LIMIT);
  }

  let rx: RegExp;
  try {
    rx = new RegExp(escapeRx(t), "i");
  } catch {
    return [];
  }

  return all
    .filter(
      (h) => rx.test(h.title) || (h.lyrics && rx.test(h.lyrics)),
    )
    .sort((a, b) => a.number - b.number)
    .slice(0, LIMIT);
}

/** Igual que catálogo servidor con query (número / título / letra). */
export function filterHymnsCatalogLocal(all: HymnJSON[], q: string): HymnJSON[] {
  const t = q.trim();
  if (!t) {
    return [...all].sort((a, b) => a.number - b.number);
  }
  if (/^\d+$/.test(t)) {
    return all
      .filter((h) => String(h.number).startsWith(t))
      .sort((a, b) => a.number - b.number);
  }
  let rx: RegExp;
  try {
    rx = new RegExp(escapeRx(t), "i");
  } catch {
    return [];
  }
  return all
    .filter(
      (h) => rx.test(h.title) || (h.lyrics && rx.test(h.lyrics)),
    )
    .sort((a, b) => a.number - b.number);
}
