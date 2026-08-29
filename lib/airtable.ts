import "server-only";
import type { Auto, Cliente, EstadoAuto, EstadoCliente } from "./types";
import { calcularResumen, calcularResumenClientes } from "./resumen";

/**
 * Cliente de Airtable. Este módulo SOLO debe importarse desde código
 * server-side (API routes, Server Components, etc.). El import de
 * "server-only" hace que el build falle si algún día se importa por
 * error desde un Client Component, evitando que el token se filtre
 * al bundle del navegador.
 */

const ESTADOS_VALIDOS: EstadoAuto[] = ["Disponible", "Arrendado", "Mantención"];

const ESTADOS_CLIENTE_VALIDOS: EstadoCliente[] = [
  "En conversación",
  "Calificado",
  "Listo para retirar",
  "Necesita ayuda humana",
  "Completado",
];

/**
 * Valor literal que hay que escribirle a Airtable para cada estado. En la
 * UI mostramos siempre "Mantención" (con tilde), pero la opción de
 * selección única ya creada en la base de Sierra Nevada quedó guardada
 * como "Mantencion" (sin tilde). Si mandamos el valor con tilde, Airtable
 * no la reconoce como una opción existente y rechaza el PATCH con
 * INVALID_MULTIPLE_CHOICE_OPTIONS. Este mapeo evita tener que renombrar la
 * opción en Airtable o cambiar el texto que ve Salvador en el dashboard.
 */
const OPCION_AIRTABLE_POR_ESTADO: Record<EstadoAuto, string> = {
  Disponible: "Disponible",
  Arrendado: "Arrendado",
  "Mantención": "Mantencion",
};

// Ídem para "Fecha de devolución": el campo real quedó guardado como
// "Fecha de devolucion " (sin tilde, con un espacio final).
const CAMPO_FECHA_DEVOLUCION = "Fecha de devolucion ";

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface AirtableListResponse {
  records: AirtableRecord[];
  offset?: string;
}

function getAirtableConfig() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;

  if (!apiKey || !baseId || !tableName) {
    throw new Error(
      "Faltan variables de entorno de Airtable. Revisá AIRTABLE_API_KEY, " +
        "AIRTABLE_BASE_ID y AIRTABLE_TABLE_NAME en tu .env.local (ver .env.example)."
    );
  }

  return { apiKey, baseId, tableName };
}

/**
 * Config para la tabla de Clientes (leads del bot de WhatsApp). Comparte
 * API key y base con la tabla de Autos — solo cambia el nombre de tabla,
 * configurable aparte porque Airtable no garantiza que todos los clientes
 * la llamen igual. Por defecto es "Clientes".
 */
function getAirtableClientesConfig() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_CLIENTES_TABLE_NAME || "Clientes";

  if (!apiKey || !baseId) {
    throw new Error(
      "Faltan variables de entorno de Airtable. Revisá AIRTABLE_API_KEY y " +
        "AIRTABLE_BASE_ID en tu .env.local (ver .env.example)."
    );
  }

  return { apiKey, baseId, tableName };
}

/**
 * Los nombres de columna en Airtable los define cada cliente a mano y en la
 * práctica varían (tildes olvidadas, espacios al final, mayúsculas
 * distintas). Para no depender de que coincidan carácter por carácter,
 * comparamos los nombres "normalizados": sin espacios extra, en minúscula y
 * sin acentos.
 */
