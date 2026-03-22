"use client";

import { useCallback, useEffect, useState } from "react";
import type { HymnJSON } from "@/lib/hymn-serialize";
import { readHymnsCache, searchHymnsLocal } from "@/lib/hymns-local-cache";

export type HymnPick = {
  number: number;
  title: string;
  pageUrl: string;
  label: string;
};

type Props = {
  valueLabel: string;
  valueUrl: string;
  onChange: (pick: HymnPick | null) => void;
  allowEmpty?: boolean;
  placeholder?: string;
};

export function HymnSearch({
  valueLabel,
  valueUrl,
  onChange,
  allowEmpty,
  placeholder = "Buscar por número o título…",
}: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<HymnJSON[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    const t = query.trim();
    if (t.length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/hymns/search?q=${encodeURIComponent(t)}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setResults(data);
          setLoading(false);
          return;
        }
      }
    } catch {
      /* red o respuesta inválida → caché */
    }
    const cache = readHymnsCache();
    if (cache) {
      setResults(searchHymnsLocal(cache, t));
    } else {
      setResults([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => search(q), 280);
    return () => clearTimeout(id);
  }, [q, search]);

  function pick(h: HymnJSON) {
    const label = `#${h.number} ${h.title}`.trim();
    onChange({
      number: h.number,
      title: h.title,
      pageUrl: h.pageUrl,
      label,
    });
    setOpen(false);
    setQ("");
    setResults([]);
  }

  return (
    <div className="relative w-full">
      {valueLabel ? (
        <div className="mb-2 flex flex-wrap items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <span className="min-w-0 flex-1 break-words text-foreground">
            {valueLabel}
          </span>
          {valueUrl ? (
            <a
              href={valueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline decoration-neutral-400 underline-offset-2 hover:decoration-foreground dark:decoration-neutral-500"
            >
              Ver en sitio oficial ↗
            </a>
          ) : null}
          <button
            type="button"
            className="ml-auto text-muted text-xs hover:text-foreground"
            onClick={() => onChange(null)}
          >
            Cambiar
          </button>
        </div>
      ) : (
        <>
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            autoComplete="off"
          />
          {allowEmpty && (
            <button
              type="button"
              className="mt-2 text-sm text-muted hover:text-foreground"
              onClick={() => onChange(null)}
            >
              Omitir este himno
            </button>
          )}
          {open && (results.length > 0 || loading) && (
            <ul
              className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card py-1 shadow-lg"
              role="listbox"
            >
              {loading ? (
                <li className="px-3 py-2 text-sm text-muted">Buscando…</li>
              ) : (
                results.map((h) => (
                  <li key={h.id} role="option" aria-selected={false}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50"
                      onClick={() => pick(h)}
                    >
                      <span className="text-muted">#{h.number}</span>{" "}
                      {h.title}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
