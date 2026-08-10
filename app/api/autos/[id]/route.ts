import { NextResponse } from "next/server";
import { actualizarEstadoAuto } from "@/lib/airtable";
import { ESTADOS } from "@/lib/estado";
import type { EstadoAuto } from "@/lib/types";

/**
 * PATCH /api/autos/:id
 * Body: { estado: "Disponible" | "Arrendado" | "Mantención" }
 *
 * Actualiza el estado de un auto puntual en Airtable. Server-side only:
 * el API Key de Airtable nunca sale de acá (ver lib/airtable.ts).
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Falta el ID del auto." }, { status: 400 });
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

  const estado = (body as { estado?: unknown } | null)?.estado;
  if (typeof estado !== "string" || !ESTADOS.includes(estado as EstadoAuto)) {
    return NextResponse.json(
      { error: `Estado inválido. Debe ser uno de: ${ESTADOS.join(", ")}.` },
      { status: 400 }
    );
  }

  try {
    const auto = await actualizarEstadoAuto(id, estado as EstadoAuto);
    return NextResponse.json({ auto });
  } catch (error) {
    console.error("[PATCH /api/autos/:id]", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido al actualizar Airtable.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
