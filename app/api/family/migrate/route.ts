import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { clientAgendaToMongoFields, fheDocToClient } from "@/lib/fhe-agenda-mongo";
import type { FheAgendaDoc } from "@/lib/models/FheAgenda";
import { connectDB } from "@/lib/db";
import { Family } from "@/lib/models/Family";
import { FheAgenda } from "@/lib/models/FheAgenda";
import type { FamilyHomeEvening, FamilyMember } from "@/lib/types/fhe";

type MigrateBody = {
  lastName?: string;
  members?: FamilyMember[];
  agendas?: FamilyHomeEvening[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as MigrateBody;
    const lastName = (body.lastName ?? "").trim();
    const members = Array.isArray(body.members) ? body.members : [];
    const agendas = Array.isArray(body.agendas) ? body.agendas : [];

    if (!lastName && members.length === 0 && agendas.length === 0) {
      return NextResponse.json(
        { error: "No hay datos que migrar" },
        { status: 400 },
      );
    }

    await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const fam = await Family.create(
        [
          {
            lastName: lastName || "Familia",
            members,
          },
        ],
        { session },
      );
      const familyId = fam[0]!._id;

      if (agendas.length > 0) {
        const docs = agendas.map((a) => ({
          familyId,
          ...clientAgendaToMongoFields(a),
        }));
        await FheAgenda.insertMany(docs, { session });
      }

      await session.commitTransaction();
      const id = String(familyId);
      const created = await Family.findById(id).lean();
      const agendaDocs = await FheAgenda.find({ familyId }).lean();
      return NextResponse.json({
        id,
        lastName: created?.lastName ?? "",
        members: created?.members ?? [],
        agendas: agendaDocs.map((d) => fheDocToClient(d as unknown as FheAgendaDoc)),
      });
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Migración fallida" },
      { status: 500 },
    );
  }
}
