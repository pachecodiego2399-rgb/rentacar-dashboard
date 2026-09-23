import { NextResponse } from "next/server";
import { actualizarEstadoCliente, actualizarPausadoCliente } from "@/lib/airtable";
import { ESTADOS_CLIENTE } from "@/lib/estado-cliente";
import type { EstadoCliente } from "@/lib/types";

/**
 * PATCH /api/clientes/:id
 * Body: { pausado: boolean } o { estado: EstadoCliente }
 *
 * Actualiza el campo "Pausado" o el "Estado" de un cliente puntual en Airtable. Server-side
 * only: el API Key de Airtable nunca sale de acá (ver lib/airtable.ts).
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Falta el ID del cliente." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la petición inválido." },
      { status: 400 }
    );
  }

  const { pausado, estado } =
    (body as { pausado?: unknown; estado?: unknown } | null) ?? {};

  const estadoValido =
    typeof estado === "string" && ESTADOS_CLIENTE.includes(estado as EstadoCliente);

  if (typeof pausado !== "boolean" && !estadoValido) {
    return NextResponse.json(
      {
        error:
          "Envía 'pausado' (true o false) o 'estado' (uno de: " +
          ESTADOS_CLIENTE.join(", ") +
          ").",
      },
      { status: 400 }
    );
  }

  try {
    const cliente = estadoValido
      ? await actualizarEstadoCliente(id, estado as EstadoCliente)
      : await actualizarPausadoCliente(id, pausado as boolean);
    return NextResponse.json({ cliente });
  } catch (error) {
    console.error("[PATCH /api/clientes/:id]", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido al actualizar Airtable.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
