"use client";

import Link from "next/link";
import { useMemo } from "react";
import { clientConfig } from "@/config/client";
import { useDatos } from "@/components/panel/DatosProvider";
import { Card, Delta, Encabezado, Proximamente, SinDato, Titulo, COLOR_ESTADO_CLIENTE, Vacio } from "@/components/panel/ui";
import BarrasMensajes from "@/components/panel/BarrasMensajes";
import {
  PERIODOS,
  actividadReciente,
  calcularPanel,
  haceCuanto,
  numero,
  pct,
  pesos,
  primerNombre,
  serieMensajes,
  ultimoMensajeCliente,
  ultimaInteraccion,
  variacion,
} from "@/lib/metricas";
import { ESTADOS_CLIENTE } from "@/lib/estado-cliente";

const SIN_TIEMPO = "Se empieza a medir cuando el agente guarde la hora exacta de cada respuesta.";
const SIN_VALOR = "Falta registrar los días y el valor de cada reserva.";
const SIN_ORIGEN = "Falta que el agente registre de dónde llega cada cliente.";

export default function PanelPage() {
  const { clientes, autos, periodo, cargando } = useDatos();
  const m = useMemo(() => calcularPanel(clientes, autos, periodo), [clientes, autos, periodo]);
  const serie = useMemo(() => serieMensajes(clientes, periodo), [clientes, periodo]);
  const actividad = useMemo(() => actividadReciente(clientes, 14), [clientes]);
  const textoPeriodo = PERIODOS.find((p) => p.id === periodo)?.texto ?? "";

  const embudo = ESTADOS_CLIENTE.map((e) => ({ estado: e, n: clientes.filter((c) => c.estado === e).length }));
  const maxEmbudo = Math.max(1, ...embudo.map((f) => f.n));

  const pedidos = useMemo(() => {
    const cuenta = new Map<string, number>();
    for (const c of clientes) {
      const k = c.autoDeInteres.trim();
      if (k) cuenta.set(k, (cuenta.get(k) ?? 0) + 1);
    }
    return [...cuenta.entries()]
      .map(([auto, n]) => {
        // "Nissan SUV 2022" (lo que anota el agente) ↔ "Nissan Suv" (la flota):
        // calza si todas las palabras del auto de la flota aparecen en el pedido.
        const pedido = auto.toLowerCase();
        const match = autos.find((a) => a.nombre.toLowerCase().split(/\s+/).every((t) => pedido.includes(t)));
        return { auto, n, precio: match?.precioPorDia ?? null };
      })
      .sort((a, b) => b.n - a.n)
      .slice(0, 5);
  }, [clientes, autos]);
  const maxPedidos = Math.max(1, ...pedidos.map((p) => p.n));

  if (cargando) return <Esqueleto />;

  return (
    <div className="flex flex-col gap-5">
      <Encabezado titulo="Panel" bajada={`Lo que el agente hizo por ${clientConfig.businessName} en ${textoPeriodo}.`} />

      {/* ── Primera respuesta + KPIs ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <Card className="col-span-2 p-5 lg:col-span-1 lg:row-span-2">
          <div className="flex items-center justify-between">
            <div className="text-[13px] text-n-muted">Primera respuesta del agente</div>
            <Proximamente />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-[46px] font-semibold leading-none">
              <SinDato motivo={SIN_TIEMPO} className="!text-n-muted" />
            </span>
            <span className="text-[13px] text-n-faint">promedio</span>
          </div>
          <div className="mt-6 flex flex-col gap-4">
            <BarraComparativa etiqueta="Antes del agente" valor="—" color="#f87171" ancho={0} />
            <BarraComparativa etiqueta="Con el agente" valor="—" color="#34d399" ancho={0} />
          </div>
          <p className="mt-5 text-[13px] leading-relaxed text-n-muted">
            Acá vas a ver cuánto más rápido responde el agente que una persona.{" "}
            <span className="text-n-faint">{SIN_TIEMPO}</span>
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-n-line pt-4">
            <MiniDato etiqueta="Respuestas del agente" valor={numero(m.respuestasAgente)} />
            <MiniDato etiqueta="Mensajes de clientes" valor={numero(m.mensajesClientes)} />
          </div>
        </Card>

        <Kpi titulo="Clientes atendidos" valor={numero(m.clientesAtendidos.valor ?? 0)} delta={variacion(m.clientesAtendidos)} />
        <Kpi titulo="Reservas confirmadas" valor={numero(m.reservas.valor ?? 0)} delta={variacion(m.reservas)} />
        <Kpi titulo="Tasa de reserva" valor={pct(m.conversion.valor)} delta={variacion(m.conversion)} />
        <Kpi
          titulo="Escribieron fuera de horario"
          valor={pct(m.fueraDeHorarioPct.valor)}
          nota={`Fuera de ${clientConfig.openingHour}:00 a ${clientConfig.closingHour}:00`}
        />
        <Kpi
          titulo="Flota ocupada hoy"
          valor={pct(m.flotaOcupadaPct)}
          nota={`${m.autosArrendados} de ${m.autosTotal} autos arrendados`}
        />
        <Kpi titulo="Facturación estimada" valor={<SinDato motivo={SIN_VALOR} />} nota={<Proximamente />} />
      </div>

      {/* ── Antes y ahora ───────────────────────────────────────────── */}
      <Card className="p-5">
        <Titulo titulo="Antes y ahora" bajada="Antes del agente contra el período seleccionado. Los valores de antes se completan cuando registremos tu punto de partida." />
        <div className="mt-5 grid gap-6 md:grid-cols-3">
          <AntesAhora titulo="Tiempo de primera respuesta" ahora="—" antes="—" relleno={0} nota={SIN_TIEMPO} />
          <AntesAhora
            titulo="Clientes sin respuesta en 24 h"
            ahora={numero(m.sinRespuesta)}
            antes="—"
            relleno={m.sinRespuesta === 0 ? 100 : Math.max(5, 100 - (m.sinRespuesta / Math.max(1, clientes.length)) * 100)}
            nota="Clientes cuyo último mensaje lleva más de un día sin respuesta."
          />
          <AntesAhora
            titulo="Mensajes fuera de horario respondidos"
            ahora={numero(m.mensajesFueraHorario)}
            antes="—"
            relleno={m.mensajesFueraHorario > 0 ? 100 : 0}
            nota="Consultas que llegaron con el local cerrado y el agente contestó igual."
          />
        </div>
      </Card>

      {/* ── Mensajes por día ────────────────────────────────────────── */}
      <Card className="p-5">
        <Titulo
          titulo={periodo === "hoy" ? "Mensajes por hora" : "Mensajes por día"}
          bajada="Cuándo escriben los clientes. La franja violeta es lo que entra con el local cerrado."
          derecha={
            <div className="text-right">
              <div className="font-display text-[28px] font-semibold leading-none text-n-night">{pct(m.fueraDeHorarioPct.valor)}</div>
              <div className="mt-1 text-[12px] text-n-faint">fuera de horario</div>
            </div>
          }
        />
        <BarrasMensajes serie={serie} />
      </Card>

      {/* ── Embudo ──────────────────────────────────────────────────── */}
      <Card className="p-5">
        <Titulo titulo="Embudo" bajada="Todos los clientes, por etapa. El monto se suma cuando registremos el valor de cada reserva." />
        <div className="mt-4 flex flex-col">
          {embudo.map((f) => (
            <Link
              key={f.estado}
              href={`/clientes?etapa=${encodeURIComponent(f.estado)}`}
              className="grid grid-cols-[1fr_44px] items-center gap-4 rounded-lg px-2 py-2.5 transition hover:bg-n-hover/60 sm:grid-cols-[minmax(150px,220px)_1fr_48px_90px]"
            >
              <span className="flex items-center gap-2 text-[14px] text-n-fg">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: COLOR_ESTADO_CLIENTE[f.estado] }} />
                {f.estado}
              </span>
              <span className="hidden h-[18px] overflow-hidden rounded-md bg-n-bg/60 sm:block">
                <span
                  className="block h-full rounded-md"
                  style={{ width: `${(f.n / maxEmbudo) * 100}%`, background: COLOR_ESTADO_CLIENTE[f.estado], opacity: 0.75 }}
                />
              </span>
              <span className="text-right text-[14px] font-semibold tabular-nums">{f.n}</span>
              <span className="hidden text-right text-[13px] sm:block"><SinDato motivo={SIN_VALOR} /></span>
            </Link>
          ))}
        </div>
      </Card>

      {/* ── Origen + Autos más pedidos ─────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <Titulo titulo="Origen de los clientes" bajada="De dónde viene cada consulta que atiende el agente." derecha={<Proximamente />} />
          <div className="mt-4 h-2 rounded-full bg-n-bg/70" />
          <div className="mt-4 flex flex-col gap-2.5">
            {["Meta Ads", "Instagram", "Google", "Web", "Referido", "Otro"].map((o) => (
              <div key={o} className="flex items-center gap-2 text-[14px] text-n-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-n-faint" />
                <span className="flex-1">{o}</span>
                <span className="w-12 text-right text-[12px]"><SinDato motivo={SIN_ORIGEN} /></span>
                <span className="w-8 text-right"><SinDato motivo={SIN_ORIGEN} /></span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <Titulo titulo="Autos más pedidos" bajada="Qué auto preguntan los clientes y su precio por día." />
          <div className="mt-4 flex flex-col gap-4">
            {pedidos.length === 0 ? (
              <Vacio>Todavía no hay autos de interés registrados.</Vacio>
            ) : (
              pedidos.map((p) => (
                <div key={p.auto}>
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="text-n-fg">{p.auto}</span>
                    <span className="tabular-nums text-n-muted">
                      {p.n} {p.n === 1 ? "cliente" : "clientes"} · {pesos(p.precio)}/día
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-n-bg/70">
                    <div className="h-full rounded-full bg-n-ok" style={{ width: `${(p.n / maxPedidos) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* ── Actividad + Atención humana ────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <Card className="p-5">
          <Titulo titulo="Actividad del agente" bajada="Lo último que pasó en WhatsApp, en vivo." />
          <ol className="relative mt-4 flex flex-col">
            {actividad.length === 0 ? (
              <Vacio>Sin actividad todavía.</Vacio>
            ) : (
              actividad.map((e, i) => (
                <li key={e.id} className="relative flex gap-3 pb-4">
                  {i < actividad.length - 1 && <span className="absolute left-[4.5px] top-3 h-full w-px bg-n-line" />}
                  <span
                    className="relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-n-card"
                    style={{
                      background:
                        e.tipo === "reserva" ? "#34d399" : e.tipo === "ayuda" ? "#f87171" : e.tipo === "cliente" ? "#5c6684" : e.tipo === "manual" ? "#f5b454" : "#7fa0ff",
                    }}
                  />
                  <Link href={`/conversaciones?c=${e.clienteId}`} className="min-w-0 hover:underline">
                    <div className="text-[14px] text-n-fg">{e.texto}</div>
                    <div className="text-[12px] text-n-faint">{haceCuanto(e.fecha)}</div>
                  </Link>
                </li>
              ))
            )}
          </ol>
        </Card>

        <Card className="p-5">
          <Titulo
            titulo="Requiere atención humana"
            bajada="Lo que el agente te derivó porque no le corresponde resolverlo."
            derecha={
              m.requierenAtencion.length ? (
                <span className="rounded-md bg-n-bad/15 px-2 py-0.5 text-[12px] font-semibold text-n-bad">{m.requierenAtencion.length}</span>
              ) : null
            }
          />
          <div className="mt-4 flex flex-col gap-2.5">
            {m.requierenAtencion.length === 0 ? (
              <Vacio>Nada pendiente. El agente está resolviendo todo.</Vacio>
            ) : (
              m.requierenAtencion.map((c) => {
                const ultimo = ultimoMensajeCliente(c);
                return (
                  <Link
                    key={c.id}
                    href={`/conversaciones?c=${c.id}`}
                    className="block rounded-xl border border-n-line bg-n-bg/40 p-3.5 transition hover:border-n-line2 hover:bg-n-hover/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-[14px] font-medium text-n-fg">
                        Necesita ayuda — {primerNombre(c.nombre)}
                      </div>
                      <span className="rounded-md border border-n-bad/40 bg-n-bad/10 px-2 py-0.5 text-[11.5px] font-medium text-n-bad">Alta</span>
                    </div>
                    {ultimo && <p className="mt-1 line-clamp-2 text-[13px] text-n-muted">&ldquo;{ultimo.texto}&rdquo;</p>}
                    <div className="mt-2 flex items-center justify-between text-[12px] text-n-faint">
                      <span>{c.autoDeInteres || "Sin auto de interés"}{c.pausado ? " · lo estás atendiendo tú" : ""}</span>
                      <span>{haceCuanto(ultimaInteraccion(c))}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ titulo, valor, delta, nota }: { titulo: string; valor: React.ReactNode; delta?: number | null; nota?: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-1.5 p-4">
      <div className="text-[13px] text-n-muted">{titulo}</div>
      <div className="font-display text-[26px] font-semibold tabular-nums leading-tight">{valor}</div>
      <div className="min-h-[18px] text-[12px] text-n-faint">{delta !== undefined && delta !== null ? <Delta valor={delta} /> : nota}</div>
    </Card>
  );
}

function MiniDato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <div className="text-[12px] text-n-faint">{etiqueta}</div>
      <div className="mt-0.5 text-[18px] font-semibold tabular-nums">{valor}</div>
    </div>
  );
}

function BarraComparativa({ etiqueta, valor, color, ancho }: { etiqueta: string; valor: string; color: string; ancho: number }) {
  return (
    <div>
      <div className="flex justify-between text-[13px]">
        <span className="text-n-muted">{etiqueta}</span>
        <span className="text-n-faint">{valor}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-n-bg/70">
        <div className="h-full rounded-full" style={{ width: `${ancho}%`, background: color }} />
      </div>
    </div>
  );
}

function AntesAhora({ titulo, ahora, antes, relleno, nota }: { titulo: string; ahora: string; antes: string; relleno: number; nota: string }) {
  return (
    <div>
      <div className="text-[13px] text-n-muted">{titulo}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`font-display text-[26px] font-semibold tabular-nums ${ahora === "—" ? "text-n-faint" : "text-n-ok"}`}>{ahora}</span>
        <span className="text-[13px] text-n-faint line-through" title="Punto de partida antes del agente: se completa cuando lo registremos.">
          {antes}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-n-bg/70">
        <div className="h-full rounded-full bg-n-ok" style={{ width: `${relleno}%` }} />
      </div>
      <p className="mt-2 text-[12px] text-n-faint">{nota}</p>
    </div>
  );
}

function Esqueleto() {
  return (
    <div className="flex flex-col gap-5">
      <div className="h-14 w-72 animate-pulse rounded-lg bg-n-card" />
      <div className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className={`animate-pulse rounded-2xl bg-n-card ${i === 0 ? "h-72 lg:row-span-2" : "h-32"}`} />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-2xl bg-n-card" />
    </div>
  );
}
