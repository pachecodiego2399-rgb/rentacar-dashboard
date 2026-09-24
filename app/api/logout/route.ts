import { NextResponse } from "next/server";
import { COOKIE_SESION } from "@/lib/sesion";

// POST /api/logout — borra la sesión de este dispositivo.
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESION, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
