import { clientConfig } from "@/config/client";
import { parseConversacion } from "./parse-conversacion";
import type { Auto, Cliente, EstadoCliente } from "./types";

// ─────────────────────────────────────────────────────────────────────────
// Todo lo que muestra el panel sale de datos reales de Airtable. Lo que el
// agente todavía no registra (tiempo de primera respuesta, origen del
// cliente, valor de la reserva, score) se muestra como "—" en la UI: nunca
// se inventa un número.
// ─────────────────────────────────────────────────────────────────────────

export type Periodo = "hoy" | "7d" | "30d" | "90d";

export const PERIODOS: { id: Periodo; label: string; texto: string }[] = [
  { id: "hoy", label: "Hoy", texto: "hoy" },
  { id: "7d", label: "7 días", texto: "los últimos 7 días" },
  { id: "30d", label: "30 días", texto: "los últimos 30 días" },
  { id: "90d", label: "90 días", texto: "los últimos 90 días" },
];

export interface Rango {
  inicio: Date;
  fin: Date;
  inicioPrevio: Date;
}

export function rangoDe(periodo: Periodo, ahora = new Date()): Rango {
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const dias = periodo === "hoy" ? 1 : periodo === "7d" ? 7 : periodo === "30d" ? 30 : 90;
  const inicio = new Date(inicioHoy);
  inicio.setDate(inicio.getDate() - (dias - 1));
  const inicioPrevio = new Date(inicio);
  inicioPrevio.setDate(inicioPrevio.getDate() - dias);
  return { inicio, fin: ahora, inicioPrevio };
}

/** "23/09/2026 10:57" → Date en hora local (así lo escribe el agente). */
export function parsearMarca(marca: string | null): Date | null {
  if (!marca) return null;
  const m = marca.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "AAAA-MM-DD" (+ "HH:mm" opcional) → Date local, sin el corrimiento de UTC. */
export function fechaLocal(fecha: string | null, hora?: string | null): Date | null {
  if (!fecha) return null;
  const m = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const h = hora?.match(/^(\d{1,2}):(\d{2})/);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), h ? Number(h[1]) : 0, h ? Number(h[2]) : 0);
}

export type Autor = "cliente" | "agente" | "manual";

export interface Mensaje {
  autor: Autor;
  texto: string;
  fecha: Date | null;
  marca: string | null;
}

const cacheMensajes = new Map<string, Mensaje[]>();

export function mensajesDe(cliente: Cliente): Mensaje[] {
  const clave = cliente.id + ":" + cliente.conversacion.length;
  const enCache = cacheMensajes.get(clave);
  if (enCache) return enCache;
  const { messages } = parseConversacion(cliente.conversacion);
  const mensajes = messages.map((m) => ({
    autor: (m.sender === "cliente" ? "cliente" : m.sender === "salva-manual" ? "manual" : "agente") as Autor,
    texto: m.text,
    fecha: parsearMarca(m.timestamp),
    marca: m.timestamp,
  }));
  cacheMensajes.set(clave, mensajes);
  return mensajes;
}

export function ultimoMensajeCliente(cliente: Cliente): Mensaje | null {
  const ms = mensajesDe(cliente).filter((m) => m.autor === "cliente");
  return ms.length ? ms[ms.length - 1] : null;
}

export function ultimaInteraccion(cliente: Cliente): Date | null {
  const ms = mensajesDe(cliente);
  for (let i = ms.length - 1; i >= 0; i--) if (ms[i].fecha) return ms[i].fecha;
  const alt = cliente.ultimaActualizacionReserva ?? cliente.ultimaActualizacion;
  return alt ? new Date(alt) : fechaLocal(cliente.fechaContacto);
}

export function fueraDeHorario(fecha: Date): boolean {
  const h = fecha.getHours();
  return h < clientConfig.openingHour || h >= clientConfig.closingHour;
}

const en = (d: Date | null, desde: Date, hasta: Date) => !!d && d >= desde && d <= hasta;

/** Cliente activo en el rango: escribió en ese rango, o su primer contacto cae ahí. */
function activoEn(cliente: Cliente, desde: Date, hasta: Date): boolean {
  const ms = mensajesDe(cliente);
  if (ms.some((m) => m.autor === "cliente" && en(m.fecha, desde, hasta))) return true;
  if (ms.every((m) => !m.fecha)) return en(fechaLocal(cliente.fechaContacto), desde, hasta);
  return false;
}

const ESTADOS_RESERVA: EstadoCliente[] = ["Listo para retirar", "Completado"];

function fechaReserva(c: Cliente): Date | null {
  const iso = c.ultimaActualizacionReserva ?? c.ultimaActualizacion;
  return iso ? new Date(iso) : null;
}

function reservasEn(clientes: Cliente[], desde: Date, hasta: Date): number {
  return clientes.filter((c) => ESTADOS_RESERVA.includes(c.estado) && en(fechaReserva(c), desde, hasta)).length;
}

