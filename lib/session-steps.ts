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

/**
 * Intenta sacar número y título desde el texto guardado (#1005 Título o 1005. Título).
 */
export function parseHymnFromStored(stored: string): {
  number: string;
  title: string;
} | null {
  const t = stored.trim();
  if (!t) return null;
  const m1 = t.match(/^#(\d+)\s+(.+)$/);
  if (m1) return { number: m1[1], title: m1[2].trim() };
  const m2 = t.match(/^(\d+)\.\s*(.+)$/);
  if (m2) return { number: m2[1], title: m2[2].trim() };
  return null;
}

/** Trozo de frase; `emphasize` usa tipografía destacada (nombre, himno, etc.). */
export type ScriptSegment = { text: string; emphasize?: boolean };

type CueScript = { script: string; segments: ScriptSegment[] };

function cuePlain(text: string): CueScript {
  return { script: text, segments: [{ text }] };
}

function cueParts(...segments: ScriptSegment[]): CueScript {
  return {
    script: segments.map((s) => s.text).join(""),
    segments,
  };
}

/** Variante estable por agenda + paso (no cambia al reabrir seguimiento). */
function stableVariantIndex(
  agenda: FamilyHomeEvening,
  stepKey: string,
  variantCount: number,
): number {
  if (variantCount <= 1) return 0;
  const seed = `${agenda.id}|${agenda.date}|${stepKey}`;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % variantCount;
}

export type DirectorCue = {
  key: CompletedStepKey;
  stepIndex: number;
  phaseLabel: string;
  /** Texto completo (accesibilidad, lectores de pantalla). */
  script: string;
  /** Trozos para resaltar nombres e himnos. */
  segments: ScriptSegment[];
  hymnUrl?: string;
};

function scriptPreside(a: FamilyHomeEvening): CueScript {
  const n = a.preside.trim();
  if (!n) return cuePlain("En este momento comenzamos la Noche de Hogar.");
  const v = stableVariantIndex(a, "preside", 3);
  if (v === 0) {
    return cueParts(
      { text: "En este momento preside " },
      { text: n, emphasize: true },
      { text: "." },
    );
  }
  if (v === 1) {
    return cueParts(
      { text: "Esta Noche de Hogar es presidida por " },
      { text: n, emphasize: true },
      { text: "." },
    );
  }
  return cueParts(
    { text: "Hoy preside esta Noche de Hogar " },
    { text: n, emphasize: true },
    { text: "." },
  );
}

function scriptConducts(a: FamilyHomeEvening): CueScript {
  const n = a.conducts.trim();
  if (!n) return cuePlain("Continuamos con nuestra Noche de Hogar.");
  const v = stableVariantIndex(a, "conducts", 3);
  if (v === 0) {
    return cueParts(
      { text: "La Noche de Hogar de hoy la dirige " },
      { text: n, emphasize: true },
      { text: "." },
    );
  }
  if (v === 1) {
    return cueParts(
      { text: "Dirige " },
      { text: n, emphasize: true },
      { text: "." },
    );
  }
  return cueParts(
    { text: "Quién dirige hoy es " },
    { text: n, emphasize: true },
    { text: "." },
  );
}

function scriptWelcome(a: FamilyHomeEvening): CueScript {
  const n = a.welcomeBy.trim();
  if (!n) return cuePlain("Ahora damos la bienvenida a todos.");
  return cueParts(
    { text: "Ahora tendremos la bienvenida por " },
    { text: n, emphasize: true },
    { text: "." },
  );
}

function scriptOpeningHymn(a: FamilyHomeEvening): CueScript {
  const p = parseHymnFromStored(a.openingHymn);
  if (p) {
    return cueParts(
      { text: "Como primer himno tendremos el número " },
      { text: `${p.number}, ${p.title}`, emphasize: true },
      { text: "." },
    );
  }
  const raw = a.openingHymn.trim();
  if (raw) {
    return cueParts(
      { text: "Como primer himno tendremos: " },
      { text: raw, emphasize: true },
      { text: "." },
    );
  }
  return cuePlain("Ahora cantamos el primer himno.");
}

function scriptOpeningPrayer(a: FamilyHomeEvening): CueScript {
  const n = a.openingPrayer.trim();
  if (!n) return cuePlain("Ahora tendremos la primera oración.");
  return cueParts(
    { text: "La primera oración la ofrece " },
    { text: n, emphasize: true },
    { text: "." },
  );
}

function scriptSpiritual(a: FamilyHomeEvening): CueScript {
  const n = a.spiritualThoughtBy.trim();
  if (!n) return cuePlain("Seguimos con el pensamiento espiritual.");
  return cueParts(
    { text: "Ahora " },
    { text: n, emphasize: true },
    { text: " nos compartirá el pensamiento espiritual." },
  );
}

function scriptOptionalHymn(a: FamilyHomeEvening): CueScript {
  const p = parseHymnFromStored(a.optionalHymn);
  if (p) {
    return cueParts(
      { text: "Como segundo himno tendremos el número " },
      { text: `${p.number}, ${p.title}`, emphasize: true },
      { text: "." },
    );
  }
  const raw = a.optionalHymn.trim();
  if (raw) {
    return cueParts(
      { text: "Como segundo himno tendremos: " },
      { text: raw, emphasize: true },
      { text: "." },
    );
  }
  return cuePlain("Cantamos el segundo himno.");
}

function scriptMainMessage(a: FamilyHomeEvening): CueScript {
  const n = a.mainMessageBy.trim();
  if (!n) return cuePlain("Continuamos con el mensaje principal.");
  return cueParts(
    { text: "Ahora " },
    { text: n, emphasize: true },
    { text: " nos presentará el mensaje principal." },
  );
}

function scriptActivity(a: FamilyHomeEvening): CueScript {
  const n = a.activityBy.trim();
  const d = a.activityDescription?.trim();
  const v = stableVariantIndex(a, "activity", 3);

  if (n && d) {
    if (v === 0) {
      return cueParts(
        { text: "Ahora " },
        { text: n, emphasize: true },
        { text: " dirige la actividad: " },
        { text: d, emphasize: true },
      );
    }
    if (v === 1) {
      return cueParts(
        { text: "La actividad está a cargo de " },
        { text: n, emphasize: true },
        { text: " — " },
        { text: d, emphasize: true },
      );
    }
    return cueParts(
      { text: "La actividad la preparó " },
      { text: n, emphasize: true },
      { text: ". " },
      { text: d, emphasize: true },
    );
  }
  if (n) {
    if (v === 0) {
      return cueParts(
        { text: "Ahora " },
        { text: n, emphasize: true },
        { text: " dirige la actividad." },
      );
    }
    if (v === 1) {
      return cueParts(
        { text: "La actividad está a cargo de " },
        { text: n, emphasize: true },
        { text: "." },
      );
    }
    return cueParts(
      { text: "Quién dirige la actividad es " },
      { text: n, emphasize: true },
      { text: "." },
    );
  }
  return cuePlain("Seguimos con la actividad.");
}

function scriptClosingHymn(a: FamilyHomeEvening): CueScript {
  const p = parseHymnFromStored(a.closingHymn);
  if (p) {
    return cueParts(
      { text: "Como último himno tendremos el número " },
      { text: `${p.number}, ${p.title}`, emphasize: true },
      { text: "." },
    );
  }
  const raw = a.closingHymn.trim();
  if (raw) {
    return cueParts(
      { text: "Como último himno tendremos: " },
      { text: raw, emphasize: true },
      { text: "." },
    );
  }
  return cuePlain("Para cerrar cantamos el último himno.");
}

function scriptClosingPrayer(a: FamilyHomeEvening): CueScript {
  const n = a.closingPrayer.trim();
  if (!n) return cuePlain("Terminamos con la oración final.");
  return cueParts(
    { text: "La última oración está a cargo de " },
    { text: n, emphasize: true },
    { text: "." },
  );
}

function buildDirectorCue(row: SessionRow, agenda: FamilyHomeEvening, stepIndex: number): DirectorCue {
  const base = {
    key: row.key,
    stepIndex,
    phaseLabel: row.label,
    hymnUrl: row.hymnUrl?.(agenda),
  };

  let cs: CueScript;
  switch (row.key) {
    case "preside":
      cs = scriptPreside(agenda);
      break;
    case "conducts":
      cs = scriptConducts(agenda);
      break;
    case "welcome":
      cs = scriptWelcome(agenda);
      break;
    case "openingHymn":
      cs = scriptOpeningHymn(agenda);
      break;
    case "openingPrayer":
      cs = scriptOpeningPrayer(agenda);
      break;
    case "spiritualThought":
      cs = scriptSpiritual(agenda);
      break;
    case "optionalHymn":
      cs = scriptOptionalHymn(agenda);
      break;
    case "mainMessage":
      cs = scriptMainMessage(agenda);
      break;
    case "activity":
      cs = scriptActivity(agenda);
      break;
    case "closingHymn":
      cs = scriptClosingHymn(agenda);
      break;
    case "closingPrayer":
      cs = scriptClosingPrayer(agenda);
      break;
    default:
      cs = cuePlain(row.detail(agenda) || row.label);
  }

  return {
    ...base,
    script: cs.script,
    segments: cs.segments,
  };
}

export function getDirectorCues(agenda: FamilyHomeEvening): DirectorCue[] {
  const rows = getSessionRows(agenda);
  return rows.map((row, i) => buildDirectorCue(row, agenda, i + 1));
}
