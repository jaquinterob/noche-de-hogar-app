"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HymnSearch, type HymnPick } from "@/components/HymnSearch";
import {
  peekAndConsumeWizardReturn,
  saveHymnPickerContext,
} from "@/lib/planificar-hymn-pick";
import {
  deleteAgenda,
  getAgendaById,
  getMembers,
  upsertAgenda,
} from "@/lib/storage";
import type { FamilyHomeEvening, FamilyMember } from "@/lib/types/fhe";

/** Evita que un segundo efecto (p. ej. React Strict Mode) recargue la agenda y pise el himno elegido. */
let suppressWizardHydrateOnce = false;

function newEmptyForm(): Omit<
  FamilyHomeEvening,
  "id" | "date" | "status" | "completedAt"
> {
  return {
    preside: "",
    conducts: "",
    welcomeBy: "",
    openingHymn: "",
    openingHymnUrl: "",
    openingPrayer: "",
    spiritualThoughtBy: "",
    optionalHymn: "",
    optionalHymnUrl: "",
    mainMessageBy: "",
    activityBy: "",
    activityDescription: "",
    closingHymn: "",
    closingHymnUrl: "",
    closingPrayer: "",
    completedSteps: {},
  };
}

export function FHEWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [step, setStep] = useState(1);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [agendaId, setAgendaId] = useState<string | null>(null);
  const [form, setForm] = useState(newEmptyForm);

  const openHymnCatalog = useCallback(
    (slot: "opening" | "optional" | "closing") => {
      saveHymnPickerContext({
        v: 1,
        step,
        form,
        date,
        agendaId,
        editId,
        slot,
      });
      const q = new URLSearchParams({ slot });
      if (editId) q.set("edit", editId);
      router.push(`/planificar/elegir-himno?${q.toString()}`);
    },
    [step, form, date, agendaId, editId, router],
  );

  const refreshMembers = useCallback(() => {
    setMembers(getMembers());
  }, []);

  useEffect(() => {
    refreshMembers();
  }, [refreshMembers]);

  useEffect(() => {
    const returned = peekAndConsumeWizardReturn();
    if (returned) {
      setAgendaId(returned.agendaId);
      setDate(returned.date);
      setForm(returned.form);
      setStep(returned.step);
      suppressWizardHydrateOnce = true;
      return;
    }
    if (suppressWizardHydrateOnce) {
      suppressWizardHydrateOnce = false;
      return;
    }
    if (!editId) {
      setAgendaId(null);
      setForm(newEmptyForm());
      setStep(1);
      return;
    }
    const a = getAgendaById(editId);
    if (!a || a.status !== "planned") {
      router.replace("/agendas");
      return;
    }
    setAgendaId(a.id);
    setDate(a.date.slice(0, 10));
    setForm({
      preside: a.preside,
      conducts: a.conducts,
      welcomeBy: a.welcomeBy,
      openingHymn: a.openingHymn,
      openingHymnUrl: a.openingHymnUrl,
      openingPrayer: a.openingPrayer,
      spiritualThoughtBy: a.spiritualThoughtBy,
      optionalHymn: a.optionalHymn,
      optionalHymnUrl: a.optionalHymnUrl,
      mainMessageBy: a.mainMessageBy,
      activityBy: a.activityBy,
      activityDescription: a.activityDescription,
      closingHymn: a.closingHymn,
      closingHymnUrl: a.closingHymnUrl,
      closingPrayer: a.closingPrayer,
      completedSteps: a.completedSteps ?? {},
    });
    setStep(1);
  }, [editId, router]);

  const memberOptions = useMemo(
    () =>
      members.map((m) => {
        const label = m.emoji ? `${m.emoji} ${m.name}` : m.name;
        return (
          <option key={m.id} value={m.name}>
            {label}
          </option>
        );
      }),
    [members],
  );

  const maxStep = 12;

  function canAdvance(): boolean {
    switch (step) {
      case 1:
        return !!form.preside;
      case 2:
        return !!form.conducts;
      case 3:
        return !!form.welcomeBy;
      case 4:
        return !!form.openingHymn;
      case 5:
        return !!form.openingPrayer;
      case 6:
        return !!form.spiritualThoughtBy;
      case 7:
        return true;
      case 8:
        return !!form.mainMessageBy;
      case 9:
        return !!form.activityBy;
      case 10:
        return !!form.closingHymn;
      case 11:
        return !!form.closingPrayer;
      case 12:
        return !!date;
      default:
        return false;
    }
  }

  function next() {
    if (!canAdvance()) return;
    if (step < maxStep) setStep(step + 1);
  }

  function back() {
    if (step > 1) setStep(step - 1);
  }

  function save() {
    if (!date) return;
    const id = agendaId ?? crypto.randomUUID();
    const isoDate = new Date(date + "T12:00:00").toISOString();
    if (agendaId) {
      const prev = getAgendaById(agendaId);
      if (prev?.status === "completed") return;
    }
    const agenda: FamilyHomeEvening = {
      id,
      date: isoDate,
      status: "planned",
      ...form,
    };
    upsertAgenda(agenda);
    router.push(`/agenda/${id}`);
  }

  function cancelEdit() {
    if (editId) router.push(`/agenda/${editId}`);
    else router.push("/agendas");
  }

  function removeDraft() {
    if (agendaId && editId) {
      deleteAgenda(agendaId);
      router.push("/agendas");
    }
  }

  const titleForStep =
    step === 12
      ? "Fecha y guardar"
      : `Paso ${step} de 11 — ${STEP_LABELS[step - 1] ?? ""}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-foreground">
          {editId ? "Editar Noche de Hogar" : "Planificar Noche de Hogar"}
        </h1>
        {editId ? (
          <button
            type="button"
            onClick={cancelEdit}
            className="text-sm text-muted hover:text-foreground"
          >
            Volver
          </button>
        ) : null}
      </div>

      <p className="text-sm text-muted">{titleForStep}</p>

      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-foreground transition-all duration-300 dark:bg-neutral-300"
          style={{ width: `${(step / maxStep) * 100}%` }}
        />
      </div>

      {members.length === 0 && step >= 1 && step <= 11 && step !== 7 && (
        <p className="rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm text-foreground dark:border-neutral-600 dark:bg-neutral-900">
          Añade miembros en{" "}
          <a
            href="/familia"
            className="font-medium text-foreground underline decoration-neutral-500 underline-offset-2 dark:decoration-neutral-400"
          >
            Familia
          </a>{" "}
          para usar los desplegables.
        </p>
      )}

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        {step === 1 && (
          <Field label="¿Quién preside?">
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              value={form.preside}
              onChange={(e) =>
                setForm((f) => ({ ...f, preside: e.target.value }))
              }
            >
              <option value="">— Elegir —</option>
              {memberOptions}
            </select>
          </Field>
        )}

        {step === 2 && (
          <Field label="¿Quién dirige?">
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              value={form.conducts}
              onChange={(e) =>
                setForm((f) => ({ ...f, conducts: e.target.value }))
              }
            >
              <option value="">— Elegir —</option>
              {memberOptions}
            </select>
          </Field>
        )}

        {step === 3 && (
          <Field label="¿Quién da la bienvenida?">
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              value={form.welcomeBy}
              onChange={(e) =>
                setForm((f) => ({ ...f, welcomeBy: e.target.value }))
              }
            >
              <option value="">— Elegir —</option>
              {memberOptions}
            </select>
          </Field>
        )}

        {step === 4 && (
          <Field label="Primer himno">
            <HymnSearch
              valueLabel={form.openingHymn}
              valueUrl={form.openingHymnUrl}
              onChange={(p: HymnPick | null) =>
                setForm((f) => ({
                  ...f,
                  openingHymn: p?.label ?? "",
                  openingHymnUrl: p?.pageUrl ?? "",
                }))
              }
            />
            <CatalogHymnButton
              onClick={() => openHymnCatalog("opening")}
            />
          </Field>
        )}

        {step === 5 && (
          <Field label="Primera oración">
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              value={form.openingPrayer}
              onChange={(e) =>
                setForm((f) => ({ ...f, openingPrayer: e.target.value }))
              }
            >
              <option value="">— Elegir —</option>
              {memberOptions}
            </select>
          </Field>
        )}

        {step === 6 && (
          <Field label="Pensamiento espiritual">
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              value={form.spiritualThoughtBy}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  spiritualThoughtBy: e.target.value,
                }))
              }
            >
              <option value="">— Elegir —</option>
              {memberOptions}
            </select>
          </Field>
        )}

        {step === 7 && (
          <Field label="Segundo himno (opcional)">
            <HymnSearch
              valueLabel={form.optionalHymn}
              valueUrl={form.optionalHymnUrl}
              allowEmpty
              onChange={(p: HymnPick | null) =>
                setForm((f) => ({
                  ...f,
                  optionalHymn: p?.label ?? "",
                  optionalHymnUrl: p?.pageUrl ?? "",
                }))
              }
            />
            <CatalogHymnButton
              onClick={() => openHymnCatalog("optional")}
            />
          </Field>
        )}

        {step === 8 && (
          <Field label="Mensaje principal">
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              value={form.mainMessageBy}
              onChange={(e) =>
                setForm((f) => ({ ...f, mainMessageBy: e.target.value }))
              }
            >
              <option value="">— Elegir —</option>
              {memberOptions}
            </select>
          </Field>
        )}

        {step === 9 && (
          <>
            <Field label="¿Quién dirige la actividad?">
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                value={form.activityBy}
                onChange={(e) =>
                  setForm((f) => ({ ...f, activityBy: e.target.value }))
                }
              >
                <option value="">— Elegir —</option>
                {memberOptions}
              </select>
            </Field>
            <Field label="¿Qué haremos? (opcional)">
              <textarea
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="Ej. Juegos en el jardín, manualidad…"
                value={form.activityDescription}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    activityDescription: e.target.value,
                  }))
                }
              />
            </Field>
          </>
        )}

        {step === 10 && (
          <Field label="Último himno">
            <HymnSearch
              valueLabel={form.closingHymn}
              valueUrl={form.closingHymnUrl}
              onChange={(p: HymnPick | null) =>
                setForm((f) => ({
                  ...f,
                  closingHymn: p?.label ?? "",
                  closingHymnUrl: p?.pageUrl ?? "",
                }))
              }
            />
            <CatalogHymnButton
              onClick={() => openHymnCatalog("closing")}
            />
          </Field>
        )}

        {step === 11 && (
          <Field label="Oración final">
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              value={form.closingPrayer}
              onChange={(e) =>
                setForm((f) => ({ ...f, closingPrayer: e.target.value }))
              }
            >
              <option value="">— Elegir —</option>
              {memberOptions}
            </select>
          </Field>
        )}

        {step === 12 && (
          <Field label="Fecha de la reunión">
            <input
              type="date"
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <p className="mt-3 text-sm text-muted">
              Revisa los datos y pulsa <strong>Guardar agenda</strong>.
            </p>
          </Field>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={back}
          disabled={step <= 1}
          className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40"
        >
          Atrás
        </button>
        {step < maxStep ? (
          <button
            type="button"
            onClick={next}
            disabled={!canAdvance()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            onClick={save}
            disabled={!canAdvance()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
          >
            Guardar agenda
          </button>
        )}
        {editId && agendaId ? (
          <button
            type="button"
            onClick={removeDraft}
            className="ml-auto text-sm text-muted underline decoration-neutral-400 underline-offset-2 hover:text-foreground dark:decoration-neutral-500"
          >
            Eliminar esta agenda
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CatalogHymnButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground hover:bg-card"
    >
      Ver lista completa con filtro
    </button>
  );
}

const STEP_LABELS = [
  "Quién preside",
  "Quién dirige",
  "Bienvenida",
  "Primer himno",
  "Primera oración",
  "Pensamiento espiritual",
  "Segundo himno (opcional)",
  "Mensaje principal",
  "Actividad",
  "Último himno",
  "Oración final",
];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
