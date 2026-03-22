import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireHymnsAdminApi } from "@/lib/hymns-gate";
import { hymnCanonicalUrl } from "@/lib/hymn-url";
import { Hymn } from "@/lib/models/Hymn";

const SAMPLES = [
  { number: 1001, title: "Santo, santo, santo (ejemplo)" },
  { number: 1002, title: "El amor de nuestro Padre (ejemplo)" },
  { number: 1003, title: "Todas las cosas (ejemplo)" },
].map((h) => ({ ...h, pageUrl: hymnCanonicalUrl(h.number) }));

export async function POST(request: Request) {
  const denied = await requireHymnsAdminApi(request);
  if (denied) return denied;
  try {
    await connectDB();
    let inserted = 0;
    for (const h of SAMPLES) {
      const exists = await Hymn.findOne({ number: h.number });
      if (exists) continue;
      await Hymn.create({
        number: h.number,
        title: h.title,
        pageUrl: h.pageUrl,
        lyrics: "",
        audioUrl: "",
        sheetMusicUrl: "",
      });
      inserted += 1;
    }
    const count = await Hymn.countDocuments();
    return NextResponse.json({ success: true, inserted, count });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
