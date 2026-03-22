import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) global.mongooseCache = cache;

export async function connectDB(): Promise<typeof mongoose> {
  // Leer aquí (no al importar el módulo) para que scripts como `yarn scrape`
  // puedan cargar dotenv antes de la primera conexión.
  const uri = process.env.MONGODB_URI;
  if (!uri?.trim()) {
    throw new Error(
      "Define MONGODB_URI en .env.local (ver .env.local.example).",
    );
  }
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(uri);
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
