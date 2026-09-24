import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, sesionValida } from "@/lib/sesion";

// Todo el panel y sus datos exigen sesión. Quedan abiertos solo el login y la
// política de privacidad (Meta la pide pública). Si faltan las variables de
// entorno, nadie entra: el panel falla cerrado, nunca abierto.
export async function middleware(req: NextRequest) {
  const ok = await sesionValida(req.cookies.get(COOKIE_SESION)?.value, process.env.PANEL_SECRET);
  if (ok) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sesión expirada. Vuelve a iniciar sesión." }, { status: 401 });
  }
  const login = new URL("/login", req.url);
  if (req.nextUrl.pathname !== "/") login.searchParams.set("volver", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!login|api/login|politica-de-privacidad|_next/|favicon|.*\\.(?:png|svg|jpg|jpeg|ico|webp)$).*)"],
};
