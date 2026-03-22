"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { HymnJSON } from "@/lib/hymn-serialize";
import { loadHymnsCatalogForUi } from "@/lib/hymns-catalog-load";
import {
  applyHymnToForm,
  loadHymnPickerContext,
  saveWizardReturnFromPicker,
  type HymnPickerContext,
} from "@/lib/planificar-hymn-pick";

const SLOT_LABEL: Record<HymnPickerContext["slot"], string> = {
  opening: "Primer himno",
  optional: "Segundo himno (opcional)",
  closing: "Último himno",
};

export function HymnCatalogPicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slotParam = searchParams.get("slot");
  const editParam = searchParams.get("edit");

  const slot = useMemo((): HymnPickerContext["slot"] | null => {
    if (slotParam === "opening" || slotParam === "optional" || slotParam === "closing") {
      return slotParam;
    }
    return null;
  }, [slotParam]);

  const [filter, setFilter] = useState("");
  const [list, setList] = useState<HymnJSON[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCatalog = useCallback(async (q: string) => {
    setLoading(true);
    setError("");
    const { list: rows, error: err } = await loadHymnsCatalogForUi(q);
    setList(rows);
    setError(err);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadCatalog(filter), filter ? 280 : 0);
    return () => clearTimeout(t);
  }, [filter, loadCatalog]);

  useEffect(() => {
    if (!slot) return;
    const c = loadHymnPickerContext();
    if (!c || c.slot !== slot) {
      router.replace(
        `/planificar${editParam ? `?edit=${encodeURIComponent(editParam)}` : ""}`,
      );
    }
  }, [slot, editParam, router]);

  function planificarHref() {
    return `/planificar${editParam ? `?edit=${encodeURIComponent(editParam)}` : ""}`;
  }

  function goBackWithoutPick() {
    const c = loadHymnPickerContext();
    if (c) {
      saveWizardReturnFromPicker({
        v: 1,
        step: c.step,
        form: c.form,
        date: c.date,
        agendaId: c.agendaId,
        editId: c.editId,
      });
    }
    router.push(planificarHref());
  }

  function selectHymn(h: HymnJSON) {
    const c = loadHymnPickerContext();
    if (!c || !slot) return;
    const label = `#${h.number} ${h.title}`.trim();
    const nextForm = applyHymnToForm(c.form, slot, {
      label,
      pageUrl: h.pageUrl,
    });
    saveWizardReturnFromPicker({
      v: 1,
      step: c.step,
      form: nextForm,
      date: c.date,
      agendaId: c.agendaId,
      editId: c.editId,
    });
    router.push(planificarHref());
  }

  function clearOptional() {
    if (slot !== "optional") return;
    const c = loadHymnPickerContext();
    if (!c) return;
    const nextForm = applyHymnToForm(c.form, "optional", null);
    saveWizardReturnFromPicker({
      v: 1,
      step: c.step,
      form: nextForm,
      date: c.date,
      agendaId: c.agendaId,
      editId: c.editId,
    });
    router.push(planificarHref());
  }

  if (!slot) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">Enlace no válido.</p>
        <Link href="/planificar" className="text-sm underline">
          Volver a planificar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Elegir himno
          </h1>
          <p className="mt-1 text-sm text-muted">
            {SLOT_LABEL[slot]} · Selecciona uno y volverás al paso actual del
            asistente.
          </p>
        </div>
        <button
          type="button"
          onClick={goBackWithoutPick}
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground"
        >
          Volver sin cambiar
        </button>
      </div>

      <input
        type="search"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filtrar por número o título…"
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        autoComplete="off"
      />

      {error ? (
        <p className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : (
        <p className="text-sm text-muted">
          {list.length} himno{list.length === 1 ? "" : "s"}
          {filter.trim() ? " (filtrado)" : ""}
        </p>
      )}

      {slot === "optional" && (
        <button
          type="button"
          onClick={clearOptional}
          className="w-full rounded-lg border border-dashed border-border py-3 text-sm text-muted hover:text-foreground"
        >
          Dejar sin segundo himno
        </button>
      )}

      <ul className="max-h-[min(60vh,520px)] space-y-1 overflow-y-auto rounded-xl border border-border bg-card p-2">
        {!loading &&
          list.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => selectHymn(h)}
                className="flex w-full flex-wrap items-start justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-background"
              >
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-foreground">
                    #{h.number}
                  </span>{" "}
                  <span className="break-words text-foreground">{h.title}</span>
                </span>
                {h.pageUrl ? (
                  <a
                    href={h.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 text-xs text-muted underline underline-offset-2 hover:text-foreground"
                  >
                    Sitio ↗
                  </a>
                ) : null}
              </button>
            </li>
          ))}
        {!loading && list.length === 0 && (
          <li className="px-3 py-8 text-center text-sm text-muted">
            No hay himnos que coincidan. Prueba otro filtro o comprueba que el
            catálogo esté cargado (administración de himnos).
          </li>
        )}
      </ul>
    </div>
  );
}
