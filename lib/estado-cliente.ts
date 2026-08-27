import type { EstadoCliente } from "./types";

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

// Mismo orden que las opciones del campo "Estado" en la tabla Clientes de
// Airtable: es el recorrido natural de un lead, de "recién escribió" a
// "ya retiró el auto".
export const ESTADOS_CLIENTE: EstadoCliente[] = [
  "En conversación",
  "Calificado",
  "Listo para retirar",
  "Necesita ayuda humana",
  "Completado",
];

// Mapeo temático: gris = recién entrando, dorado = avanzando (mismo tono
// que "Arrendado" en Autos, evoca "en curso"), verde bosque = lo urgente
// para Salva (retirar), verde más oscuro = cerrado.
export const ESTADO_CLIENTE_STYLES: Record<EstadoCliente, EstadoStyle> = {
  "En conversación": {
    label: "En conversación",
    dot: "bg-stone-400",
    border: "border-l-stone-400",
    solidBg: "bg-stone-400",
    solidText: "text-stone-50",
  },
  Calificado: {
    label: "Calificado",
    dot: "bg-brand-primary",
    border: "border-l-brand-primary",
    solidBg: "bg-brand-primary",
    solidText: "text-brand-accent",
  },
  "Listo para retirar": {
    label: "Listo para retirar",
    dot: "bg-brand-forest",
    border: "border-l-brand-forest",
    solidBg: "bg-brand-forest",
    solidText: "text-stone-50",
  },
  "Necesita ayuda humana": {
    label: "Necesita ayuda humana",
    dot: "bg-red-600",
    border: "border-l-red-600",
    solidBg: "bg-red-600",
    solidText: "text-stone-50",
  },
  Completado: {
    label: "Completado",
    dot: "bg-emerald-700",
    border: "border-l-emerald-700",
    solidBg: "bg-emerald-700",
    solidText: "text-stone-50",
  },
};
