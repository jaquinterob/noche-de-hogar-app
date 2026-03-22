import type { FamilyHomeEvening } from "@/lib/types/fhe";

/** Contexto guardado al abrir la lista de himnos desde el asistente. */
export type HymnPickerContext = {
  v: 1;
  step: number;
  form: Omit<
    FamilyHomeEvening,
    "id" | "date" | "status" | "completedAt"
  >;
  date: string;
  agendaId: string | null;
  editId: string | null;
  slot: "opening" | "optional" | "closing";
};

const CONTEXT_KEY = "noche-hogar-hymn-picker-context";
const RETURN_KEY = "noche-hogar-hymn-picker-return";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveHymnPickerContext(ctx: HymnPickerContext): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx));
}

export function loadHymnPickerContext(): HymnPickerContext | null {
  if (typeof window === "undefined") return null;
  return safeParse<HymnPickerContext>(sessionStorage.getItem(CONTEXT_KEY));
}

export function clearHymnPickerContext(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CONTEXT_KEY);
}

/** Estado completo del asistente tras elegir himno (lo lee FHEWizard al volver). */
export type WizardReturnPayload = Omit<HymnPickerContext, "slot">;

export function saveWizardReturnFromPicker(payload: WizardReturnPayload): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RETURN_KEY, JSON.stringify(payload));
  sessionStorage.removeItem(CONTEXT_KEY);
}

export function consumeWizardReturnFromPicker(): WizardReturnPayload | null {
  return peekAndConsumeWizardReturn();
}

/** Lee y borra el payload de vuelta desde la página de elegir himno. */
export function peekAndConsumeWizardReturn(): WizardReturnPayload | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(RETURN_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(RETURN_KEY);
  return safeParse<WizardReturnPayload>(raw);
}

export function applyHymnToForm(
  form: HymnPickerContext["form"],
  slot: HymnPickerContext["slot"],
  pick: { label: string; pageUrl: string } | null,
): HymnPickerContext["form"] {
  switch (slot) {
    case "opening":
      return {
        ...form,
        openingHymn: pick?.label ?? "",
        openingHymnUrl: pick?.pageUrl ?? "",
      };
    case "optional":
      return {
        ...form,
        optionalHymn: pick?.label ?? "",
        optionalHymnUrl: pick?.pageUrl ?? "",
      };
    case "closing":
      return {
        ...form,
        closingHymn: pick?.label ?? "",
        closingHymnUrl: pick?.pageUrl ?? "",
      };
    default:
      return form;
  }
}
