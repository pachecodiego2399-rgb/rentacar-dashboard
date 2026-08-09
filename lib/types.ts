export type EstadoAuto = "Disponible" | "Arrendado" | "Mantención";

export interface Auto {
  id: string;
  nombre: string;
  patente: string;
  estado: EstadoAuto;
  precioPorDia: number | null;
  requisitos: string;
  fechaDevolucion: string | null;
}

export interface AutosPorEstado {
  Disponible: Auto[];
  Arrendado: Auto[];
  "Mantención": Auto[];
}

export interface ResumenAutos {
  total: number;
  disponibles: number;
  arrendados: number;
  enMantencion: number;
}

export interface AutosResponse {
  autos: Auto[];
  resumen: ResumenAutos;
}
