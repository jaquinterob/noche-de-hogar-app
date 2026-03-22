import mongoose, { Schema, model, models } from "mongoose";

/**
 * Agenda de Noche de Hogar ligada a una familia (`familyId`).
 * `agendaId` = UUID público (misma que `FamilyHomeEvening.id` en cliente).
 */
const FheAgendaSchema = new Schema(
  {
    familyId: {
      type: Schema.Types.ObjectId,
      ref: "Family",
      required: true,
      index: true,
    },
    agendaId: { type: String, required: true },
    date: { type: String, required: true },
    status: {
      type: String,
      enum: ["planned", "completed"],
      required: true,
    },
    completedAt: { type: String, default: "" },
    preside: { type: String, default: "" },
    conducts: { type: String, default: "" },
    welcomeBy: { type: String, default: "" },
    openingHymn: { type: String, default: "" },
    openingHymnUrl: { type: String, default: "" },
    openingPrayer: { type: String, default: "" },
    spiritualThoughtBy: { type: String, default: "" },
    optionalHymn: { type: String, default: "" },
    optionalHymnUrl: { type: String, default: "" },
    mainMessageBy: { type: String, default: "" },
    activityBy: { type: String, default: "" },
    activityDescription: { type: String, default: "" },
    closingHymn: { type: String, default: "" },
    closingHymnUrl: { type: String, default: "" },
    closingPrayer: { type: String, default: "" },
    completedSteps: { type: Schema.Types.Mixed, default: {} },
    sessionStartedAt: { type: String, default: "" },
    stepCompletedAt: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

FheAgendaSchema.index({ familyId: 1, agendaId: 1 }, { unique: true });

export type FheAgendaDoc = mongoose.InferSchemaType<typeof FheAgendaSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const FheAgenda =
  models.FheAgenda ?? model("FheAgenda", FheAgendaSchema);
