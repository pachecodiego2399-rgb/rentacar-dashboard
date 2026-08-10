import type { Auto, ResumenAutos } from "./types";

/**
 * Cálculo de resumen de flota por estado. Vive separado de
 * `lib/airtable.ts` (que importa "server-only") porque también lo
 * necesitamos del lado del cliente para reflejar al instante los cambios
 * de estado que hace Salvador desde el dashboard, sin esperar al próximo
 * polling.
 */
export function calcularResumen(autos: Auto[]): ResumenAutos {
  return {
    total: autos.length,
    disponibles: autos.filter((a) => a.estado === "Disponible").length,
    arrendados: autos.filter((a) => a.estado === "Arrendado").length,
    enMantencion: autos.filter((a) => a.estado === "Mantención").length,
  };
}
