import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { fheDocToClient } from "@/lib/fhe-agenda-mongo";
import { isValidFamilyObjectId } from "@/lib/api-object-id";
import { connectDB } from "@/lib/db";
import { Family } from "@/lib/models/Family";
import { FheAgenda, type FheAgendaDoc } from "@/lib/models/FheAgenda";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ familyId: string; agendaId: string }> },
) {
  const { familyId, agendaId } = await ctx.params;
  if (!isValidFamilyObjectId(familyId) || !agendaId?.trim()) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }
  try {
    await connectDB();
    const fam = await Family.findById(familyId).lean();
    if (!fam) {
      return NextResponse.json({ error: "Familia no encontrada" }, { status: 404 });
    }
    const oid = new mongoose.Types.ObjectId(familyId);
    const doc = await FheAgenda.findOne({
      familyId: oid,
      agendaId: agendaId.trim(),
    }).lean();
    if (!doc) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }
    return NextResponse.json(
      fheDocToClient(doc as unknown as FheAgendaDoc),
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ familyId: string; agendaId: string }> },
) {
  const { familyId, agendaId } = await ctx.params;
  if (!isValidFamilyObjectId(familyId) || !agendaId?.trim()) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }
  try {
    await connectDB();
    const oid = new mongoose.Types.ObjectId(familyId);
    const doc = await FheAgenda.findOne({
      familyId: oid,
      agendaId: agendaId.trim(),
    }).lean();
    if (!doc) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }
    if (doc.status === "completed") {
      return NextResponse.json(
        { error: "No se puede borrar una agenda del histórico" },
        { status: 403 },
      );
    }
    await FheAgenda.deleteOne({ _id: doc._id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
