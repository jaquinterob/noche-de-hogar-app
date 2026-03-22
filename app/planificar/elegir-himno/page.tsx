import { Suspense } from "react";
import { HymnCatalogPicker } from "./HymnCatalogPicker";

export default function ElegirHimnoPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted">Cargando…</p>}
    >
      <HymnCatalogPicker />
    </Suspense>
  );
}
