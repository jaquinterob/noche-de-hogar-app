import mongoose, { Schema, model, models } from "mongoose";

const HymnSchema = new Schema(
  {
    number: { type: Number, required: true, unique: true },
    title: { type: String, default: "" },
    lyrics: { type: String, default: "" },
    audioUrl: { type: String, default: "" },
    pageUrl: { type: String, default: "" },
    sheetMusicUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

HymnSchema.index({ title: "text" });

export type HymnDoc = mongoose.InferSchemaType<typeof HymnSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Hymn = models.Hymn ?? model("Hymn", HymnSchema);
