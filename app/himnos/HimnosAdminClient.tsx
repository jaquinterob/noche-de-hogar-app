"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { HymnJSON } from "@/lib/hymn-serialize";

export function HimnosAdminClient() {
  const router = useRouter();
  const [count, setCount] = useState<number | null>(null);
  const [list, setList] = useState<HymnJSON[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMsg("");
    try {
      const [st, all] = await Promise.all([
        fetch("/api/hymns/stats", { credentials: "include" }),
        fetch("/api/hymns", { credentials: "include" }),
      ]);
      if (st.status === 401 || all.status === 401) {
        router.replace("/himnos/acceso");
        return;
      }
      const sj = await st.json();
      if (typeof sj.count === "number") setCount(sj.count);
      const aj = await all.json();
      setList(Array.isArray(aj) ? aj : []);
      if (aj?.error) setMsg(aj.error);
    } catch {
      setMsg("No se pudo conectar. ¿Tienes MongoDB y MONGODB_URI?");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function scrape() {
    setMsg("Scraper en curso (puede tardar mucho vía web)…");
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 401) {
        router.replace("/himnos/acceso");
        return;
      }
      const j = await res.json();
      setMsg(
        j.error
          ? String(j.error)
          : `Listo: ${j.upserted ?? 0} himnos con enlace a la página del himno (/songs/…). Títulos desde la web: ${j.titlesFromPage ?? 0}. Avisos: ${j.errors?.length ?? 0}.`,
      );
    } catch {
      setMsg("Fallo al scrapear. Usa yarn scrape en terminal.");
    }
    refresh();
  }

  async function cerrarSesion() {
    await fetch("/api/hymns-unlock", { method: "DELETE", credentials: "include" });
    router.replace("/himnos/acceso");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Himnos (administración)
          </h1>
          <p className="mt-2 text-sm text-muted">
            Cada himno guarda <strong>número</strong>, <strong>título</strong>{" "}
            (o “Himno n” si la página no responde) y la{" "}
            <strong>URL oficial</strong> del himno (página{" "}
            <code className="rounded bg-border px-1">/media/music/songs/…</code>{" "}
            en churchofjesuschrist.org).             El scrape une dos listas oficiales (hogar e Iglesia + himnos
            clásicos; hay saltos entre números en la primera). En terminal:{" "}
            <code className="rounded bg-border px-1">yarn scrape</code> (tras{" "}
            <code className="rounded bg-border px-1">yarn playwright install</code>
            ).
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/himnos"
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground"
          >
            Ver catálogo público
          </Link>
          <button
            type="button"
            onClick={cerrarSesion}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          Actualizar
        </button>
        <button
          type="button"
          onClick={scrape}
          className="rounded-lg border border-neutral-400 px-3 py-2 text-sm text-neutral-800 dark:border-neutral-500 dark:text-neutral-200"
        >
          Scrape vía API (lento)
        </button>
      </div>

      <p className="text-sm">
        <span className="text-muted">En base de datos: </span>
        <strong>{count ?? "—"}</strong> himnos
      </p>

      {msg ? (
        <p className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          {msg}
        </p>
      ) : null}

      <ul className="max-h-[60vh] space-y-2 overflow-y-auto rounded-xl border border-border bg-card p-3">
        {list.length === 0 ? (
          <li className="text-sm text-muted">
            Sin himnos. Ejecuta el scrape (botón de arriba) o en terminal{" "}
            <code className="rounded bg-border px-1">yarn scrape</code>.
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
                  className="text-sm text-foreground underline decoration-neutral-400 underline-offset-2 hover:decoration-foreground dark:decoration-neutral-500"
                >
                  Sitio oficial ↗
                </a>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
