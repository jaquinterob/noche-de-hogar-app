import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireHymnsAdminApi } from "@/lib/hymns-gate";
import { Hymn } from "@/lib/models/Hymn";

export async function GET(request: Request) {
  const denied = await requireHymnsAdminApi(request);
  if (denied) return denied;
  try {
    await connectDB();
    const count = await Hymn.countDocuments();
    return NextResponse.json({ count });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
