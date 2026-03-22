import type {
  CompletedStepKey,
  FamilyHomeEvening,
} from "@/lib/types/fhe";

/** Primera visita a seguimiento: marca inicio de sesión si falta. */
export function withSessionStartedIfNeeded(
  a: FamilyHomeEvening,
): FamilyHomeEvening {
  if (a.status !== "planned" || a.sessionStartedAt) return a;
  return {
    ...a,
    sessionStartedAt: new Date().toISOString(),
  };
}

export function withAgendaCompleted(a: FamilyHomeEvening): FamilyHomeEvening {
  if (a.status === "completed") return a;
  return {
    ...a,
    status: "completed",
    completedAt: new Date().toISOString(),
  };
}

export function withCompletedStepsPatch(
  a: FamilyHomeEvening,
  steps: Partial<Record<CompletedStepKey, boolean>>,
): FamilyHomeEvening {
  if (a.status === "completed") return a;

  const now = new Date().toISOString();
  const nextCompleted = {
    ...a.completedSteps,
    ...steps,
  } as NonNullable<FamilyHomeEvening["completedSteps"]>;
  const nextTimestamps: NonNullable<FamilyHomeEvening["stepCompletedAt"]> = {
    ...(a.stepCompletedAt ?? {}),
  };

  for (const key of Object.keys(steps) as CompletedStepKey[]) {
    const v = steps[key];
    if (v === true) {
      if (!a.completedSteps?.[key]) {
        nextTimestamps[key] = now;
      }
    } else if (v === false) {
      delete nextTimestamps[key];
    }
  }

  return {
    ...a,
    completedSteps: nextCompleted,
    stepCompletedAt: nextTimestamps,
  };
}
