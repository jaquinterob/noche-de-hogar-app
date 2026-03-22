import { NextResponse } from "next/server";
import {
  HYMNS_ADMIN_COOKIE,
  hymnsAdminCookieOptions,
  signHymnsAdminSession,
  verifyHymnsUnlockKey,
} from "@/lib/hymns-gate";
import { getAppSettings } from "@/lib/models/AppSettings";

export async function POST(request: Request) {
  try {
    let body: { key?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }
    const key = typeof body.key === "string" ? body.key : "";
    const ok = await verifyHymnsUnlockKey(key);
    if (!ok) {
      return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 });
    }
    const settings = await getAppSettings();
    const token = signHymnsAdminSession(settings.hymnsAccessKey);
    const res = NextResponse.json({ success: true });
    res.cookies.set(HYMNS_ADMIN_COOKIE, token, hymnsAdminCookieOptions());
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** Cierra la sesión de administración de himnos. */
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(HYMNS_ADMIN_COOKIE, "", {
    ...hymnsAdminCookieOptions(),
    maxAge: 0,
  });
  return res;
}