export interface Kpi {
  valor: number | null;
  previo: number | null;
}

export interface MetricasPanel {
  clientesAtendidos: Kpi;
  reservas: Kpi;
  conversion: Kpi;
  fueraDeHorarioPct: Kpi;
  mensajesClientes: number;
  mensajesFueraHorario: number;
  respuestasAgente: number;
  sinRespuesta: number;
  flotaOcupadaPct: number | null;
  autosArrendados: number;
  autosTotal: number;
  requierenAtencion: Cliente[];
}

export function calcularPanel(clientes: Cliente[], autos: Auto[], periodo: Periodo): MetricasPanel {
  const { inicio, fin, inicioPrevio } = rangoDe(periodo);

  const atendidos = clientes.filter((c) => activoEn(c, inicio, fin)).length;
  const atendidosPrev = clientes.filter((c) => activoEn(c, inicioPrevio, inicio)).length;
  const reservas = reservasEn(clientes, inicio, fin);
  const reservasPrev = reservasEn(clientes, inicioPrevio, inicio);

  let mensajesClientes = 0;
  let fuera = 0;
  let mensajesPrev = 0;
  let fueraPrev = 0;
  let respuestas = 0;
  let sinRespuesta = 0;

  for (const c of clientes) {
    const ms = mensajesDe(c);
    for (const m of ms) {
      if (m.autor === "cliente" && m.fecha) {
        if (en(m.fecha, inicio, fin)) {
          mensajesClientes++;
          if (fueraDeHorario(m.fecha)) fuera++;
        } else if (en(m.fecha, inicioPrevio, inicio)) {
          mensajesPrev++;
          if (fueraDeHorario(m.fecha)) fueraPrev++;
        }
      }
      if (m.autor !== "cliente" && en(m.fecha, inicio, fin)) respuestas++;
    }
    // Sin respuesta: el último mensaje es del cliente y lleva más de 24 h.
    const ultimo = ms[ms.length - 1];
    if (ultimo?.autor === "cliente" && ultimo.fecha && Date.now() - ultimo.fecha.getTime() > 864e5) {
      sinRespuesta++;
    }
  }

  const arrendados = autos.filter((a) => a.estado === "Arrendado").length;

  return {
    clientesAtendidos: { valor: atendidos, previo: atendidosPrev },
    reservas: { valor: reservas, previo: reservasPrev },
    conversion: {
      valor: atendidos ? (reservas / atendidos) * 100 : null,
      previo: atendidosPrev ? (reservasPrev / atendidosPrev) * 100 : null,
    },
    fueraDeHorarioPct: {
      valor: mensajesClientes ? (fuera / mensajesClientes) * 100 : null,
      previo: mensajesPrev ? (fueraPrev / mensajesPrev) * 100 : null,
    },
    mensajesClientes,
    mensajesFueraHorario: fuera,
    respuestasAgente: respuestas,
    sinRespuesta,
    flotaOcupadaPct: autos.length ? (arrendados / autos.length) * 100 : null,
    autosArrendados: arrendados,
    autosTotal: autos.length,
    requierenAtencion: clientes
      .filter((c) => c.estado === "Necesita ayuda humana")
      .sort((a, b) => (ultimaInteraccion(b)?.getTime() ?? 0) - (ultimaInteraccion(a)?.getTime() ?? 0)),
  };
}

/** Variación % contra el período anterior; null si no hay con qué comparar. */
export function variacion(kpi: Kpi): number | null {
  if (kpi.valor === null || kpi.previo === null || kpi.previo === 0) return null;
  return ((kpi.valor - kpi.previo) / kpi.previo) * 100;
}

export interface Barra {
  etiqueta: string;
  enHorario: number;
  fueraHorario: number;
}

/** Mensajes de clientes por día (o por hora si el período es "hoy"). */
export function serieMensajes(clientes: Cliente[], periodo: Periodo): Barra[] {
  const { inicio, fin } = rangoDe(periodo);
  const porHora = periodo === "hoy";
  const barras: Barra[] = [];
  const indice = new Map<string, Barra>();

  if (porHora) {
    for (let h = 0; h < 24; h++) {
      const b = { etiqueta: `${String(h).padStart(2, "0")}h`, enHorario: 0, fueraHorario: 0 };
      barras.push(b);
      indice.set(String(h), b);
    }
  } else {
    const d = new Date(inicio);
    while (d <= fin) {
      const b = {
        etiqueta: new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short" }).format(d).replace(".", ""),
        enHorario: 0,
        fueraHorario: 0,
      };
      barras.push(b);
      indice.set(d.toDateString(), b);
      d.setDate(d.getDate() + 1);
    }
  }

  for (const c of clientes) {
    for (const m of mensajesDe(c)) {
      if (m.autor !== "cliente" || !en(m.fecha, inicio, fin)) continue;
      const b = indice.get(porHora ? String(m.fecha!.getHours()) : m.fecha!.toDateString());
      if (!b) continue;
      if (fueraDeHorario(m.fecha!)) b.fueraHorario++;
      else b.enHorario++;
    }
  }
  return barras;
}

