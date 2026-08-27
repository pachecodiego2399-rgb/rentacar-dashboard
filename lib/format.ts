export function formatearPrecio(precio: number | null): string {
  if (precio === null) return "—";
  // Formato genérico latinoamericano ($ 25.000). Ajustar el locale si el
  // cliente opera en otro país con convención numérica distinta.
  return `$ ${new Intl.NumberFormat("es-CL").format(precio)}`;
}

const FECHA_SOLO_REGEX = /^(\d{4})-(\d{2})-(\d{2})/;

export function formatearFecha(fecha: string | null): string | null {
  if (!fecha) return null;

  // Airtable guarda estas fechas sin hora ("AAAA-MM-DD"). Si las
  // parseamos con `new Date("AAAA-MM-DD")`, JavaScript las interpreta como
  // medianoche UTC, y en cualquier huso horario "atrasado" respecto a UTC
  // (como Chile) el día mostrado queda uno antes del real. Para evitarlo,
  // armamos la fecha a partir de sus componentes en hora local en vez de
  // parsear el string ISO directamente.
  const match = FECHA_SOLO_REGEX.exec(fecha);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(fecha);

  if (Number.isNaN(date.getTime())) return fecha;
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Para timestamps completos (con hora), a diferencia de `formatearFecha`.
 * Se usa para el campo "Última actualización de estado" de un cliente, que
 * en Airtable es un campo "Last Modified Time" con hora y zona horaria
 * incluidas (no hace falta el ajuste manual de `formatearFecha`: al venir
 * con hora y zona, `new Date(...)` lo interpreta bien en cualquier huso).
 */
export function formatearFechaHora(fecha: string | null): string | null {
  if (!fecha) return null;
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return fecha;
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
