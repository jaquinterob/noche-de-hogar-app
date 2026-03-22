import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAppSettings } from "@/lib/models/AppSettings";

export const HYMNS_ADMIN_COOKIE = "noche_hymns_admin";

function cookieSecret(): string {
  const s = process.env.HYMNS_COOKIE_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "development") {
    return "dev-noche-hogar-hymns-cookie-secret-cambiar";
  }
  throw new Error(
    "HYMNS_COOKIE_SECRET (mín. 16 caracteres) es obligatorio en producción",
  );
}

function fingerprintKey(dbKey: string): string {
  return createHash("sha256").update(dbKey, "utf8").digest("hex");
}

function hashAttempt(input: string): Buffer {
  return createHash("sha256").update(input, "utf8").digest();
}

/** Compara la clave enviada con la guardada en MongoDB (resistente a timing). */
export async function verifyHymnsUnlockKey(input: string): Promise<boolean> {
  const settings = await getAppSettings();
  const a = hashAttempt(input);
  const b = hashAttempt(settings.hymnsAccessKey);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function signHymnsAdminSession(dbKey: string): string {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90;
  const k = fingerprintKey(dbKey);
  const payload = Buffer.from(JSON.stringify({ exp, k }), "utf8").toString(
    "base64url",
  );
  const sig = createHmac("sha256", cookieSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyHymnsAdminSessionToken(
  token: string,
  dbKey: string,
): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sig] = parts;
  const expectedSig = createHmac("sha256", cookieSecret())
    .update(payloadB64)
    .digest("base64url");
  try {
    const sigBuf = Buffer.from(sig, "utf8");
    const expBuf = Buffer.from(expectedSig, "utf8");
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }
  } catch {
    return false;
  }
  let payload: { exp: number; k: string };
  try {
    payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as { exp: number; k: string };
  } catch {
    return false;
  }
  if (typeof payload.exp !== "number" || typeof payload.k !== "string") {
    return false;
  }
  if (payload.exp < Math.floor(Date.now() / 1000)) return false;
  if (payload.k !== fingerprintKey(dbKey)) return false;
  return true;
}

function readTokenFromCookieHeader(header: string | null): string | null {
  if (!header) return null;
  const parts = header.split(";");
  for (const p of parts) {
    const [name, ...rest] = p.trim().split("=");
    if (name === HYMNS_ADMIN_COOKIE && rest.length) {
      return decodeURIComponent(rest.join("=").trim());
    }
  }
  return null;
}

export async function hasHymnsAdminCookie(
  cookieHeader: string | null,
): Promise<boolean> {
  const token = readTokenFromCookieHeader(cookieHeader);
  if (!token) return false;
  const settings = await getAppSettings();
  return verifyHymnsAdminSessionToken(token, settings.hymnsAccessKey);
}

export async function hasHymnsAdminFromCookies(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(HYMNS_ADMIN_COOKIE)?.value;
  if (!token) return false;
  const settings = await getAppSettings();
  return verifyHymnsAdminSessionToken(token, settings.hymnsAccessKey);
}

/** Para rutas API: devuelve `NextResponse` 401 o `null` si OK. */
export async function requireHymnsAdminApi(
  request: Request,
): Promise<NextResponse | null> {
  const ok = await hasHymnsAdminCookie(request.headers.get("cookie"));
  if (!ok) {
    return NextResponse.json(
      { error: "No autorizado. Accede con clave en /himnos/acceso." },
      { status: 401 },
    );
  }
  return null;
}

export function hymnsAdminCookieOptions() {
  const maxAge = 60 * 60 * 24 * 90;
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