export interface Evento {
  id: string;
  texto: string;
  fecha: Date;
  tipo: "cliente" | "agente" | "manual" | "reserva" | "ayuda";
  clienteId: string;
}

/** Actividad reciente: mensajes y cambios de reserva, lo más nuevo primero. */
export function actividadReciente(clientes: Cliente[], limite = 12): Evento[] {
  const eventos: Evento[] = [];
  for (const c of clientes) {
    const nombre = primerNombre(c.nombre);
    const ms = mensajesDe(c);
    ms.forEach((m, i) => {
      if (!m.fecha) return;
      // Un intercambio (cliente → agente) se muestra como un solo evento, con
      // un extracto de la respuesta, para que la lista cuente qué pasó.
      if (m.autor === "cliente" && ms[i + 1]?.autor === "agente") return;
      const extracto = m.texto.length > 90 ? `${m.texto.slice(0, 90).trimEnd()}…` : m.texto;
      eventos.push({
        id: `${c.id}-${i}`,
        fecha: m.fecha,
        clienteId: c.id,
        tipo: m.autor,
        texto:
          m.autor === "cliente"
            ? `${nombre} escribió: “${extracto}”`
            : m.autor === "manual"
            ? `Le escribiste a ${nombre}: “${extracto}”`
            : `El agente le respondió a ${nombre}: “${extracto}”`,
      });
    });
    const fr = fechaReserva(c);
    if (fr && c.estado === "Listo para retirar") {
      eventos.push({
        id: `${c.id}-reserva`,
        fecha: fr,
        clienteId: c.id,
        tipo: "reserva",
        texto: `Reserva lista: ${nombre}${c.autoDeInteres ? `, ${c.autoDeInteres}` : ""}${
          c.fechaRetiro ? `, retiro ${formatoCorto(fechaLocal(c.fechaRetiro, c.horaRetiro), !!c.horaRetiro)}` : ""
        }`,
      });
    }
    if (fr && c.estado === "Necesita ayuda humana") {
      eventos.push({ id: `${c.id}-ayuda`, fecha: fr, clienteId: c.id, tipo: "ayuda", texto: `${nombre} necesita que lo atiendas tú` });
    }
  }
  return eventos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime()).slice(0, limite);
}

export function mensajesAgenteUltimas24h(clientes: Cliente[]): number {
  const desde = Date.now() - 864e5;
  let n = 0;
  for (const c of clientes) for (const m of mensajesDe(c)) if (m.autor === "agente" && m.fecha && m.fecha.getTime() >= desde) n++;
  return n;
}

/** Qué tiene que pasar ahora con este cliente, en una frase. */
export function proximaAccion(c: Cliente): string {
  switch (c.estado) {
    case "Necesita ayuda humana":
      return "Responder tú desde Conversaciones";
    case "Listo para retirar":
      return c.fechaRetiro
        ? `Entregar el ${formatoCorto(fechaLocal(c.fechaRetiro, c.horaRetiro), !!c.horaRetiro)}`
        : "Coordinar la entrega";
    case "Calificado":
      return "El agente está cerrando la reserva";
    case "En conversación":
      return c.pausado ? "Lo estás atendiendo tú" : "El agente está conversando";
    case "Completado":
      return "—";
  }
}

// ── formato ──────────────────────────────────────────────────────────────

export function primerNombre(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes[1][0]?.toUpperCase() ?? ""}.`;
}

export function iniciales(nombre: string): string {
  const p = nombre.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function haceCuanto(fecha: Date | null): string {
  if (!fecha) return "—";
  const min = Math.round((Date.now() - fecha.getTime()) / 60000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `hace ${d} d`;
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short" }).format(fecha);
}

export function formatoCorto(fecha: Date | null, conHora = true): string {
  if (!fecha) return "—";
  const dia = new Intl.DateTimeFormat("es-CL", { weekday: "short", day: "numeric", month: "short" })
    .format(fecha)
    .replace(/\./g, "");
  if (!conHora) return dia;
  const hora = new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(fecha);
  return `${dia}, ${hora}`;
}

export const numero = (n: number) => new Intl.NumberFormat("es-CL").format(n);
export const pesos = (n: number | null) => (n === null ? "—" : `$ ${new Intl.NumberFormat("es-CL").format(n)}`);
export const pct = (n: number | null) =>
  n === null ? "—" : `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(n)}%`;

export function formatearTelefono(t: string): string {
  const d = t.replace(/\D/g, "");
  if (d.startsWith("569") && d.length === 11) return `+56 9 ${d.slice(3, 7)} ${d.slice(7)}`;
  return d ? `+${d}` : t;
}
