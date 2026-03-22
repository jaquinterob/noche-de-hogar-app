import { chromium, type BrowserContext } from "playwright";
import { connectDB } from "@/lib/db";
import {
  CRUMBS_HYMNS_CLASSIC,
  CRUMBS_HYMNS_HOME_AND_CHURCH,
  HYMNS_CLASSIC_COLLECTION_LIST_URL,
  HYMNS_COLLECTION_LIST_URL,
  hymnCollectionEntryUrl,
  normalizeSongPageUrl,
} from "@/lib/hymn-url";
import { Hymn } from "@/lib/models/Hymn";

/** Solo si la lista de la web falla y hay que intentar URL por número. */
const DEFAULT_FROM = 1001;
const DEFAULT_TO = 1210;

type ScrapedRow = { number: number; title: string; pageUrl: string };

function parseFallbackRange(): { from: number; to: number } {
  const from = Number(process.env.SCRAPE_FROM) || DEFAULT_FROM;
  const to = Number(process.env.SCRAPE_TO) || DEFAULT_TO;
  return { from: Math.min(from, to), to: Math.max(from, to) };
}

/**
 * Si defines SCRAPE_FROM y/o SCRAPE_TO, se filtra la lista extraída de la web.
 * Si no defines ninguno, se importan todos los himnos que aparezcan en la página
 * (los números no son consecutivos: p. ej. salto de 1062 a 1201).
 */
function parseListFilter(): { from: number | null; to: number | null } {
  const hasFrom = process.env.SCRAPE_FROM !== undefined;
  const hasTo = process.env.SCRAPE_TO !== undefined;
  if (!hasFrom && !hasTo) return { from: null, to: null };
  const from = Number(process.env.SCRAPE_FROM) || DEFAULT_FROM;
  const to = Number(process.env.SCRAPE_TO) || DEFAULT_TO;
  return { from: Math.min(from, to), to: Math.max(from, to) };
}

async function extractTitleFromSongPage(page: import("playwright").Page): Promise<string> {
  return page.evaluate(() => {
    const norm = (s: string | null | undefined) =>
      (s || "").replace(/\s+/g, " ").trim();
    const aside =
      document.querySelector("aside") ||
      document.querySelector('[role="complementary"]') ||
      document.querySelector('[class*="sidebar"]');
    if (aside) {
      for (const sel of ["h1", "h2", '[class*="title"]', '[class*="headline"]']) {
        const el = aside.querySelector(sel);
        const tx = norm(el?.textContent);
        if (tx.length > 2 && !/^número de canción$/i.test(tx)) return tx;
      }
    }
    const og = document
      .querySelector('meta[property="og:title"]')
      ?.getAttribute("content");
    if (og) return norm(og.split("|")[0]);
    const h1 = document.querySelector("h1");
    return norm(h1?.textContent);
  });
}

/**
 * Une dos mapas: entradas de `extra` solo se añaden si el número no existe en `base`
 * (evita pisar himnos de “hogar e Iglesia” si hubiera el mismo número en el libro clásico).
 */
function mergeHymnMaps(
  base: Map<number, ScrapedRow>,
  extra: Map<number, ScrapedRow>,
): Map<number, ScrapedRow> {
  const out = new Map(base);
  let skipped = 0;
  for (const [n, row] of extra) {
    if (out.has(n)) {
      skipped += 1;
      continue;
    }
    out.set(n, row);
  }
  if (skipped > 0) {
    console.log(
      `Fusión: ${skipped} números de la segunda colección ya estaban en la primera; se conserva la primera.`,
    );
  }
  return out;
}

/**
 * Desde una página de lista: enlaces a /media/music/songs/ con texto "NNN. Título".
 */
