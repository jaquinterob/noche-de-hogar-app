import mongoose, { Schema, model, models } from "mongoose";
import { connectDB } from "@/lib/db";

const SINGLETON_KEY = "singleton";

const AppSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: SINGLETON_KEY },
    /** Clave para acceder a la administración de himnos (cambiable en BD). */
    hymnsAccessKey: { type: String, required: true, default: "matrimonio" },
  },
  { timestamps: true },
);

export type AppSettingsDoc = mongoose.InferSchemaType<typeof AppSettingsSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AppSettings =
  models.AppSettings ?? model("AppSettings", AppSettingsSchema);

/** Documento único de ajustes; crea el registro por defecto si no existe. */
export async function getAppSettings(): Promise<AppSettingsDoc> {
  await connectDB();
  let doc = await AppSettings.findOne({ key: SINGLETON_KEY });
  if (!doc) {
    doc = await AppSettings.create({
      key: SINGLETON_KEY,
      hymnsAccessKey: "matrimonio",
    });
  }
  return doc;
}
