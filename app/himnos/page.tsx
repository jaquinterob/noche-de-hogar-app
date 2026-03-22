import Link from "next/link";
import { HimnosCatalogPublic } from "./HimnosCatalogPublic";

export default function HimnosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Himnos</h1>
          <p className="mt-2 text-sm text-muted">
            Catálogo para consultar. En el planificador también puedes buscar
            himnos al armar la Noche de Hogar.
          </p>
        </div>
        <Link
          href="/himnos/acceso"
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-foreground/5"
        >
          Administración (clave)
        </Link>
      </div>
      <HimnosCatalogPublic />
    </div>
  );
}
