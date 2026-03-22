import mongoose, { Schema, model, models } from "mongoose";

const FamilyMemberSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    emoji: { type: String, default: "" },
  },
  { _id: false },
);

const FamilySchema = new Schema(
  {
    /** Apellidos / nombre del hogar */
    lastName: { type: String, required: true, trim: true },
    members: { type: [FamilyMemberSchema], default: [] },
  },
  { timestamps: true },
);

export type FamilyMemberSub = {
  id: string;
  name: string;
  emoji?: string;
};

export type FamilyDoc = mongoose.InferSchemaType<typeof FamilySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Family = models.Family ?? model("Family", FamilySchema);
