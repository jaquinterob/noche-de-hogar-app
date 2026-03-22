import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Family } from "@/lib/models/Family";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { lastName?: string };
    const lastName = (body.lastName ?? "").trim();
    if (!lastName) {
      return NextResponse.json(
        { error: "lastName es obligatorio" },
        { status: 400 },
      );
    }
    await connectDB();
    const doc = await Family.create({ lastName, members: [] });
    return NextResponse.json({
      id: String(doc._id),
      lastName: doc.lastName,
      members: doc.members ?? [],
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "No se pudo crear la familia" },
      { status: 500 },
    );
  }
}
