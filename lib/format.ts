export function formatearPrecio(precio: number | null): string {
  if (precio === null) return "—";
  // Formato genérico latinoamericano ($ 25.000). Ajustar el locale si el
  // cliente opera en otro país con convención numérica distinta.
  return `$ ${new Intl.NumberFormat("es-CL").format(precio)}`;
}

export function formatearFecha(fecha: string | null): string | null {
  if (!fecha) return null;
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return fecha;
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
