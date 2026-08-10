"use client";

import { useState } from "react";
import type { Auto, EstadoAuto } from "@/lib/types";
import { ESTADO_STYLES, ESTADOS } from "@/lib/estado";
import { formatearPrecio, formatearFecha } from "@/lib/format";
import EstadoBadge from "./EstadoBadge";

interface Props {
  auto: Auto;
  onEstadoChange: (id: string, nuevoEstado: EstadoAuto) => void;
}

type Accion = "idle" | "guardando" | "ok" | "error";

// Después de guardar, dejamos el check visible un momento antes de que la
// tarjeta se reordene a su nueva columna, para que Salvador alcance a verlo.
const RETRASO_REORDEN_MS = 1400;

export default function CarCard({ auto, onEstadoChange }: Props) {
  const style = ESTADO_STYLES[auto.estado];
  const fecha = formatearFecha(auto.fechaDevolucion);
  const [accion, setAccion] = useState<Accion>("idle");
  const [estadoEnCurso, setEstadoEnCurso] = useState<EstadoAuto | null>(null);

  async function cambiarEstado(nuevoEstado: EstadoAuto) {
    setAccion("guardando");
    setEstadoEnCurso(nuevoEstado);
    try {
      const res = await fetch(`/api/autos/${auto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error ?? "No se pudo actualizar.");
      }
      setAccion("ok");
      setEstadoEnCurso(null);
      setTimeout(() => onEstadoChange(auto.id, nuevoEstado), RETRASO_REORDEN_MS);
    } catch {
      setAccion("error");
      setEstadoEnCurso(null);
    }
  }

  const otrosEstados = ESTADOS.filter((e) => e !== auto.estado);
  const guardando = accion === "guardando";

  return (
    <article
      className={`rounded-lg border border-l-4 border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md ${style.border} ${
        accion === "ok" ? "ring-2 ring-brand-forest" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 break-words font-display text-lg font-bold uppercase tracking-wide text-stone-900">
          {auto.nombre}
        </h3>
        <span className="shrink-0 rounded bg-stone-100 px-2 py-0.5 font-mono text-xs text-stone-600">
          {auto.patente}
        </span>
      </div>

      <div className="mt-2">
        <EstadoBadge estado={auto.estado} size="sm" />
      </div>

      <p className="mt-3 text-lg font-semibold text-stone-900">
        {formatearPrecio(auto.precioPorDia)}
        <span className="ml-1 text-xs font-normal text-stone-400">/ día</span>
      </p>

      {auto.requisitos && (
        <p className="mt-2 text-sm text-stone-500">{auto.requisitos}</p>
      )}

      {fecha && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-500">
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          Devolución: <span className="font-medium text-stone-700">{fecha}</span>
        </p>
      )}

      {accion === "ok" && (
        <p className="mt-3 flex items-center gap-1.5 rounded-md bg-brand-forest/10 px-2.5 py-1.5 text-sm font-semibold text-brand-forest">
          <span aria-hidden="true">✓</span> Actualizado
        </p>
      )}

      {accion === "error" && (
        <p className="mt-3 rounded-md bg-rose-50 px-2.5 py-1.5 text-sm font-medium text-rose-600">
          No se pudo actualizar, intentá de nuevo.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {otrosEstados.map((e) => {
          const s = ESTADO_STYLES[e];
          const cargandoEste = guardando && estadoEnCurso === e;
          return (
            <button
              key={e}
              type="button"
              disabled={guardando}
              onClick={() => cambiarEstado(e)}
              className={`flex-1 rounded-lg px-4 py-3.5 text-base font-bold uppercase tracking-wide shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] ${s.solidBg} ${s.solidText} hover:brightness-110`}
            >
              {cargandoEste ? "Guardando..." : `Marcar ${s.label}`}
            </button>
          );
        })}
      </div>
    </article>
  );
}
