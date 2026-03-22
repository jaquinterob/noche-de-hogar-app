"use client";

import { useCallback, useEffect, useState } from "react";
import type { HymnJSON } from "@/lib/hymn-serialize";
import { loadHymnsCatalogForUi } from "@/lib/hymns-catalog-load";

export function HimnosCatalogPublic() {
  const [filter, setFilter] = useState("");
  const [list, setList] = useState<HymnJSON[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCatalog = useCallback(async (q: string) => {
    setLoading(true);
    setError("");
    const { list: rows, error: err } = await loadHymnsCatalogForUi(q);
    setList(rows);
    setError(err);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadCatalog(filter), filter ? 280 : 0);
    return () => clearTimeout(t);
  }, [filter, loadCatalog]);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-foreground">
        Buscar por número o título
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="p. ej. 100 o amor"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
        />
      </label>

      {error ? (
        <p className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : (
        <ul className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto rounded-xl border border-border bg-card p-3">
          {list.length === 0 ? (
            <li className="text-sm text-muted">
              No hay himnos que coincidan. Si el catálogo está vacío, quien
              administre puede cargarlo con la clave (scraping o terminal).
            </li>
          ) : (
            list.map((h) => (
              <li
                key={h.id}
                className="flex flex-wrap items-start justify-between gap-3 border-b border-border py-2 last:border-0"
              >
                <span className="min-w-0 flex-1 break-words font-medium text-foreground">
                  <span className="text-muted">#{h.number}</span> {h.title}
                </span>
                {h.pageUrl ? (
                  <a
                    href={h.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-sm text-foreground underline decoration-neutral-400 underline-offset-2 hover:decoration-foreground dark:decoration-neutral-500"
                  >
                    Sitio oficial ↗
                  </a>
                ) : null}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
