import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Hymn } from "@/lib/models/Hymn";
import { hymnToJSON } from "@/lib/hymn-serialize";

const LIMIT = 50;

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q) {
    return NextResponse.json([]);
  }

  try {
    await connectDB();
    if (/^\d+$/.test(q)) {
      const num = parseInt(q, 10);
      const byNum = await Hymn.find({
        number: { $gte: num, $lt: num + 100 },
      })
        .sort({ number: 1 })
        .limit(LIMIT)
        .lean();
      const str = q;
      const filtered = byNum.filter((r) =>
        String(r.number).startsWith(str),
      );
      const rows = filtered.length > 0 ? filtered : byNum;
      return NextResponse.json(
        rows.slice(0, LIMIT).map((r) =>
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

    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const rows = await Hymn.find({
      $or: [{ title: rx }, { lyrics: rx }],
    })
      .sort({ number: 1 })
      .limit(LIMIT)
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
