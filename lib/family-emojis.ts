/**
 * Emojis de personas / familia: varias filas de la misma galería (sin las dos variantes más oscuras del estándar Unicode).
 */

const MOD = {
  none: "",
  a: "\u{1F3FB}",
  b: "\u{1F3FC}",
  c: "\u{1F3FD}",
} as const;

const BASES = [
  "\u{1F468}", // 👨
  "\u{1F469}", // 👩
  "\u{1F9D1}", // 🧑
  "\u{1F466}", // 👦
  "\u{1F467}", // 👧
  "\u{1F476}", // 👶
  "\u{1F9D2}", // 🧒
  "\u{1F474}", // 👴
  "\u{1F475}", // 👵
  "\u{1F9D3}", // 🧓
] as const;

function withModifier(mod: string): string[] {
  return BASES.map((b) => b + mod);
}

/** Filas del selector (solo separadores visuales, sin etiquetas). */
export const FAMILY_EMOJI_GROUPS: { emojis: string[] }[] = [
  { emojis: withModifier(MOD.none) },
  { emojis: withModifier(MOD.a) },
  { emojis: withModifier(MOD.b) },
  { emojis: withModifier(MOD.c) },
];

export const ALL_FAMILY_EMOJIS: string[] = FAMILY_EMOJI_GROUPS.flatMap(
  (g) => g.emojis,
);

export function isKnownFamilyEmoji(s: string | undefined): boolean {
  if (!s) return false;
  return ALL_FAMILY_EMOJIS.includes(s);
}
