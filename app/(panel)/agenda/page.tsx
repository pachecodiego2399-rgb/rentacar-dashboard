"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDatos } from "@/components/panel/DatosProvider";
import { Card, Encabezado, Icono, PillCliente, Vacio } from "@/components/panel/ui";
import { fechaLocal, formatoCorto } from "@/lib/metricas";

const HORA_INICIO = 8;
const HORA_FIN = 20;
const ALTO_HORA = 56;
const COLOR_DEVOLUCION = "#34d399";

interface Evento {
  id: string;
  tipo: "retiro" | "devolucion";
  titulo: string;
  detalle: string;
  inicio: Date;
  conHora: boolean;
  color: string;
  href?: string;
  estadoCliente?: Parameters<typeof PillCliente>[0]["estado"];
}

function lunesDe(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dia = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dia);
  return x;
}

const mismoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export default function AgendaPage() {
  const { clientes, autos } = useDatos();
  const [vista, setVista] = useState<"semana" | "lista">("semana");
  const [tipo, setTipo] = useState<"todos" | "retiro" | "devolucion">("todos");
  const [lunes, setLunes] = useState(() => lunesDe(new Date()));

  const eventos = useMemo<Evento[]>(() => {
    const ev: Evento[] = [];
    for (const c of clientes) {
      const f = fechaLocal(c.fechaRetiro, c.horaRetiro);
      if (!f || c.estado === "En conversación") continue;
      ev.push({
        id: `r-${c.id}`,
        tipo: "retiro",
        titulo: c.nombre,
        detalle: `Retiro · ${c.autoDeInteres || "auto sin definir"}`,
        inicio: f,
        conHora: !!c.horaRetiro,
        color: c.estado === "Completado" ? "#8c97b3" : "#4c7eff",
        href: `/conversaciones?c=${c.id}`,
        estadoCliente: c.estado,
      });
    }
    for (const a of autos) {
      const f = fechaLocal(a.fechaDevolucion);
      if (!f || a.estado !== "Arrendado") continue;
      ev.push({
        id: `d-${a.id}`,
        tipo: "devolucion",
        titulo: a.nombre,
        detalle: "Devolución",
        inicio: f,
        conHora: false,
        color: COLOR_DEVOLUCION,
        href: "/flota",
      });
    }
    return ev.filter((e) => tipo === "todos" || e.tipo === tipo).sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  }, [clientes, autos, tipo]);

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(d.getDate() + i);
    return d;
  });
  const domingo = dias[6];
  const deLaSemana = eventos.filter((e) => e.inicio >= lunes && e.inicio < new Date(domingo.getTime() + 864e5));
  const rango = `${new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short" }).format(lunes)} – ${new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
  }).format(domingo)}`.replace(/\./g, "");
  const mover = (dias: number) =>
    setLunes((l) => {
      const n = new Date(l);
      n.setDate(n.getDate() + dias);
      return n;
    });

  return (
    <div className="flex flex-col gap-5">
      <Encabezado titulo="Agenda" bajada="Los retiros que dejó listos el agente y las devoluciones de la flota, semana a semana." />

      <div className="flex flex-wrap items-center gap-2">
        <Segmentos valor={vista} onChange={setVista} opciones={[["semana", "Semana"], ["lista", "Lista"]]} />
        <Segmentos
          valor={tipo}
          onChange={setTipo}
          opciones={[["todos", "Todo"], ["retiro", "Retiros"], ["devolucion", "Devoluciones"]]}
        />
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => mover(-7)} aria-label="Semana anterior" className="rounded-lg p-2 text-n-muted hover:bg-n-card hover:text-n-fg">
            <Icono nombre="chevronIzq" className="h-4 w-4" />
          </button>
          <span className="min-w-[130px] text-center text-[14px] text-n-fg">{rango}</span>
          <button onClick={() => mover(7)} aria-label="Semana siguiente" className="rounded-lg p-2 text-n-muted hover:bg-n-card hover:text-n-fg">
            <Icono nombre="chevronDer" className="h-4 w-4" />
          </button>
          <button
            onClick={() => setLunes(lunesDe(new Date()))}
            className="rounded-lg border border-n-line bg-n-card/70 px-3 py-1.5 text-[13px] text-n-muted hover:text-n-fg"
          >
            Hoy
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-5 text-[12.5px] text-n-muted">
        <span className="flex items-center gap-2"><span className="h-3 w-[3px] rounded bg-n-acc" /> Retiro que dejó listo el agente</span>
        <span className="flex items-center gap-2"><span className="h-3 w-[3px] rounded bg-n-ok" /> Devolución de un auto</span>
        <span className="flex items-center gap-2"><span className="h-3 w-[3px] rounded bg-n-muted" /> Arriendo completado</span>
      </div>

      {vista === "semana" ? (
        <Semana dias={dias} eventos={deLaSemana} />
      ) : (
        <Card className="p-2">
          {deLaSemana.length === 0 ? (
            <div className="p-3"><Vacio>No hay retiros ni devoluciones esta semana.</Vacio></div>
          ) : (
            deLaSemana.map((e) => (
              <Link key={e.id} href={e.href ?? "#"} className="flex items-center gap-4 rounded-lg px-3 py-3 hover:bg-n-hover/50">
                <span className="h-9 w-[3px] rounded" style={{ background: e.color }} />
                <div className="w-44 text-[13.5px] text-n-muted">{formatoCorto(e.inicio, e.conHora)}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] text-n-fg">{e.titulo}</div>
                  <div className="text-[12.5px] text-n-faint">{e.detalle}</div>
                </div>
                {e.estadoCliente && <PillCliente estado={e.estadoCliente} corta />}
              </Link>
            ))
          )}
        </Card>
      )}
    </div>
  );
}

