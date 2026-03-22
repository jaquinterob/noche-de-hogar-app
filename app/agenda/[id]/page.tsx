"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FHEAgenda } from "@/components/FHEAgenda";
import {
  deleteAgenda,
  getAgendaById,
  markAgendaCompleted,
} from "@/lib/storage";
import type { FamilyHomeEvening } from "@/lib/types/fhe";

export default function AgendaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [agenda, setAgenda] = useState<FamilyHomeEvening | null | undefined>(
    undefined,
  );

  const load = useCallback(() => {
    setAgenda(getAgendaById(id) ?? null);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (agenda === undefined) {
    return <p className="text-muted">Cargando…</p>;
  }

  if (agenda === null) {
    return (
      <div className="space-y-4">
        <p>No se encontró esta agenda.</p>
        <Link
          href="/agendas"
          className="text-foreground underline decoration-neutral-400 underline-offset-2 dark:decoration-neutral-500"
        >
          Volver a agendas
        </Link>
      </div>
    );
  }

  const planned = agenda.status === "planned";

  function onDelete() {
    if (!planned) return;
    if (!confirm("¿Eliminar esta agenda?")) return;
    deleteAgenda(id);
    router.push("/agendas");
  }

  function onMarkDone() {
    if (!planned) return;
    if (
      !confirm(
        "¿Marcar como realizada? Quedará en el histórico y no podrás editarla ni borrarla.",
      )
    ) {
      return;
    }
    markAgendaCompleted(id);
    load();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <Link
          href="/agendas"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Agendas
        </Link>
      </div>

      <FHEAgenda agenda={agenda} showSeguimientoCta />

      {planned ? (
        <div className="flex flex-wrap gap-3 border-t border-border pt-6">
          <Link
            href={`/planificar?edit=${id}`}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
          >
            Editar plan
          </Link>
          <button
            type="button"
            onClick={onMarkDone}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Marcar como realizada
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg px-4 py-2 text-sm text-muted underline decoration-neutral-400 decoration-1 underline-offset-2 hover:text-foreground dark:decoration-neutral-500"
          >
            Eliminar
          </button>
        </div>
      ) : (
        <p className="border-t border-border pt-6 text-sm text-muted">
          Esta reunión forma parte del histórico; no se puede modificar.
        </p>
      )}
    </div>
  );
}
