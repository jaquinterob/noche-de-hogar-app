import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireHymnsAdminApi } from "@/lib/hymns-gate";
import { Hymn } from "@/lib/models/Hymn";
import { hymnToJSON } from "@/lib/hymn-serialize";

export async function GET(request: Request) {
  const denied = await requireHymnsAdminApi(request);
  if (denied) return denied;
  try {
    await connectDB();
    const rows = await Hymn.find().sort({ number: 1 }).lean();
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
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }),
      ),
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
