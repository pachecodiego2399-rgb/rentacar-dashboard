"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDatos } from "@/components/panel/DatosProvider";
import { Card, Encabezado, Icono, PillCliente, SinDato, Vacio } from "@/components/panel/ui";
import { ESTADOS_CLIENTE } from "@/lib/estado-cliente";
import {
  fechaLocal,
  formatearTelefono,
  formatoCorto,
  fueraDeHorario,
  haceCuanto,
  mensajesDe,
  proximaAccion,
  ultimaInteraccion,
} from "@/lib/metricas";
import type { Cliente, EstadoCliente } from "@/lib/types";

type Rapido = "atencion" | "listos" | "fuera" | "manual" | null;

export default function ClientesPage() {
  return (
    <Suspense>
      <Clientes />
    </Suspense>
  );
}

function escribioFueraDeHorario7d(c: Cliente): boolean {
  const desde = Date.now() - 7 * 864e5;
  return mensajesDe(c).some((m) => m.autor === "cliente" && m.fecha && m.fecha.getTime() >= desde && fueraDeHorario(m.fecha));
}

function Clientes() {
  const { clientes, cargando } = useDatos();
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [etapa, setEtapa] = useState<EstadoCliente | "">((params.get("etapa") as EstadoCliente) ?? "");
  const [auto, setAuto] = useState("");
  const [rapido, setRapido] = useState<Rapido>(null);

  useEffect(() => {
    setQ(params.get("q") ?? "");
    setEtapa((params.get("etapa") as EstadoCliente) ?? "");
  }, [params]);

  const rapidos: { id: Exclude<Rapido, null>; label: string; test: (c: Cliente) => boolean }[] = [
    { id: "atencion", label: "Necesitan tu atención", test: (c) => c.estado === "Necesita ayuda humana" },
    { id: "listos", label: "Listos para retirar", test: (c) => c.estado === "Listo para retirar" },
    { id: "fuera", label: "Fuera de horario esta semana", test: escribioFueraDeHorario7d },
    { id: "manual", label: "Los estás atendiendo tú", test: (c) => c.pausado },
  ];

  const autosPedidos = useMemo(
    () => [...new Set(clientes.map((c) => c.autoDeInteres.trim()).filter(Boolean))].sort(),
    [clientes]
  );

  const filas = useMemo(() => {
    const texto = q.trim().toLowerCase();
    const soloDigitos = texto.replace(/\D/g, "");
    const test = rapidos.find((r) => r.id === rapido)?.test;
    return clientes
      .filter((c) => !etapa || c.estado === etapa)
      .filter((c) => !auto || c.autoDeInteres.trim() === auto)
      .filter((c) => !test || test(c))
      .filter(
        (c) =>
          !texto ||
          c.nombre.toLowerCase().includes(texto) ||
          c.autoDeInteres.toLowerCase().includes(texto) ||
          (soloDigitos.length >= 3 && c.telefono.replace(/\D/g, "").includes(soloDigitos))
      )
      .sort((a, b) => (ultimaInteraccion(b)?.getTime() ?? 0) - (ultimaInteraccion(a)?.getTime() ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientes, q, etapa, auto, rapido]);

  function exportar() {
    const cols = ["Nombre", "Teléfono", "Etapa", "Auto de interés", "Fecha de retiro", "Hora de retiro", "Última interacción", "Próxima acción", "Atiende"];
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lineas = filas.map((c) =>
      [
        c.nombre,
        c.telefono,
        c.estado,
        c.autoDeInteres,
        c.fechaRetiro ?? "",
        c.horaRetiro ?? "",
        ultimaInteraccion(c)?.toLocaleString("es-CL") ?? "",
        proximaAccion(c),
        c.pausado ? "Tú" : "Agente",
      ]
        .map(esc)
        .join(",")
    );
    const blob = new Blob(["﻿" + [cols.map(esc).join(","), ...lineas].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="flex flex-col gap-5">
      <Encabezado titulo="Clientes" bajada="Todas las personas que atendió el agente, con lo que se sabe de cada conversación." />

      <div className="flex flex-wrap gap-2">
        {rapidos.map((r) => {
          const n = clientes.filter(r.test).length;
          const activo = rapido === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setRapido(activo ? null : r.id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] transition ${
                activo ? "border-n-acc/60 bg-n-acc/15 text-n-fg" : "border-n-line bg-n-card/70 text-n-muted hover:text-n-fg"
              }`}
            >
              {r.label}
              <span className="tabular-nums text-n-faint">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-n-line bg-n-card/70 px-3 py-2 text-n-faint focus-within:border-n-acc/60 sm:max-w-[320px]">
          <Icono nombre="buscar" className="h-4 w-4" />
          <input
            id="buscar-clientes"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Busca por nombre, teléfono o auto"
            className="w-full bg-transparent text-[13.5px] text-n-fg placeholder:text-n-faint focus:outline-none"
          />
        </label>
        <Selector id="filtro-etapa" valor={etapa} onChange={(v) => setEtapa(v as EstadoCliente | "")} opciones={ESTADOS_CLIENTE} todas="Etapa" />
        <Selector id="filtro-auto" valor={auto} onChange={setAuto} opciones={autosPedidos} todas="Auto" />
        {["Origen", "Score"].map((f) => (
          <span key={f} title="Disponible próximamente" className="cursor-default rounded-lg border border-n-line bg-n-card/40 px-3 py-2 text-[13px] text-n-faint">
            {f}
          </span>
        ))}
        <button
          onClick={exportar}
          className="ml-auto flex items-center gap-2 rounded-lg border border-n-line bg-n-card/70 px-3 py-2 text-[13px] text-n-muted transition hover:text-n-fg"
        >
          <Icono nombre="exportar" className="h-4 w-4" /> Exportar
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] whitespace-nowrap text-left text-[14px]">
            <thead>
              <tr className="border-b border-n-line text-[12.5px] text-n-faint">
                {["Cliente", "Etapa", "Auto de interés", "Score IA", "Retiro", "Origen", "Valor estimado", "Última interacción", "Próxima acción", "Atiende"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!cargando &&
                filas.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/conversaciones?c=${c.id}`)}
                    className="cursor-pointer border-b border-n-line transition last:border-0 hover:bg-n-hover/50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-n-fg">{c.nombre}</div>
                      <div className="text-[12.5px] tabular-nums text-n-faint">{formatearTelefono(c.telefono)}</div>
                    </td>
                    <td className="px-4 py-3"><PillCliente estado={c.estado} corta /></td>
                    <td className="px-4 py-3 text-n-muted">{c.autoDeInteres || "—"}</td>
                    <td className="px-4 py-3"><SinDato motivo="El puntaje de cada cliente llega en una próxima versión del agente." /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-n-muted">
                      {c.fechaRetiro ? formatoCorto(fechaLocal(c.fechaRetiro, c.horaRetiro), !!c.horaRetiro) : "—"}
                    </td>
                    <td className="px-4 py-3"><SinDato motivo="Falta que el agente registre de dónde llega cada cliente." /></td>
                    <td className="px-4 py-3"><SinDato motivo="Falta registrar los días y el valor de cada reserva." /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-n-muted">{haceCuanto(ultimaInteraccion(c))}</td>
                    <td className="max-w-[240px] truncate px-4 py-3 text-n-muted" title={proximaAccion(c)}>{proximaAccion(c)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[12px] ${
                          c.pausado ? "border-n-warn/40 bg-n-warn/10 text-n-warn" : "border-n-acc/40 bg-n-acc/10 text-n-acc2"
                        }`}
                      >
                        {c.pausado ? "Tú" : "Agente"}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!cargando && filas.length === 0 && (
          <div className="p-5">
            <Vacio>Ningún cliente coincide con esos filtros.</Vacio>
          </div>
        )}
        {cargando && <div className="h-40 animate-pulse bg-n-card" />}
      </Card>
      <p className="text-[12.5px] text-n-faint">
        {filas.length} de {clientes.length} clientes · Toca una fila para abrir su conversación.
      </p>
    </div>
  );
}

function Selector({
  id,
  valor,
  onChange,
  opciones,
  todas,
}: {
  id: string;
  valor: string;
  onChange: (v: string) => void;
  opciones: readonly string[];
  todas: string;
}) {
  return (
    <select
      id={id}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-n-line bg-n-card/70 px-3 py-2 text-[13px] text-n-muted focus:border-n-acc/60 focus:outline-none"
    >
      <option value="">{todas}: todas</option>
      {opciones.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
