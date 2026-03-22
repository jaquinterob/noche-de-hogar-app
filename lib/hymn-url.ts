/** Colección “Himnos — Para el hogar y la Iglesia” (p. ej. 1001–1210 con saltos). */
export const HYMNS_COLLECTION_BASE =
  "https://www.churchofjesuschrist.org/media/music/collections/hymns-for-home-and-church";

/** URL de la página de lista de esa colección. */
export const HYMNS_COLLECTION_LIST_URL = `${HYMNS_COLLECTION_BASE}?lang=spa`;

/** Colección clásica de himnos (libro de himnos). */
export const HYMNS_CLASSIC_COLLECTION_BASE =
  "https://www.churchofjesuschrist.org/media/music/collections/hymns";

/** Lista de la colección clásica. */
export const HYMNS_CLASSIC_COLLECTION_LIST_URL = `${HYMNS_CLASSIC_COLLECTION_BASE}?lang=spa`;

/** Slug de `crumbs` en URLs de canción cuando la web no lo pone. */
export const CRUMBS_HYMNS_HOME_AND_CHURCH = "hymns-for-home-and-church";
export const CRUMBS_HYMNS_CLASSIC = "hymns";

/**
 * URL de entrada por número (la web suele redirigir a /media/music/songs/…).
 * Para enlaces “reales” al himno, usar el `pageUrl` guardado en BD tras el scrape.
 */
export function hymnCollectionEntryUrl(n: number): string {
  return `${HYMNS_COLLECTION_BASE}/${n}?lang=spa`;
}

export function hymnClassicCollectionEntryUrl(n: number): string {
  return `${HYMNS_CLASSIC_COLLECTION_BASE}/${n}?lang=spa`;
}

/** @deprecated Usar hymnCollectionEntryUrl; nombre antiguo por compatibilidad. */
export function hymnCanonicalUrl(n: number): string {
  return hymnCollectionEntryUrl(n);
}

const CHURCH_ORIGIN = "https://www.churchofjesuschrist.org";

/**
 * Normaliza URL de canción: absoluta, lang=spa.
 * Si la URL no trae `crumbs`, se añade `defaultCrumbs` (por defecto hogar e Iglesia).
 */
export function normalizeSongPageUrl(
  href: string,
  defaultCrumbs: string = CRUMBS_HYMNS_HOME_AND_CHURCH,
): string {
  const u = new URL(href, CHURCH_ORIGIN);
  u.searchParams.set("lang", "spa");
  if (!u.searchParams.has("crumbs")) {
    u.searchParams.set("crumbs", defaultCrumbs);
  }
  return u.toString();
}