async function scrapeListPageIntoMap(
  page: import("playwright").Page,
  listUrl: string,
  defaultCrumbs: string,
  label: string,
): Promise<Map<number, ScrapedRow>> {
  const map = new Map<number, ScrapedRow>();

  await page.goto(listUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2000);

  /** Cuenta enlaces a canciones cuyo texto parece "NNN. Título". */
  const countSongAnchors = () =>
    page.evaluate(() => {
      let n = 0;
      for (const a of document.querySelectorAll('a[href*="/media/music/songs/"]')) {
        const t = (a.textContent || "").replace(/\s+/g, " ").trim();
        if (/^\d+\.\s+.+/.test(t)) n += 1;
      }
      return n;
    });

  let lastCount = 0;
  let stable = 0;
  for (let scroll = 0; scroll < 60; scroll++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(550);
    const c = await countSongAnchors();
    if (c === lastCount && c > 0) {
      stable += 1;
      if (stable >= 3) break;
    } else {
      stable = 0;
    }
    lastCount = c;
  }

  const rows = await page.evaluate(() => {
    const out: { number: number; title: string; href: string }[] = [];
    const anchors = document.querySelectorAll('a[href*="/media/music/songs/"]');
    for (const a of anchors) {
      const href = a.getAttribute("href");
      if (!href) continue;
      const text = (a.textContent || "").replace(/\s+/g, " ").trim();
      const m = text.match(/^(\d+)\.\s*(.+)$/);
      if (!m) continue;
      const num = parseInt(m[1], 10);
      const title = m[2].trim();
      try {
        const abs = new URL(href, window.location.origin).href;
        out.push({ number: num, title, href: abs });
      } catch {
        /* ignore */
      }
    }
    return out;
  });

  for (const r of rows) {
    if (!map.has(r.number)) {
      map.set(r.number, {
        number: r.number,
        title: r.title,
        pageUrl: normalizeSongPageUrl(r.href, defaultCrumbs),
      });
    }
  }

  console.log(`  ${label}: ${map.size} himnos`);
  return map;
}

/**
 * Abre …/collections/hymns-for-home-and-church/{n}?lang=spa y obtiene URL final /songs/… + título.
 */
async function resolveHymnByNumber(
  context: BrowserContext,
  n: number
): Promise<ScrapedRow | undefined> {
  const page = await context.newPage();
  try {
    const entry = hymnCollectionEntryUrl(n);
    await page.goto(entry, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2500);

    let url = page.url();
    if (!url.includes("/media/music/songs/")) {
      try {
        await page.waitForURL("**/media/music/songs/**", { timeout: 12000 });
        url = page.url();
      } catch {
        /* seguir */
      }
    }

    if (!url.includes("/media/music/songs/")) {
      const foundHref = await page.evaluate((num) => {
        const links = document.querySelectorAll('a[href*="/media/music/songs/"]');
        const re = new RegExp(`^\\s*${num}\\.`);
        for (const a of links) {
          const t = (a.textContent || "").replace(/\s+/g, " ").trim();
          if (re.test(t)) return (a as HTMLAnchorElement).href;
        }
        return null;
      }, n);
      if (foundHref) {
        await page.goto(foundHref, { waitUntil: "domcontentloaded", timeout: 45000 });
        await page.waitForTimeout(1200);
        url = page.url();
      }
    }

    if (!url.includes("/media/music/songs/")) {
      console.warn(`No se pudo resolver /songs/ para himno ${n}`);
      return undefined;
    }

    const title = await extractTitleFromSongPage(page);
    const pageUrl = normalizeSongPageUrl(url);
    const finalTitle =
      title && title.length > 0 ? title : `Himno ${n}`;

    return { number: n, title: finalTitle, pageUrl };
  } finally {
    await page.close();
  }
}

export type HymnScrapeProgress = { number: number; ok: boolean };

