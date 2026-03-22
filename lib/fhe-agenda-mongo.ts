import type { FheAgendaDoc } from "@/lib/models/FheAgenda";
import type { FamilyHomeEvening } from "@/lib/types/fhe";

export function fheDocToClient(doc: FheAgendaDoc): FamilyHomeEvening {
  const o = doc as unknown as Record<string, unknown>;
  return {
    id: doc.agendaId,
    date: doc.date,
    status: doc.status as FamilyHomeEvening["status"],
    completedAt: doc.completedAt || undefined,
    preside: doc.preside ?? "",
    conducts: doc.conducts ?? "",
    welcomeBy: doc.welcomeBy ?? "",
    openingHymn: doc.openingHymn ?? "",
    openingHymnUrl: doc.openingHymnUrl ?? "",
    openingPrayer: doc.openingPrayer ?? "",
    spiritualThoughtBy: doc.spiritualThoughtBy ?? "",
    optionalHymn: doc.optionalHymn ?? "",
    optionalHymnUrl: doc.optionalHymnUrl ?? "",
    mainMessageBy: doc.mainMessageBy ?? "",
    activityBy: doc.activityBy ?? "",
    activityDescription: doc.activityDescription ?? "",
    closingHymn: doc.closingHymn ?? "",
    closingHymnUrl: doc.closingHymnUrl ?? "",
    closingPrayer: doc.closingPrayer ?? "",
    completedSteps:
      (o.completedSteps as FamilyHomeEvening["completedSteps"]) ?? {},
    sessionStartedAt: doc.sessionStartedAt || undefined,
    stepCompletedAt:
      (o.stepCompletedAt as FamilyHomeEvening["stepCompletedAt"]) ?? {},
  };
}

export function clientAgendaToMongoFields(
  a: FamilyHomeEvening,
): Omit<FheAgendaDoc, "_id" | "familyId" | "createdAt" | "updatedAt"> {
  return {
    agendaId: a.id,
    date: a.date,
    status: a.status,
    completedAt: a.completedAt ?? "",
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
    sessionStartedAt: a.sessionStartedAt ?? "",
    stepCompletedAt: a.stepCompletedAt ?? {},
  };
}
