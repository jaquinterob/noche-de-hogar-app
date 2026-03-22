import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Hymn } from "@/lib/models/Hymn";
import { hymnToJSON } from "@/lib/hymn-serialize";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  try {
    await connectDB();
    const row = await Hymn.findById(id).lean();
    if (!row) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json(
      hymnToJSON({
        _id: row._id as { toString(): string },
        number: row.number,
        title: row.title,
        lyrics: row.lyrics,
        audioUrl: row.audioUrl,
        pageUrl: row.pageUrl,
        sheetMusicUrl: row.sheetMusicUrl,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
