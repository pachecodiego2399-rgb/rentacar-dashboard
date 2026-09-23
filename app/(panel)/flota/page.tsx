"use client";

import { useMemo, useState } from "react";
import { useDatos } from "@/components/panel/DatosProvider";
import { COLOR_ESTADO_AUTO, Card, Encabezado, Icono, PillAuto, Vacio } from "@/components/panel/ui";
import { fechaLocal, formatoCorto, pct, pesos } from "@/lib/metricas";
import type { Auto, EstadoAuto } from "@/lib/types";

const ESTADOS: EstadoAuto[] = ["Disponible", "Arrendado", "Mantención"];

export default function FlotaPage() {
  const { autos, clientes, cargando } = useDatos();
  const [filtro, setFiltro] = useState<EstadoAuto | "">("");

  const interesados = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of autos) {
      const tokens = a.nombre.toLowerCase().split(/\s+/);
      m.set(a.id, clientes.filter((c) => tokens.every((t) => c.autoDeInteres.toLowerCase().includes(t))).length);
    }
    return m;
  }, [autos, clientes]);

  const conteo = (e: EstadoAuto) => autos.filter((a) => a.estado === e).length;
  const ocupacion = autos.length ? (conteo("Arrendado") / autos.length) * 100 : null;
  const visibles = autos.filter((a) => !filtro || a.estado === filtro);

  return (
    <div className="flex flex-col gap-5">
      <Encabezado titulo="Flota" bajada="Tus autos, en qué estado están y cuándo vuelve cada uno. El agente solo ofrece los disponibles." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {ESTADOS.map((e) => (
          <button key={e} onClick={() => setFiltro(filtro === e ? "" : e)} className="text-left">
            <Card className={`p-4 transition hover:border-n-line2 ${filtro === e ? "!border-n-acc/60" : ""}`}>
              <div className="flex items-center justify-between">
                <PillAuto estado={e} />
                <span className="text-[12px] text-n-faint">{filtro === e ? "filtrando" : ""}</span>
              </div>
              <div className="mt-3 font-display text-[28px] font-semibold tabular-nums">{cargando ? "…" : conteo(e)}</div>
              <div className="text-[12.5px] text-n-faint">{conteo(e) === 1 ? "auto" : "autos"}</div>
            </Card>
          </button>
        ))}
        <Card className="p-4">
          <div className="text-[13px] text-n-muted">Ocupación hoy</div>
          <div className="mt-3 font-display text-[28px] font-semibold tabular-nums">{pct(ocupacion)}</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-n-bg/70">
            <div className="h-full rounded-full bg-n-acc" style={{ width: `${ocupacion ?? 0}%` }} />
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-n-line text-[12.5px] text-n-faint">
                {["Auto", "Estado", "Precio por día", "Vuelve", "Clientes interesados", "Cambiar estado"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibles.map((a) => (
                <Fila key={a.id} auto={a} interesados={interesados.get(a.id) ?? 0} />
              ))}
            </tbody>
          </table>
        </div>
        {!cargando && visibles.length === 0 && <div className="p-5"><Vacio>No hay autos en ese estado.</Vacio></div>}
        {cargando && <div className="h-32 animate-pulse bg-n-card" />}
      </Card>
    </div>
  );
}

function Fila({ auto, interesados }: { auto: Auto; interesados: number }) {
  const { cambiarEstadoAuto } = useDatos();
  const [pidiendoFecha, setPidiendoFecha] = useState(false);
  const [fecha, setFecha] = useState(auto.fechaDevolucion ?? "");
  const [guardando, setGuardando] = useState(false);
  const detalle = [auto.anio, auto.caja, auto.traccion && auto.traccion.toLowerCase() === "si" ? "4x4" : null].filter(Boolean).join(" · ");

  async function cambiar(e: EstadoAuto, f: string | null) {
    setGuardando(true);
    await cambiarEstadoAuto(auto.id, e, f);
    setGuardando(false);
    setPidiendoFecha(false);
  }

  return (
    <tr className="border-b border-n-line last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {auto.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={auto.fotoUrl} alt={auto.nombre} className="h-11 w-16 rounded-lg border border-n-line object-cover" />
          ) : (
            <span className="flex h-11 w-16 items-center justify-center rounded-lg border border-n-line text-n-faint">
              <Icono nombre="auto" />
            </span>
          )}
          <div>
            <div className="font-medium text-n-fg">{auto.nombre}</div>
            <div className="text-[12.5px] text-n-faint">{detalle || "—"}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><PillAuto estado={auto.estado} /></td>
      <td className="px-4 py-3 tabular-nums text-n-muted">{pesos(auto.precioPorDia)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-n-muted">
        {auto.estado === "Arrendado" && auto.fechaDevolucion ? formatoCorto(fechaLocal(auto.fechaDevolucion), false) : "—"}
      </td>
      <td className="px-4 py-3 tabular-nums text-n-muted">{interesados}</td>
      <td className="px-4 py-3">
        {pidiendoFecha ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              cambiar("Arrendado", fecha || null);
            }}
            className="flex items-center gap-2"
          >
            <input
              id={`devolucion-${auto.id}`}
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-lg border border-n-line2 bg-n-bg/60 px-2 py-1.5 text-[13px] text-n-fg [color-scheme:dark] focus:outline-none"
            />
            <button type="submit" disabled={guardando} className="rounded-lg bg-n-acc px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-50">
              {guardando ? "…" : "Guardar"}
            </button>
            <button type="button" onClick={() => setPidiendoFecha(false)} className="text-[13px] text-n-faint hover:text-n-fg">
              Cancelar
            </button>
          </form>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {ESTADOS.filter((e) => e !== auto.estado).map((e) => (
              <button
                key={e}
                disabled={guardando}
                onClick={() => (e === "Arrendado" ? setPidiendoFecha(true) : cambiar(e, null))}
                className="rounded-lg border px-2.5 py-1 text-[12.5px] transition hover:brightness-125 disabled:opacity-50"
                style={{ color: COLOR_ESTADO_AUTO[e], borderColor: `${COLOR_ESTADO_AUTO[e]}55`, background: `${COLOR_ESTADO_AUTO[e]}12` }}
              >
                {e}
              </button>
            ))}
            {auto.estado === "Arrendado" && (
              <button onClick={() => setPidiendoFecha(true)} className="rounded-lg px-2 py-1 text-[12.5px] text-n-faint hover:text-n-fg">
                Editar fecha
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
