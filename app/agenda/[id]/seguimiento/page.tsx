"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FHESessionView } from "@/components/FHESessionView";
import { getAgendaById } from "@/lib/storage";
import type { FamilyHomeEvening } from "@/lib/types/fhe";

export default function SeguimientoPage() {
  const params = useParams();
  const id = params.id as string;
  const [agenda, setAgenda] = useState<FamilyHomeEvening | null | undefined>(
    undefined,
  );

  const load = useCallback(() => {
    setAgenda(getAgendaById(id) ?? null);
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 1200);
    return () => clearInterval(t);
  }, [load]);

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
