import type { HymnJSON } from "@/lib/hymn-serialize";
import {
  filterHymnsCatalogLocal,
  readHymnsCache,
  writeHymnsCache,
} from "@/lib/hymns-local-cache";

/**
 * Catálogo para UI: intenta red; si falla o hay error, usa JSON en localStorage.
 */
export async function loadHymnsCatalogForUi(
  q: string,
): Promise<{ list: HymnJSON[]; error: string }> {
  const qt = q.trim();
  const url =
    qt.length > 0
      ? `/api/hymns/catalog?q=${encodeURIComponent(qt)}`
      : "/api/hymns/catalog";

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("http");
    const data = (await res.json()) as unknown;
    if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      (data as { error?: string }).error
    ) {
      throw new Error("api");
    }
    if (Array.isArray(data)) {
      if (!qt && data.length > 0) {
        writeHymnsCache(data as HymnJSON[]);
      }
      return { list: data as HymnJSON[], error: "" };
    }
  } catch {
    /* caché */
  }

  const cache = readHymnsCache();
  if (cache) {
    return {
      list: filterHymnsCatalogLocal(cache, qt),
      error: "",
    };
  }

  return {
    list: [],
    error:
      "Sin datos locales. Conéctate al menos una vez para descargar el catálogo de himnos.",
  };
}
