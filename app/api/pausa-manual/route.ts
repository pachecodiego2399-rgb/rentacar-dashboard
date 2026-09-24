import { NextResponse } from "next/server";

/**
 * Webhook de n8n (agente de WhatsApp, nodo "Webhook Pausa Manual") que marca
 * al cliente como Pausado, agrega el mensaje a la Conversación y lo envía por
 * WhatsApp. Cada llamada lleva la clave N8N_WEBHOOK_SECRET en el encabezado
 * "x-panel-secret": n8n rechaza cualquier llamada que no la traiga, así solo
 * este panel puede mandar mensajes a nombre del negocio.
 */
const PAUSA_MANUAL_WEBHOOK_URL =
  "https://diegocesarpacheco23.app.n8n.cloud/webhook/pausa-manual-whatsapp";

// POST /api/pausa-manual  body: { telefono, mensaje }
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la petición inválido." },
      { status: 400 }
    );
  }

  const { telefono, mensaje } = (body as { telefono?: unknown; mensaje?: unknown } | null) ?? {};

  if (typeof telefono !== "string" || !telefono.trim() || typeof mensaje !== "string" || !mensaje.trim()) {
    return NextResponse.json(
      { error: "telefono y mensaje son requeridos." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(PAUSA_MANUAL_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-panel-secret": process.env.N8N_WEBHOOK_SECRET ?? "",
      },
      body: JSON.stringify({ telefono, mensaje }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.ok === false) {
      throw new Error(data.error || `El webhook respondió ${res.status}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/pausa-manual]", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido al llamar al webhook.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
