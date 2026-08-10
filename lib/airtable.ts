import "server-only";
import type { Auto, EstadoAuto } from "./types";
import { calcularResumen } from "./resumen";

/**
 * Cliente de Airtable. Este módulo SOLO debe importarse desde código
 * server-side (API routes, Server Components, etc.). El import de
 * "server-only" hace que el build falle si algún día se importa por
 * error desde un Client Component, evitando que el token se filtre
 * al bundle del navegador.
 */

const ESTADOS_VALIDOS: EstadoAuto[] = ["Disponible", "Arrendado", "Mantención"];

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
    "Fecha de devolución": estado === "Arrendado" ? fechaDevolucion : null,
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

export { calcularResumen };
