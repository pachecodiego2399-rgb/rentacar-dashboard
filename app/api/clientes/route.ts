import { NextResponse } from "next/server";
import { fetchClientes, calcularResumenClientes } from "@/lib/airtable";
import type { ClientesResponse } from "@/lib/types";

export async function GET() {
  try {
    const clientes = await fetchClientes();
    const body: ClientesResponse = {
      clientes,
      resumen: calcularResumenClientes(clientes),
    };
    return NextResponse.json(body);
  } catch (error) {
    console.error("[GET /api/clientes]", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido al consultar Airtable.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
