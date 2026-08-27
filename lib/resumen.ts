import type { Auto, Cliente, ResumenAutos, ResumenClientes } from "./types";

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

/**
 * Ídem para clientes: separado de `lib/airtable.ts` para poder recalcular
 * el resumen en el cliente sin volver a pegarle a la API.
 */
export function calcularResumenClientes(clientes: Cliente[]): ResumenClientes {
  return {
    total: clientes.length,
    enConversacion: clientes.filter((c) => c.estado === "En conversación").length,
    calificados: clientes.filter((c) => c.estado === "Calificado").length,
    listosParaRetirar: clientes.filter((c) => c.estado === "Listo para retirar").length,
    necesitaAyudaHumana: clientes.filter((c) => c.estado === "Necesita ayuda humana").length,
    completados: clientes.filter((c) => c.estado === "Completado").length,
  };
}