function Semana({ dias, eventos }: { dias: Date[]; eventos: Evento[] }) {
  const hoy = new Date();
  const horas = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i);

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[880px]">
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-n-line">
            <div />
            {dias.map((d) => {
              const esHoy = mismoDia(d, hoy);
              return (
                <div key={d.toISOString()} className={`border-l border-n-line px-3 py-2.5 ${esHoy ? "bg-n-acc/[0.07]" : ""}`}>
                  <div className={`text-[13.5px] font-medium capitalize ${esHoy ? "text-n-acc2" : "text-n-fg"}`}>
                    {new Intl.DateTimeFormat("es-CL", { weekday: "short" }).format(d).replace(".", "")}
                  </div>
                  <div className="text-[12px] text-n-faint">
                    {new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short" }).format(d).replace(".", "")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Todo el día: devoluciones y retiros sin hora */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-n-line">
            <div className="px-2 py-2 text-right text-[10.5px] leading-tight text-n-faint">todo el día</div>
            {dias.map((d) => (
              <div key={d.toISOString()} className="flex min-h-[38px] flex-col gap-1 border-l border-n-line p-1.5">
                {eventos
                  .filter((e) => !e.conHora && mismoDia(e.inicio, d))
                  .map((e) => (
                    <Bloque key={e.id} e={e} />
                  ))}
              </div>
            ))}
          </div>

          <div className="relative grid grid-cols-[56px_repeat(7,1fr)]" style={{ height: horas.length * ALTO_HORA }}>
            <div className="relative">
              {horas.map((h, i) => (
                <div key={h} className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-n-faint" style={{ top: i * ALTO_HORA }}>
                  {i === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
                </div>
              ))}
            </div>
            {dias.map((d) => {
              const delDia = eventos.filter((e) => e.conHora && mismoDia(e.inicio, d));
              return (
                <div key={d.toISOString()} className={`relative border-l border-n-line ${mismoDia(d, hoy) ? "bg-n-acc/[0.04]" : ""}`}>
                  {horas.map((h, i) => (
                    <div key={h} className="absolute inset-x-0 border-t border-n-line" style={{ top: i * ALTO_HORA }} />
                  ))}
                  {delDia.map((e, i) => {
                    const h = e.inicio.getHours() + e.inicio.getMinutes() / 60;
                    const top = Math.max(0, Math.min(horas.length - 1, h - HORA_INICIO)) * ALTO_HORA;
                    const solapados = delDia.filter((o) => Math.abs(o.inicio.getTime() - e.inicio.getTime()) < 36e5);
                    const col = solapados.indexOf(e);
                    const ancho = 100 / solapados.length;
                    return (
                      <div
                        key={e.id}
                        className="absolute p-0.5"
                        style={{ top, height: ALTO_HORA, left: `${col * ancho}%`, width: `${ancho}%`, zIndex: i + 1 }}
                      >
                        <Bloque e={e} alto />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

function Bloque({ e, alto = false }: { e: Evento; alto?: boolean }) {
  const hora = e.conHora ? new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(e.inicio) : null;
  return (
    <Link
      href={e.href ?? "#"}
      title={`${e.titulo} · ${e.detalle}`}
      className={`block overflow-hidden rounded-lg border border-n-line2 bg-n-card2 px-2 py-1 text-[12px] leading-tight transition hover:border-n-acc/50 ${alto ? "h-full" : ""}`}
      style={{ borderLeft: `3px solid ${e.color}` }}
    >
      <div className="truncate text-n-fg">
        {hora && <span className="mr-1 tabular-nums text-n-muted">{hora}</span>}
        {e.titulo}
      </div>
      <div className="truncate text-n-faint">{e.detalle}</div>
    </Link>
  );
}

function Segmentos<T extends string>({
  valor,
  onChange,
  opciones,
}: {
  valor: T;
  onChange: (v: T) => void;
  opciones: [T, string][];
}) {
  return (
    <div className="flex items-center rounded-lg border border-n-line bg-n-card/70 p-0.5">
      {opciones.map(([id, label]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`rounded-md px-3 py-1.5 text-[13px] transition ${valor === id ? "bg-n-hover text-n-fg" : "text-n-muted hover:text-n-fg"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
