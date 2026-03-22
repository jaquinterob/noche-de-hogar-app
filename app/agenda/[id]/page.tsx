"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FHEAgenda } from "@/components/FHEAgenda";
import {
  fetchAgendaByIdRemote,
  useFamilyData,
} from "@/components/FamilyDataProvider";
import { withAgendaCompleted } from "@/lib/agenda-step-updates";
import type { FamilyHomeEvening } from "@/lib/types/fhe";

export default function AgendaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { agendas, familyId, loading, deleteAgenda, saveAgenda } =
    useFamilyData();
  const [agenda, setAgenda] = useState<FamilyHomeEvening | null | undefined>(
    undefined,
  );

  const agendasRef = useRef(agendas);
  agendasRef.current = agendas;

  const load = useCallback(async () => {
    const fromList = agendasRef.current.find((a) => a.id === id);
    if (fromList) {
      setAgenda(fromList);
      return;
    }
    if (familyId) {
      const remote = await fetchAgendaByIdRemote(familyId, id);
      setAgenda(remote ?? null);
      return;
    }
    setAgenda(null);
  }, [id, familyId]);

  useEffect(() => {
    if (loading) return;
    void load();
  }, [loading, load]);

  /* Cuando el contexto trae la agenda (p. ej. tras guardar), sincronizar sin depender de `load` en cada cambio de referencia del array. */
  useEffect(() => {
    if (loading) return;
    const fromList = agendas.find((a) => a.id === id);
    if (fromList) setAgenda(fromList);
  }, [loading, id, agendas]);

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

  async function onDelete() {
    if (!planned) return;
    if (!confirm("¿Eliminar esta agenda?")) return;
    try {
      await deleteAgenda(id);
      router.push("/agendas");
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo eliminar");
    }
  }

  async function onMarkDone() {
    if (!planned || agenda == null) return;
    if (
      !confirm(
        "¿Marcar como realizada? Quedará en el histórico y no podrás editarla ni borrarla.",
      )
    ) {
      return;
    }
    try {
      const saved = await saveAgenda(withAgendaCompleted(agenda));
      setAgenda(saved);
    } catch {
      alert("No se pudo actualizar. Revisa la conexión.");
    }
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
            onClick={() => void onMarkDone()}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Marcar como realizada
          </button>
          <button
            type="button"
            onClick={() => void onDelete()}
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
