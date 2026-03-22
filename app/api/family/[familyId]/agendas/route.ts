import { NextResponse } from "next/server";
import mongoose from "mongoose";
import {
  clientAgendaToMongoFields,
  fheDocToClient,
} from "@/lib/fhe-agenda-mongo";
import { isValidFamilyObjectId } from "@/lib/api-object-id";
import { connectDB } from "@/lib/db";
import { Family } from "@/lib/models/Family";
import { FheAgenda, type FheAgendaDoc } from "@/lib/models/FheAgenda";
import type { FamilyHomeEvening } from "@/lib/types/fhe";

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
    const fam = await Family.findById(familyId).lean();
    if (!fam) {
      return NextResponse.json({ error: "Familia no encontrada" }, { status: 404 });
    }
    const oid = new mongoose.Types.ObjectId(familyId);
    const list = await FheAgenda.find({ familyId: oid })
      .sort({ date: -1 })
      .lean();
    return NextResponse.json({
      agendas: list.map((d) =>
        fheDocToClient(d as unknown as FheAgendaDoc),
      ),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

/** Upsert agenda completa (histórico + seguimiento). */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ familyId: string }> },
) {
  const { familyId } = await ctx.params;
  if (!isValidFamilyObjectId(familyId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  try {
    const agenda = (await req.json()) as FamilyHomeEvening;
    if (!agenda?.id || !agenda.date || !agenda.status) {
      return NextResponse.json(
        { error: "Agenda incompleta (id, date, status)" },
        { status: 400 },
      );
    }
    await connectDB();
    const fam = await Family.findById(familyId).lean();
    if (!fam) {
      return NextResponse.json({ error: "Familia no encontrada" }, { status: 404 });
    }
    const oid = new mongoose.Types.ObjectId(familyId);
    const fields = clientAgendaToMongoFields(agenda);
    const doc = await FheAgenda.findOneAndUpdate(
      { familyId: oid, agendaId: agenda.id },
      { $set: { familyId: oid, ...fields } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();
    if (!doc) {
      return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
    }
    return NextResponse.json(
      fheDocToClient(doc as unknown as FheAgendaDoc),
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
