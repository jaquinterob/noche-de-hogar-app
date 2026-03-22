import type {
  CompletedStepKey,
  FamilyHomeEvening,
} from "@/lib/types/fhe";

export type SessionRow = {
  key: CompletedStepKey;
  label: string;
  detail: (a: FamilyHomeEvening) => string;
  hymnUrl?: (a: FamilyHomeEvening) => string | undefined;
};

const ROWS: SessionRow[] = [
  {
    key: "preside",
    label: "Preside",
    detail: (a) => a.preside,
  },
  {
    key: "conducts",
    label: "Dirige",
    detail: (a) => a.conducts,
  },
  {
    key: "welcome",
    label: "Bienvenida",
    detail: (a) => a.welcomeBy,
  },
  {
    key: "openingHymn",
    label: "Primer himno",
    detail: (a) => a.openingHymn,
    hymnUrl: (a) => a.openingHymnUrl || undefined,
  },
  {
    key: "openingPrayer",
    label: "Primera oración",
    detail: (a) => a.openingPrayer,
  },
  {
    key: "spiritualThought",
    label: "Pensamiento espiritual",
    detail: (a) => a.spiritualThoughtBy,
  },
  {
    key: "optionalHymn",
    label: "Segundo himno",
    detail: (a) => a.optionalHymn || "—",
    hymnUrl: (a) => a.optionalHymnUrl || undefined,
  },
  {
    key: "mainMessage",
    label: "Mensaje principal",
    detail: (a) => a.mainMessageBy,
  },
  {
    key: "activity",
    label: "Actividad",
    detail: (a) => {
      const d = a.activityDescription?.trim();
      if (d) return `${a.activityBy} — ${d}`;
      return a.activityBy;
    },
  },
  {
    key: "closingHymn",
    label: "Último himno",
    detail: (a) => a.closingHymn,
    hymnUrl: (a) => a.closingHymnUrl || undefined,
  },
  {
    key: "closingPrayer",
    label: "Oración final",
    detail: (a) => a.closingPrayer,
  },
];

export function getSessionRows(agenda: FamilyHomeEvening): SessionRow[] {
  const hasOptional = !!(
    agenda.optionalHymn?.trim() || agenda.optionalHymnUrl?.trim()
  );
  if (hasOptional) return ROWS;
  return ROWS.filter((r) => r.key !== "optionalHymn");
}
