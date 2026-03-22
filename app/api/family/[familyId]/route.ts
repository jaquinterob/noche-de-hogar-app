import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isValidFamilyObjectId } from "@/lib/api-object-id";
import { Family } from "@/lib/models/Family";
import type { FamilyMember } from "@/lib/types/fhe";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ familyId: string }> },
) {
  const { familyId } = await ctx.params;
  if (!isValidFamilyObjectId(familyId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  try {
    await connectDB();
    const doc = await Family.findById(familyId).lean();
    if (!doc) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({
      id: String(doc._id),
      lastName: doc.lastName,
      members: doc.members ?? [],
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ familyId: string }> },
) {
  const { familyId } = await ctx.params;
  if (!isValidFamilyObjectId(familyId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  try {
    const body = (await req.json()) as {
      lastName?: string;
      members?: FamilyMember[];
    };
    const patch: { lastName?: string; members?: FamilyMember[] } = {};
    if (typeof body.lastName === "string") {
      patch.lastName = body.lastName.trim();
    }
    if (Array.isArray(body.members)) {
      patch.members = body.members;
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "Nada que actualizar" },
        { status: 400 },
      );
    }
    await connectDB();
    const doc = await Family.findByIdAndUpdate(
      familyId,
      { $set: patch },
      { new: true, runValidators: true },
    ).lean();
    if (!doc) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({
      id: String(doc._id),
      lastName: doc.lastName,
      members: doc.members ?? [],
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
