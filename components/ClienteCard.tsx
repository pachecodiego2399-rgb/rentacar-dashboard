"use client";

import { useState } from "react";
import type { Cliente, EstadoCliente } from "@/lib/types";
import { ESTADOS_CLIENTE, ESTADO_CLIENTE_STYLES } from "@/lib/estado-cliente";
import { formatearFecha, formatearFechaHora } from "@/lib/format";
import EstadoClienteBadge from "./EstadoClienteBadge";

export default function ClienteCard({
  cliente,
  onOpen,
  onCambiarEstado,
}: {
  cliente: Cliente;
  onOpen?: (cliente: Cliente) => void;
  onCambiarEstado?: (id: string, nuevoEstado: EstadoCliente) => Promise<void>;
}) {
  const [moviendo, setMoviendo] = useState(false);
  const [estadoEnCurso, setEstadoEnCurso] = useState<EstadoCliente | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const otrosEstados = ESTADOS_CLIENTE.filter((e) => e !== cliente.estado);

  async function mover(nuevoEstado: EstadoCliente) {
    if (!onCambiarEstado) return;
    setMoviendo(true);
    setEstadoEnCurso(nuevoEstado);
    try {
      await onCambiarEstado(cliente.id, nuevoEstado);
      setMenuAbierto(false);
    } finally {
      setMoviendo(false);
      setEstadoEnCurso(null);
    }
  }

  const style = ESTADO_CLIENTE_STYLES[cliente.estado];
  const fechaContacto = formatearFecha(cliente.fechaContacto);
  const ultimaActualizacion = formatearFechaHora(cliente.ultimaActualizacion);

  // WhatsApp acepta números con el prefijo internacional sin "+" ni
  // espacios en el link wa.me — si el teléfono no viene en ese formato
  // simplemente no mostramos el link, para no armar uno roto.
  const telefonoLimpio = cliente.telefono.replace(/[^\d]/g, "");
  const linkWhatsapp =
    telefonoLimpio.length >= 8 ? `https://wa.me/${telefonoLimpio}` : null;

  return (
    <article
      onClick={() => onOpen?.(cliente)}
      className={`cursor-pointer rounded-lg border border-l-4 border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md ${style.border} ${
        cliente.pausado ? "ring-2 ring-[#b8791a]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 break-words font-display text-lg font-bold uppercase tracking-wide text-stone-900">
          {cliente.nombre}
        </h3>
      </div>

      <div className="mt-2">
        <EstadoClienteBadge estado={cliente.estado} size="sm" />
      </div>

      {linkWhatsapp ? (
        <a
          href={linkWhatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-3 inline-block font-mono text-sm text-brand-primary underline underline-offset-2"
        >
          {cliente.telefono}
        </a>
      ) : (
        <p className="mt-3 font-mono text-sm text-stone-600">{cliente.telefono}</p>
      )}

      {cliente.autoDeInteres && (
        <p className="mt-2 text-sm text-stone-500">
          Auto de interés:{" "}
          <span className="font-medium text-stone-700">{cliente.autoDeInteres}</span>
        </p>
      )}

      {cliente.tarjetaDeCredito !== null && (
        <p className="mt-1 text-sm text-stone-500">
          Tarjeta de crédito:{" "}
          <span className="font-medium text-stone-700">
            {cliente.tarjetaDeCredito ? "Sí" : "No"}
          </span>
        </p>
      )}

      {fechaContacto && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-500">
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          Primer contacto: <span className="font-medium text-stone-700">{fechaContacto}</span>
        </p>
      )}

      {ultimaActualizacion && (
        <p className="mt-1 text-xs text-stone-400">
          Última actualización: {ultimaActualizacion}
        </p>
      )}

      {onCambiarEstado && (
        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
          {menuAbierto ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Mover a
              </p>
              {otrosEstados.map((e) => {
                const s = ESTADO_CLIENTE_STYLES[e];
                return (
                  <button
                    key={e}
                    type="button"
                    disabled={moviendo}
                    onClick={() => mover(e)}
                    className={`rounded-lg px-3 py-2.5 text-sm font-bold uppercase tracking-wide shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] ${s.solidBg} ${s.solidText} hover:brightness-110`}
                  >
                    {moviendo && estadoEnCurso === e ? "Guardando..." : s.label}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={moviendo}
                onClick={() => setMenuAbierto(false)}
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setMenuAbierto(true)}
              className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
            >
              Cambiar estado
            </button>
          )}
        </div>
      )}
    </article>
  );
}
