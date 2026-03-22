/** Noche de Hogar en cliente / API. Alineado a docs/REQUISITOS.md §4 y §5. */

export type AgendaStatus = "planned" | "completed";

export type CompletedStepKey =
  | "preside"
  | "conducts"
  | "welcome"
  | "openingHymn"
  | "openingPrayer"
  | "spiritualThought"
  | "optionalHymn"
  | "mainMessage"
  | "activity"
  | "closingHymn"
  | "closingPrayer";

export type CompletedSteps = Partial<Record<CompletedStepKey, boolean>>;

export interface FamilyMember {
  id: string;
  name: string;
  /** Emoji opcional (p. ej. 👨) para identificar visualmente al miembro. */
  emoji?: string;
}

export interface FamilyHomeEvening {
  id: string;
  date: string;
  status: AgendaStatus;
  completedAt?: string;
  preside: string;
  conducts: string;
  welcomeBy: string;
  openingHymn: string;
  openingHymnUrl: string;
  openingPrayer: string;
  spiritualThoughtBy: string;
  optionalHymn: string;
  optionalHymnUrl: string;
  mainMessageBy: string;
  activityBy: string;
  activityDescription: string;
  closingHymn: string;
  closingHymnUrl: string;
  closingPrayer: string;
  completedSteps?: CompletedSteps;
  /** ISO: primera vez que se abrió seguimiento (inicio del registro de tiempos). */
  sessionStartedAt?: string;
  /** ISO: cuándo se marcó cada paso como hecho en seguimiento. */
  stepCompletedAt?: Partial<Record<CompletedStepKey, string>>;
}

export function emptyAgenda(partial: Partial<FamilyHomeEvening> = {}): Omit<
  FamilyHomeEvening,
  "id" | "date" | "status"
> & { id?: string; date?: string; status?: AgendaStatus } {
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
    ...partial,
  };
}
