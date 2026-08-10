import type { EstadoAuto } from "./types";

interface EstadoStyle {
  label: string;
  /** Punto de color pequeño (indicadores, dots) */
  dot: string;
  /** Acento del borde izquierdo de la tarjeta */
  border: string;
  /** Fondo sólido para el badge tipo "marcador de sendero" */
  solidBg: string;
  /** Color de texto legible sobre `solidBg` */
  solidText: string;
}

export const ESTADOS: EstadoAuto[] = ["Disponible", "Arrendado", "Mantención"];

// Mapeo temático (no configurable por cliente): verde bosque = disponible
// y listo para salir, dorado = activo/en ruta, carbón = fuera de servicio.
export const ESTADO_STYLES: Record<EstadoAuto, EstadoStyle> = {
  Disponible: {
    label: "Disponible",
    dot: "bg-brand-forest",
    border: "border-l-brand-forest",
    solidBg: "bg-brand-forest",
    // Texto oscuro: el verde "Disponible" es muy claro/brillante y el texto
    // blanco no tenía suficiente contraste encima.
    solidText: "text-stone-900",
  },
  Arrendado: {
    label: "Arrendado",
    dot: "bg-brand-primary",
    border: "border-l-brand-primary",
    solidBg: "bg-brand-primary",
    solidText: "text-brand-accent",
  },
  "Mantención": {
    label: "Mantención",
    dot: "bg-brand-accent",
    border: "border-l-brand-accent",
    solidBg: "bg-brand-accent",
    solidText: "text-stone-50",
  },
};
