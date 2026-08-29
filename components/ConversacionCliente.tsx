"use client";

import { useEffect, useRef, useState } from "react";
import type { Cliente } from "@/lib/types";
import { parseConversacion } from "@/lib/parse-conversacion";
import EstadoClienteBadge from "./EstadoClienteBadge";

interface Props {
  cliente: Cliente;
  onClose: () => void;
  onTogglePausado: (id: string, nuevoPausado: boolean) => Promise<void>;
  onMessageSent: (id: string) => void;
  onShowError: (message: string) => void;
}

function ChatBubble({
  sender,
  text,
}: {
  sender: "cliente" | "salva" | "salva-manual";
  text: string;
}) {
  const isCliente = sender === "cliente";
  const isManual = sender === "salva-manual";

  return (
    <div className={`flex ${isCliente ? "justify-start" : "justify-end"}`}>
      <div
        className="max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed sm:max-w-[65%]"
        style={
          isCliente
            ? {
                background: "#FFFFFF",
                color: "#1c1917",
                border: "1px solid #e7e5e4",
                borderRadius: "12px 12px 12px 2px",
              }
            : isManual
            ? {
                background: "#b8791a",
                color: "#FFFFFF",
                borderRadius: "12px 12px 2px 12px",
              }
            : {
                background: "#1c1917",
                color: "#FFFFFF",
                borderRadius: "12px 12px 2px 12px",
              }
        }
      >
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wide opacity-60">
          {isCliente ? "Cliente" : isManual ? "Salva (manual)" : "Salva"}
        </div>
        {text}
      </div>
    </div>
  );
}

export default function ConversacionCliente({
  cliente,
  onClose,
  onTogglePausado,
  onMessageSent,
  onShowError,
}: Props) {
  const { messages, malformed } = parseConversacion(cliente.conversacion);
  const [pausando, setPausando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [cliente.conversacion]);

  let lastTimestamp: string | null = null;

  async function handleTogglePausado() {
    setPausando(true);
    try {
      await onTogglePausado(cliente.id, !cliente.pausado);
    } finally {
      setPausando(false);
    }
  }

  async function handleEnviar() {
    const texto = mensaje.trim();
    if (!texto || enviando) return;
    if (!cliente.telefono || cliente.telefono === "—") {
      onShowError("Este cliente no tiene teléfono registrado, no se puede enviar el mensaje.");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch("/api/pausa-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono: cliente.telefono, mensaje: texto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar el mensaje");
      setMensaje("");
      onMessageSent(cliente.id);
    } catch (err) {
      onShowError(`No se pudo enviar el mensaje: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-stone-100"
      style={{ borderTop: cliente.pausado ? "5px solid #b8791a" : "none" }}
    >
      <div className="flex flex-col gap-3 border-b border-stone-200 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-10">
        <div className="min-w-0">
          <div className="truncate font-display text-lg font-bold uppercase tracking-wide text-stone-900 sm:text-xl">
            {cliente.nombre}
          </div>
          <div className="mt-1 font-mono text-sm text-stone-500">{cliente.telefono}</div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <EstadoClienteBadge estado={cliente.estado} size="sm" />
            {cliente.pausado ? (
              <span className="rounded-sm bg-[#b8791a] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Pausado — respondiendo manualmente
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePausado}
            disabled={pausando}
            className="flex-1 rounded px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            style={{ background: cliente.pausado ? "#2e7d32" : "#b8791a" }}
          >
            {pausando ? "Guardando…" : cliente.pausado ? "Reanudar bot" : "Pausar bot"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded bg-stone-900 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white sm:flex-none"
          >
            Cerrar
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 sm:px-10">
        {malformed ? (
          <div className="mx-auto max-w-[720px] whitespace-pre-wrap break-words rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-500">
            {cliente.conversacion || "Todavía no hay conversación registrada para este cliente."}
          </div>
        ) : (
          <div className="mx-auto flex max-w-[720px] flex-col gap-3">
            {messages.map((message, i) => {
              const showTimestamp = message.timestamp !== null && message.timestamp !== lastTimestamp;
              if (showTimestamp) lastTimestamp = message.timestamp;
              return (
                <div key={i} className="flex flex-col gap-3">
                  {showTimestamp ? (
                    <div className="text-center text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                      {message.timestamp}
                    </div>
                  ) : null}
                  <ChatBubble sender={message.sender} text={message.text} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-stone-200 bg-stone-100 px-5 py-4 sm:px-10">
        <div className="mx-auto flex max-w-[720px] gap-2">
          <input
            type="text"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !enviando) handleEnviar();
            }}
            placeholder="Escribe un mensaje manual para este cliente…"
            className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#b8791a] focus:outline-none"
          />
          <button
            type="button"
            onClick={handleEnviar}
            disabled={enviando || !mensaje.trim()}
            className="shrink-0 rounded bg-stone-900 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
