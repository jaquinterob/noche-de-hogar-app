"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function HimnosAccesoForm() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/hymns-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ key }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "No se pudo acceder");
        return;
      }
      router.replace("/himnos/admin");
      router.refresh();
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Acceso a himnos
        </h1>
        <p className="mt-2 text-sm text-muted">
          Con la clave accedes a <strong>administración</strong> (scrape y lista
          completa). Para solo consultar himnos usa el menú{" "}
          <Link href="/himnos" className="underline underline-offset-2">
            Himnos
          </Link>
          .
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="hymns-key"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Clave
          </label>
          <input
            id="hymns-key"
            type="password"
            autoComplete="current-password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            placeholder="Tu clave"
          />
        </div>
        {error ? (
          <p className="text-sm text-foreground">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={loading || !key.trim()}
          className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
        >
          {loading ? "Comprobando…" : "Entrar"}
        </button>
      </form>

      <p className="text-center text-sm">
        <Link href="/" className="text-muted underline underline-offset-2">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
