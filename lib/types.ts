export type EstadoAuto = "Disponible" | "Arrendado" | "Mantención";

export interface Auto {
  id: string;
  nombre: string;
  patente: string;
  estado: EstadoAuto;
  precioPorDia: number | null;
  requisitos: string;
  fechaDevolucion: string | null;
  anio: number | null;
  caja: string;
  traccion: string;
  /** URL de la primera foto del auto (Airtable), null si no tiene */
  fotoUrl: string | null;
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

// ─────────────────────────────────────────────────────────────────────────
// Clientes (leads del bot de WhatsApp, tabla "Clientes" en Airtable)
// ─────────────────────────────────────────────────────────────────────────

export type EstadoCliente =
  | "En conversación"
  | "Calificado"
  | "Listo para retirar"
  | "Necesita ayuda humana"
  | "Completado";

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  estado: EstadoCliente;
  autoDeInteres: string;
  /** true = "Sí", false = "No", null = campo vacío en Airtable */
  tarjetaDeCredito: boolean | null;
  /** Fecha del primer contacto (AAAA-MM-DD), null si no está seteada */
  fechaContacto: string | null;
  /** Timestamp ISO de la última vez que cambió el campo Estado */
  ultimaActualizacion: string | null;
  /** Historial de mensajes en texto plano, tal como lo guarda el bot */
  conversacion: string;
  /** true = el agente está pausado y el dueño responde manualmente */
  pausado: boolean;
  /** Fecha de retiro acordada (AAAA-MM-DD) */
  fechaRetiro: string | null;
  /** Hora de retiro acordada (HH:mm) */
  horaRetiro: string | null;
  /** Timestamp ISO del último cambio de Estado, Fecha u Hora de retiro */
  ultimaActualizacionReserva: string | null;
}

export interface ResumenClientes {
  total: number;
  enConversacion: number;
  calificados: number;
  listosParaRetirar: number;
  necesitaAyudaHumana: number;
  completados: number;
}

export interface ClientesResponse {
  clientes: Cliente[];
  resumen: ResumenClientes;
}
