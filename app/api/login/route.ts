import { NextResponse } from "next/server";
import { COOKIE_SESION, DURACION_SESION_SEG, crearSesion, iguales } from "@/lib/sesion";

/**
 * POST /api/login   body: { contrasena }
 * Si coincide con PANEL_PASSWORD, entrega la cookie de sesión firmada
 * (httpOnly: el JavaScript de la página no puede leerla).
 */
export async function POST(request: Request) {
  const clave = process.env.PANEL_PASSWORD;
  const secreto = process.env.PANEL_SECRET;
  if (!clave || !secreto) {
    return NextResponse.json({ error: "El acceso al panel no está configurado." }, { status: 503 });
  }

  const { contrasena } = ((await request.json().catch(() => null)) as { contrasena?: unknown } | null) ?? {};
  if (typeof contrasena !== "string" || !iguales(contrasena, clave)) {
    // Pausa en cada intento fallido: frena a quien pruebe contraseñas en masa.
    await new Promise((r) => setTimeout(r, 900));
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESION, await crearSesion(secreto), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION_SEG,
  });
  return res;
}
