import { NextResponse } from "next/server";
import { fetchAutos, calcularResumen } from "@/lib/airtable";
import type { AutosResponse } from "@/lib/types";

export async function GET() {
  try {
    const autos = await fetchAutos();
    const body: AutosResponse = {
      autos,
      resumen: calcularResumen(autos),
    };
    return NextResponse.json(body);
  } catch (error) {
    console.error("[GET /api/autos]", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido al consultar Airtable.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
