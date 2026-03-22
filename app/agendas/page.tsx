"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getAgendas } from "@/lib/storage";
import type { FamilyHomeEvening } from "@/lib/types/fhe";

export default function AgendasPage() {
  const [list, setList] = useState<FamilyHomeEvening[]>([]);

  const load = useCallback(() => {
    const a = getAgendas();
    a.sort(
      (x, y) => new Date(y.date).getTime() - new Date(x.date).getTime(),
    );
    setList(a);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 800);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Agendas</h1>
      {list.length === 0 ? (
        <p className="text-muted">
          No hay agendas aún.{" "}
          <Link
            href="/planificar"
            className="text-foreground underline decoration-neutral-400 underline-offset-2 dark:decoration-neutral-500"
          >
            Planificar
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((a) => (
            <li key={a.id}>
              <Link
                href={`/agenda/${a.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-4 transition hover:border-neutral-400 dark:hover:border-neutral-500"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {new Date(a.date).toLocaleDateString("es", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-muted">Preside: {a.preside}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    a.status === "completed"
                      ? "bg-muted/30 text-muted"
                      : "bg-neutral-200 text-foreground dark:bg-neutral-800 dark:text-neutral-100"
                  }`}
                >
                  {a.status === "completed" ? "Realizada" : "Planificada"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
