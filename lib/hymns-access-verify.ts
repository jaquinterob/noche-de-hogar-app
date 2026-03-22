import { createHash, timingSafeEqual } from "crypto";
import { getAppSettings } from "@/lib/models/AppSettings";

/**
 * Compara la clave con `appsettings.hymnsAccessKey` (resistente a timing).
 * Sin dependencias de Next (sirve para `yarn scrape` y para la API de unlock).
 */
export async function verifyHymnsAccessKeyPlain(
  input: string,
): Promise<boolean> {
  const settings = await getAppSettings();
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(settings.hymnsAccessKey, "utf8").digest();
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