export async function runScraper(options?: {
  onProgress?: (p: HymnScrapeProgress) => void;
}): Promise<{ updated: number; errors: string[] }> {
  const onProgress = options?.onProgress;
  const listFilter = parseListFilter();
  const errors: string[] = [];
  let updated = 0;

  await connectDB();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: "es-ES",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const listPage = await context.newPage();
  let byNumber: Map<number, ScrapedRow> = new Map();
  try {
    console.log("Leyendo listas oficiales…");
    let home = new Map<number, ScrapedRow>();
    let classic = new Map<number, ScrapedRow>();
    try {
      home = await scrapeListPageIntoMap(
        listPage,
        HYMNS_COLLECTION_LIST_URL,
        CRUMBS_HYMNS_HOME_AND_CHURCH,
        "Hogar e Iglesia",
      );
    } catch (e) {
      console.warn("No se pudo leer la lista Hogar e Iglesia:", e);
    }
    try {
      classic = await scrapeListPageIntoMap(
        listPage,
        HYMNS_CLASSIC_COLLECTION_LIST_URL,
        CRUMBS_HYMNS_CLASSIC,
        "Himnos (clásico)",
      );
    } catch (e) {
      console.warn("No se pudo leer la lista Himnos (clásico):", e);
    }
    byNumber = mergeHymnMaps(home, classic);
    console.log(
      `Total tras fusionar colecciones: ${byNumber.size} himnos (enlace a /songs/)`,
    );
  } finally {
    await listPage.close();
  }

  let numbersToProcess: number[];
  if (byNumber.size > 0) {
    numbersToProcess = [...byNumber.keys()].sort((a, b) => a - b);
    if (listFilter.from !== null && listFilter.to !== null) {
      const lo = listFilter.from;
      const hi = listFilter.to;
      numbersToProcess = numbersToProcess.filter((n) => n >= lo && n <= hi);
    }
    if (numbersToProcess.length > 0) {
      const first = numbersToProcess[0];
      const last = numbersToProcess[numbersToProcess.length - 1];
      console.log(
        `Colección: ${numbersToProcess.length} himnos (aprox. #${first}–#${last}; hay saltos, p. ej. tras 1062 sigue 1201).`,
      );
    } else {
      console.warn(
        "Lista leída pero, tras SCRAPE_FROM/SCRAPE_TO, no quedó ningún himno.",
      );
    }
  } else {
    const { from, to } = parseFallbackRange();
    console.warn(
      `Lista vacía: modo respaldo ${from}–${to} (puede registrar errores en números inexistentes).`,
    );
    numbersToProcess = [];
    for (let n = from; n <= to; n++) numbersToProcess.push(n);
  }

  const prune =
    process.env.SCRAPE_PRUNE === "1" || process.env.SCRAPE_PRUNE === "true";
  if (prune && byNumber.size >= 50) {
    if (listFilter.from !== null) {
      console.warn(
        "SCRAPE_PRUNE ignorado si defines SCRAPE_FROM/SCRAPE_TO (para no borrar himnos fuera del rango de prueba).",
      );
    } else {
      const keep = [...byNumber.keys()];
      const del = await Hymn.deleteMany({ number: { $nin: keep } });
      if (del.deletedCount) {
        console.log(
          `SCRAPE_PRUNE: eliminados ${del.deletedCount} himnos que ya no están en la lista oficial.`,
        );
      }
    }
  }

  for (const n of numbersToProcess) {
    try {
      const fromList = byNumber.get(n);
      const row =
        fromList ?? (await resolveHymnByNumber(context, n));
      if (!row) {
        errors.push(`Himno ${n}: sin URL de canción`);
        onProgress?.({ number: n, ok: false });
        continue;
      }

      await Hymn.findOneAndUpdate(
        { number: n },
        {
          number: n,
          title: row.title,
          pageUrl: row.pageUrl,
          lyrics: "",
          audioUrl: "",
          sheetMusicUrl: "",
        },
        { upsert: true, new: true }
      );
      updated += 1;
      onProgress?.({ number: n, ok: true });
      if (updated % 25 === 0) {
        console.log(`Progreso: ${updated} himnos guardados (último: ${n})`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Himno ${n}: ${msg}`);
      onProgress?.({ number: n, ok: false });
    }
  }

  await browser.close();
  return { updated, errors };
}

/** Compatibilidad con API y script: mismos campos que antes. */
export async function runHymnsScraper(options?: {
  onProgress?: (p: HymnScrapeProgress) => void;
}): Promise<{
  success: boolean;
  upserted: number;
  titlesFromPage: number;
  errors: string[];
}> {
  const { updated, errors } = await runScraper(options);
  return {
    success: true,
    upserted: updated,
    titlesFromPage: updated,
    errors,
  };
}