function normalizarClave(clave: string): string {
  return clave
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function getCampo(fields: Record<string, unknown>, nombreEsperado: string): unknown {
  const objetivo = normalizarClave(nombreEsperado);
  const entrada = Object.entries(fields).find(
    ([clave]) => normalizarClave(clave) === objetivo
  );
  return entrada?.[1];
}

function normalizarEstado(estado: unknown): EstadoAuto {
  const valor = typeof estado === "string" ? normalizarClave(estado) : "";
  const match = ESTADOS_VALIDOS.find((e) => normalizarClave(e) === valor);
  // Si Airtable trae un valor inesperado o vacío, lo tratamos como
  // "Mantención" para que quede visible y no se pierda silenciosamente.
  return match ?? "Mantención";
}

function mapearRegistro(record: AirtableRecord): Auto {
  const f = record.fields;
  const nombre = getCampo(f, "Nombre");
  const patente = getCampo(f, "Patente");
  const precio = getCampo(f, "Precio por día");
  const requisitos = getCampo(f, "Requisitos");
  const fechaDevolucion = getCampo(f, "Fecha de devolución");

  return {
    id: record.id,
    nombre: typeof nombre === "string" && nombre.trim() ? nombre.trim() : "Sin nombre",
    patente: typeof patente === "string" && patente.trim() ? patente.trim() : "—",
    estado: normalizarEstado(getCampo(f, "Estado")),
    precioPorDia: typeof precio === "number" ? precio : null,
    requisitos: typeof requisitos === "string" ? requisitos.trim() : "",
    fechaDevolucion: typeof fechaDevolucion === "string" ? fechaDevolucion : null,
  };
}

/**
 * Trae todos los autos de la tabla configurada, paginando si hace falta
 * (Airtable devuelve como máximo 100 registros por página).
 */
export async function fetchAutos(): Promise<Auto[]> {
  const { apiKey, baseId, tableName } = getAirtableConfig();
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;

  const registros: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const query = new URLSearchParams({ pageSize: "100" });
    if (offset) query.set("offset", offset);

    const res = await fetch(`${url}?${query.toString()}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      // Revalida cada 20s: suficientemente fresco para un dashboard
      // operativo sin saturar el rate limit de Airtable (5 req/s).
      next: { revalidate: 20 },
    });

    if (!res.ok) {
      const detalle = await res.text().catch(() => "");
      throw new Error(
        `Airtable respondió ${res.status} ${res.statusText}. ${detalle}`.trim()
      );
    }

    const data: AirtableListResponse = await res.json();
    registros.push(...data.records);
    offset = data.offset;
  } while (offset);

  return registros.map(mapearRegistro);
}

/**
 * Actualiza el campo "Estado" (y opcionalmente "Fecha de devolución") de un
 * auto puntual en Airtable (PATCH sobre un único registro). Requiere que el
 * Personal Access Token configurado en AIRTABLE_API_KEY tenga el scope
 * `data.records:write` además del de lectura — si el token es solo de
 * lectura, Airtable responde 403 acá.
 *
 * La fecha de devolución solo tiene sentido mientras el auto está
 * "Arrendado": si se pasa un valor y el estado es Arrendado, se guarda; en
 * cualquier otro estado se limpia automáticamente, para que un auto que
 * vuelve a estar Disponible no arrastre una fecha vieja en la tarjeta.
 */
export async function actualizarEstadoAuto(
  id: string,
  estado: EstadoAuto,
  fechaDevolucion: string | null = null
): Promise<Auto> {
  const { apiKey, baseId, tableName } = getAirtableConfig();
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${encodeURIComponent(id)}`;

  const fields: Record<string, unknown> = {
    Estado: OPCION_AIRTABLE_POR_ESTADO[estado],
    // OJO: el nombre real de este campo en la base de Sierra Nevada es
    // "Fecha de devolucion " — sin tilde en la "o" Y con un espacio al
    // final (typo del creador de la base, invisible en la UI de Airtable).
    // Cualquier variante distinta byte a byte (con tilde, sin el espacio
    // final, etc.) hace que Airtable responda UNKNOWN_FIELD_NAME.
    [CAMPO_FECHA_DEVOLUCION]: estado === "Arrendado" ? fechaDevolucion : null,
  };

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    throw new Error(
      `Airtable respondió ${res.status} ${res.statusText}. ${detalle}`.trim()
    );
  }

  const record: AirtableRecord = await res.json();
  return mapearRegistro(record);
}

// ─────────────────────────────────────────────────────────────────────────
// Clientes (leads del bot de WhatsApp)
// ─────────────────────────────────────────────────────────────────────────

function normalizarEstadoCliente(estado: unknown): EstadoCliente {
  const valor = typeof estado === "string" ? normalizarClave(estado) : "";
  const match = ESTADOS_CLIENTE_VALIDOS.find((e) => normalizarClave(e) === valor);
  // Un cliente recién creado por el bot puede no tener Estado seteado
  // todavía (la IA solo lo marca al calificarlo) — lo tratamos como
  // "En conversación", que es literalmente lo que está pasando.
  return match ?? "En conversación";
}

function normalizarTarjetaCredito(valor: unknown): boolean | null {
  if (typeof valor !== "string") return null;
  const v = normalizarClave(valor);
  if (v === "si" || v === "sí") return true;
  if (v === "no") return false;
  return null;
}

function mapearClienteRecord(record: AirtableRecord): Cliente {
  const f = record.fields;
  const nombre = getCampo(f, "Nombre");
  const telefono = getCampo(f, "Teléfono");
  const autoDeInteres = getCampo(f, "Auto de interés");
  const fechaContacto = getCampo(f, "Fecha de contacto");
  const ultimaActualizacion = getCampo(f, "Última actualización de estado");
  const conversacion = getCampo(f, "Conversación");

  return {
    id: record.id,
    nombre: typeof nombre === "string" && nombre.trim() ? nombre.trim() : "Sin nombre",
    telefono: typeof telefono === "string" && telefono.trim() ? telefono.trim() : "—",
    estado: normalizarEstadoCliente(getCampo(f, "Estado")),
    autoDeInteres: typeof autoDeInteres === "string" ? autoDeInteres.trim() : "",
    tarjetaDeCredito: normalizarTarjetaCredito(getCampo(f, "Tarjeta de crédito")),
    fechaContacto: typeof fechaContacto === "string" ? fechaContacto : null,
    ultimaActualizacion:
      typeof ultimaActualizacion === "string" ? ultimaActualizacion : null,
    conversacion: typeof conversacion === "string" ? conversacion : "",
    pausado: getCampo(f, "Pausado") === true,
  };
}

/**
 * Trae todos los clientes (leads) de la tabla Clientes, paginando si hace
 * falta. Solo lectura: a diferencia de los autos, el estado del cliente lo
 * cambia el agente de IA durante la conversación de WhatsApp, no Salvador
 * desde el dashboard — acá solo se muestra para que Salvador tenga
 * visibilidad de en qué va cada lead.
 */
export async function fetchClientes(): Promise<Cliente[]> {
  const { apiKey, baseId, tableName } = getAirtableClientesConfig();
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;

  const registros: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const query = new URLSearchParams({ pageSize: "100" });
    if (offset) query.set("offset", offset);

    const res = await fetch(`${url}?${query.toString()}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      // A diferencia de Autos, acá el dashboard escribe (Pausado) y necesita
      // ver ese cambio de inmediato — con revalidate:20 un poll que cae justo
      // después de un PATCH puede servir una respuesta cacheada vieja y
      // "revertir" visualmente el toggle aunque Airtable ya haya guardado el
      // valor correcto. cache:"no-store" evita esa carrera.
      cache: "no-store",
    });

    if (!res.ok) {
      const detalle = await res.text().catch(() => "");
      throw new Error(
        `Airtable respondió ${res.status} ${res.statusText}. ${detalle}`.trim()
      );
    }

    const data: AirtableListResponse = await res.json();
    registros.push(...data.records);
    offset = data.offset;
  } while (offset);

  return registros.map(mapearClienteRecord);
}

/**
 * Actualiza el campo "Pausado" de un cliente puntual en Airtable. Se usa
 * desde el botón "Pausar bot" / "Reanudar bot" del dashboard, y desde el
 * webhook de n8n al recibir un mensaje manual (que además marca Pausado en
 * true del lado del workflow). Requiere que AIRTABLE_API_KEY tenga permiso
 * de escritura, igual que actualizarEstadoAuto.
 */
export async function actualizarPausadoCliente(
  id: string,
  pausado: boolean
): Promise<Cliente> {
  const { apiKey, baseId, tableName } = getAirtableClientesConfig();
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${encodeURIComponent(id)}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: { Pausado: pausado } }),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    throw new Error(
      `Airtable respondió ${res.status} ${res.statusText}. ${detalle}`.trim()
    );
  }

  const record: AirtableRecord = await res.json();
  return mapearClienteRecord(record);
}

export { calcularResumen, calcularResumenClientes };
