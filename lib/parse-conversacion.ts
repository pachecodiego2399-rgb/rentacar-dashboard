export interface MensajeConversacion {
  sender: "cliente" | "salva" | "salva-manual";
  text: string;
  timestamp: string | null;
}

export interface ConversacionParseada {
  messages: MensajeConversacion[];
  malformed: boolean;
}

// El campo Conversación en Airtable viene como bloques de texto:
//   [dd/MM/yyyy HH:mm]
//   Cliente: mensaje
//   Salva: respuesta
//   Salva (manual): respuesta escrita a mano desde el dashboard
// repetidos por cada intercambio. Si el texto trae código de n8n sin
// resolver (p. ej. "{{ ... }}"), se marca como "malformed" para mostrarlo
// como texto plano en vez de intentar armar burbujas con eso.
export function parseConversacion(raw: string): ConversacionParseada {
  if (!raw) return { messages: [], malformed: false };

  const looksLikeUnresolvedCode = /\{\{|\$\(['"]|\.item\.json|toFormat\(/.test(raw);
  if (looksLikeUnresolvedCode) return { messages: [], malformed: true };

  const lines = raw.split(/\r?\n/);
  const messages: MensajeConversacion[] = [];
  let currentTimestamp: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const tsMatch = line.match(/^\[([^\]]+)\]$/);
    if (tsMatch) {
      currentTimestamp = tsMatch[1];
      continue;
    }

    const clienteMatch = line.match(/^Cliente:\s*(.*)$/i);
    const salvaManualMatch = line.match(/^Salva\s*\(manual\):\s*(.*)$/i);
    const salvaMatch = line.match(/^Salva:\s*(.*)$/i);

    if (clienteMatch) {
      messages.push({ sender: "cliente", text: clienteMatch[1], timestamp: currentTimestamp });
    } else if (salvaManualMatch) {
      messages.push({ sender: "salva-manual", text: salvaManualMatch[1], timestamp: currentTimestamp });
    } else if (salvaMatch) {
      messages.push({ sender: "salva", text: salvaMatch[1], timestamp: currentTimestamp });
    } else if (messages.length > 0) {
      messages[messages.length - 1].text += ` ${line}`;
    }
  }

  if (messages.length === 0) return { messages: [], malformed: true };
  return { messages, malformed: false };
}
