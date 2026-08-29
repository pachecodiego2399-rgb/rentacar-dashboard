import { NextResponse } from "next/server";
import { actualizarPausadoCliente } from "@/lib/airtable";

/**
 * PATCH /api/clientes/:id
 * Body: { pausado: boolean }
 *
 * Actualiza el campo "Pausado" de un cliente puntual en Airtable. Server-side
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

  const { pausado } = (body as { pausado?: unknown } | null) ?? {};

  if (typeof pausado !== "boolean") {
    return NextResponse.json(
      { error: "El campo 'pausado' debe ser true o false." },
      { status: 400 }
    );
  }

  try {
    const cliente = await actualizarPausadoCliente(id, pausado);
    return NextResponse.json({ cliente });
  } catch (error) {
    console.error("[PATCH /api/clientes/:id]", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido al actualizar Airtable.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
