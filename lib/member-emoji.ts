import type {
  CompletedStepKey,
  FamilyHomeEvening,
  FamilyMember,
} from "@/lib/types/fhe";

/** Coincidencia exacta por nombre (tras trim). */
export function emojiForMemberName(
  members: FamilyMember[],
  name: string,
): string | undefined {
  const t = name.trim();
  if (!t) return undefined;
  const m = members.find((x) => x.name.trim() === t);
  return m?.emoji;
}

/** Nombre de la persona “a cargo” del paso (si aplica); himnos sin persona. */
export function assigneeNameForCueKey(
  key: CompletedStepKey,
  agenda: FamilyHomeEvening,
): string | null {
  switch (key) {
    case "preside":
      return agenda.preside.trim() || null;
    case "conducts":
      return agenda.conducts.trim() || null;
    case "welcome":
      return agenda.welcomeBy.trim() || null;
    case "openingPrayer":
      return agenda.openingPrayer.trim() || null;
    case "spiritualThought":
      return agenda.spiritualThoughtBy.trim() || null;
    case "mainMessage":
      return agenda.mainMessageBy.trim() || null;
    case "activity":
      return agenda.activityBy.trim() || null;
    case "closingPrayer":
      return agenda.closingPrayer.trim() || null;
    default:
      return null;
  }
}
