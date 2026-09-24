// Sesión del panel: una "credencial" firmada que el servidor le entrega al
// navegador cuando la contraseña es correcta. Contiene solo la fecha de
// vencimiento y una firma HMAC-SHA256 hecha con PANEL_SECRET, que nunca sale
// del servidor: sin conocer ese secreto no se puede fabricar ni alterar.
//
// Usa Web Crypto para funcionar tanto en el middleware (edge) como en las
// rutas de API (node).

export const COOKIE_SESION = "panel_sesion";
export const DURACION_SESION_SEG = 60 * 60 * 24 * 30; // 30 días

const codificador = new TextEncoder();

function base64url(bytes: ArrayBuffer): string {
  let bin = "";
  new Uint8Array(bytes).forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function firmar(texto: string, secreto: string): Promise<string> {
  const clave = await crypto.subtle.importKey(
    "raw",
    codificador.encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return base64url(await crypto.subtle.sign("HMAC", clave, codificador.encode(texto)));
}

/** Comparación en tiempo constante, para no filtrar pistas por cuánto tarda. */
export function iguales(a: string, b: string): boolean {
  const ba = codificador.encode(a);
  const bb = codificador.encode(b);
  let dif = ba.length ^ bb.length;
  for (let i = 0; i < Math.max(ba.length, bb.length); i++) dif |= (ba[i] ?? 0) ^ (bb[i] ?? 0);
  return dif === 0;
}

export async function crearSesion(secreto: string): Promise<string> {
  const vence = Math.floor(Date.now() / 1000) + DURACION_SESION_SEG;
  const cuerpo = `v1.${vence}`;
  return `${cuerpo}.${await firmar(cuerpo, secreto)}`;
}

export async function sesionValida(token: string | undefined, secreto: string | undefined): Promise<boolean> {
  if (!token || !secreto) return false;
  const partes = token.split(".");
  if (partes.length !== 3 || partes[0] !== "v1") return false;
  const vence = Number(partes[1]);
  if (!Number.isFinite(vence) || vence * 1000 < Date.now()) return false;
  return iguales(partes[2], await firmar(`${partes[0]}.${partes[1]}`, secreto));
}
