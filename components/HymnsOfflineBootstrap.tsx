"use client";

import { useEffect, useRef } from "react";
import { writeHymnsCache } from "@/lib/hymns-local-cache";

/**
 * Cuando hay red, descarga el catálogo completo y lo guarda en localStorage
 * para búsqueda y listados sin conexión.
 */
export function HymnsOfflineBootstrap() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    void (async () => {
      try {
        if (!navigator.onLine) return;
        const res = await fetch("/api/hymns/catalog");
        if (!res.ok) return;
        const data = await res.json();
        if (data?.error || !Array.isArray(data) || data.length === 0) return;
        writeHymnsCache(data);
      } catch {
        /* mantener caché anterior */
      }
    })();
  }, []);

  return null;
}
