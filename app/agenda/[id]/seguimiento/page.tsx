"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FHESessionView } from "@/components/FHESessionView";
import {
  fetchAgendaByIdRemote,
  useFamilyData,
} from "@/components/FamilyDataProvider";
import type { FamilyHomeEvening } from "@/lib/types/fhe";

export default function SeguimientoPage() {
  const params = useParams();
  const id = params.id as string;
  const { agendas, familyId, loading } = useFamilyData();
  const [agenda, setAgenda] = useState<FamilyHomeEvening | null | undefined>(
    undefined,
  );

  const load = useCallback(async () => {
    const fromList = agendas.find((a) => a.id === id);
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
  }, [id, agendas, familyId]);

  useEffect(() => {
    if (loading) return;
    void load();
  }, [loading, load]);

  if (agenda === undefined) {
    return <p className="text-muted">Cargando…</p>;
  }

  if (agenda === null) {
    return (
      <div className="space-y-4">
        <p>Agenda no encontrada.</p>
        <Link
          href="/agendas"
          className="text-foreground underline decoration-neutral-400 underline-offset-2 dark:decoration-neutral-500"
        >
          Volver
        </Link>
      </div>
    );
  }

  return <FHESessionView agenda={agenda} />;
}
