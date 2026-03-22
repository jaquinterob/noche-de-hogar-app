import mongoose from "mongoose";

export function isValidFamilyObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && id.length === 24;
}
