import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Hymn } from "@/lib/models/Hymn";
import { hymnToJSON } from "@/lib/hymn-serialize";

const MAX = 3000;

function escapeRx(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Catálogo público para planificación (lista + filtro). No requiere sesión de admin.
 */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();

  try {
    await connectDB();

    if (!q) {
      const rows = await Hymn.find({})
        .sort({ number: 1 })
        .limit(MAX)
        .lean();
      return NextResponse.json(
        rows.map((r) =>
          hymnToJSON({
            _id: r._id as { toString(): string },
            number: r.number,
            title: r.title,
            lyrics: r.lyrics,
            audioUrl: r.audioUrl,
            pageUrl: r.pageUrl,
            sheetMusicUrl: r.sheetMusicUrl,
          }),
        ),
      );
    }

    if (/^\d+$/.test(q)) {
      const rows = await Hymn.find({})
        .sort({ number: 1 })
        .limit(MAX)
        .lean();
      const filtered = rows.filter((r) => String(r.number).startsWith(q));
      return NextResponse.json(
        filtered.map((r) =>
          hymnToJSON({
            _id: r._id as { toString(): string },
            number: r.number,
            title: r.title,
            lyrics: r.lyrics,
            audioUrl: r.audioUrl,
            pageUrl: r.pageUrl,
            sheetMusicUrl: r.sheetMusicUrl,
          }),
        ),
      );
    }

    const rx = new RegExp(escapeRx(q), "i");
    const rows = await Hymn.find({
      $or: [{ title: rx }, { lyrics: rx }],
    })
      .sort({ number: 1 })
      .limit(MAX)
      .lean();

    return NextResponse.json(
      rows.map((r) =>
        hymnToJSON({
          _id: r._id as { toString(): string },
          number: r.number,
          title: r.title,
          lyrics: r.lyrics,
          audioUrl: r.audioUrl,
          pageUrl: r.pageUrl,
          sheetMusicUrl: r.sheetMusicUrl,
        }),
      ),
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
