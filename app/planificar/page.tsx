import { Suspense } from "react";
import { FHEWizard } from "@/components/FHEWizard";

export default function PlanificarPage() {
  return (
    <Suspense
      fallback={<p className="text-muted">Cargando asistente…</p>}
    >
      <FHEWizard />
    </Suspense>
  );
}
