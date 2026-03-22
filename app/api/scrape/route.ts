import { NextResponse } from "next/server";
import { requireHymnsAdminApi } from "@/lib/hymns-gate";
import { runHymnsScraper } from "@/lib/scraper";

/** Límite alto para despliegues que lo permitan; corrida completa preferible con `yarn scrape`. */
export const maxDuration = 300;

export async function POST(request: Request) {
  const denied = await requireHymnsAdminApi(request);
  if (denied) return denied;
  try {
    const result = await runHymnsScraper();
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { success: false, error: msg, processed: 0, upserted: 0, errors: [] },
      { status: 500 },
    );
  }
}
