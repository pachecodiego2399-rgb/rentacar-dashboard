"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDatos } from "@/components/panel/DatosProvider";
import { Avatar, COLOR_ESTADO_CLIENTE, Encabezado, Icono, PillCliente, SinDato, Vacio } from "@/components/panel/ui";
import { ESTADOS_CLIENTE } from "@/lib/estado-cliente";
import {
  fechaLocal,
  formatearTelefono,
  formatoCorto,
  fueraDeHorario,
  haceCuanto,
  iniciales,
  mensajesDe,
  proximaAccion,
  ultimaInteraccion,
  type Mensaje,
} from "@/lib/metricas";
import type { Cliente, EstadoCliente } from "@/lib/types";

type Filtro = "todas" | "ayuda" | "tu" | "agente";

export default function ConversacionesPage() {
  return (
    <Suspense>
      <Conversaciones />
    </Suspense>
  );
}

function Conversaciones() {
  const { clientes, cargando } = useDatos();
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [verFicha, setVerFicha] = useState(false);

  const lista = useMemo(
    () =>
      clientes
        .filter((c) => !q || c.nombre.toLowerCase().includes(q.toLowerCase()) || c.telefono.includes(q.replace(/\D/g, "") || "~"))
        .filter((c) =>
          filtro === "todas" ? true : filtro === "ayuda" ? c.estado === "Necesita ayuda humana" : filtro === "tu" ? c.pausado : !c.pausado
        )
        .sort((a, b) => (ultimaInteraccion(b)?.getTime() ?? 0) - (ultimaInteraccion(a)?.getTime() ?? 0)),
    [clientes, q, filtro]
  );

  const idSel = params.get("c");
  const seleccionado = clientes.find((c) => c.id === idSel) ?? lista[0] ?? null;
  const elegir = (c: Cliente) => router.replace(`/conversaciones?c=${c.id}`, { scroll: false });
  // En el celular se ve una cosa a la vez (como WhatsApp): la lista, o el chat
  // abierto. En pantallas más grandes, todo lado a lado.
  const enChat = !!idSel && !!seleccionado;

  return (
    <div className="flex flex-col gap-5">
      <Encabezado titulo="Conversaciones" bajada="Todo lo que se habló por WhatsApp, y lo que se sabe de cada cliente." />

      {/* Ventana fija: la página no se mueve, solo se desplaza el chat (y la lista) por dentro */}
      <div className="grid h-[calc(100dvh-196px)] min-h-[440px] grid-cols-1 grid-rows-[minmax(0,1fr)] overflow-hidden rounded-2xl border border-n-line bg-n-card/60 lg:grid-cols-[270px_minmax(0,1fr)] xl:grid-cols-[270px_minmax(0,1fr)_290px]">
        {/* Lista */}
        <aside className={`${enChat ? "hidden lg:flex" : "flex"} min-h-0 flex-col lg:border-r lg:border-n-line`}>
          <div className="flex flex-col gap-2 border-b border-n-line p-3">
            <label className="flex items-center gap-2 rounded-lg border border-n-line bg-n-bg/50 px-3 py-2 text-n-faint focus-within:border-n-acc/60">
              <Icono nombre="buscar" className="h-4 w-4" />
              <input
                id="buscar-conversacion"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Busca una conversación"
                className="w-full bg-transparent text-[13.5px] text-n-fg placeholder:text-n-faint focus:outline-none"
              />
            </label>
            <div className="flex gap-1">
              {(
                [
                  ["todas", "Todas"],
                  ["ayuda", "Te necesitan"],
                  ["tu", "Tú"],
                  ["agente", "Agente"],
                ] as [Filtro, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setFiltro(id)}
                  className={`whitespace-nowrap rounded-md px-2 py-1 text-[12.5px] transition ${filtro === id ? "bg-n-hover text-n-fg" : "text-n-muted hover:text-n-fg"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {cargando && <div className="m-3 h-20 animate-pulse rounded-xl bg-n-card" />}
            {!cargando && lista.length === 0 && <div className="p-3"><Vacio>Sin conversaciones.</Vacio></div>}
            {lista.map((c) => {
              const ms = mensajesDe(c);
              const ultimo = ms[ms.length - 1];
              const activo = seleccionado?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => elegir(c)}
                  className={`flex w-full gap-3 border-b border-n-line px-3 py-3 text-left transition ${activo ? "bg-n-hover" : "hover:bg-n-hover/50"}`}
                >
                  <Avatar texto={iniciales(c.nombre)} color={COLOR_ESTADO_CLIENTE[c.estado]} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[14px] font-medium text-n-fg">{c.nombre}</span>
                      <span className="shrink-0 text-[11.5px] text-n-faint">{haceCuanto(ultimaInteraccion(c))}</span>
                    </div>
                    <div className="truncate text-[12.5px] text-n-muted">
                      {ultimo ? `${ultimo.autor === "agente" ? "Agente: " : ultimo.autor === "manual" ? "Tú: " : ""}${ultimo.texto}` : "Sin mensajes"}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-n-faint">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: COLOR_ESTADO_CLIENTE[c.estado] }} />
                      {c.autoDeInteres || c.estado}
                      {c.pausado && <span className="ml-auto text-n-warn">Tú</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Chat */}
        <div className={`${enChat ? "flex" : "hidden lg:flex"} min-h-0 min-w-0`}>
          {seleccionado ? (
            <Chat
              cliente={seleccionado}
              onFicha={() => setVerFicha(true)}
              onVolver={() => router.replace("/conversaciones", { scroll: false })}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-10 text-n-faint">Elige una conversación</div>
          )}
        </div>

        {/* Ficha, al lado del chat en pantallas de computador */}
        {seleccionado && (
          <div className="hidden min-h-0 border-l border-n-line xl:flex">
            <Ficha cliente={seleccionado} />
          </div>
        )}
      </div>

      {/* En pantallas de notebook la ficha se abre como panel lateral */}
      {seleccionado && verFicha && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <button aria-label="Cerrar ficha" onClick={() => setVerFicha(false)} className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-y-0 right-0 flex w-[min(360px,100%)] flex-col border-l border-n-line2 bg-n-side shadow-2xl">
            <div className="flex items-center justify-between border-b border-n-line px-5 py-3">
              <span className="text-[14px] font-semibold text-n-fg">Ficha del cliente</span>
              <button onClick={() => setVerFicha(false)} aria-label="Cerrar" className="text-n-faint hover:text-n-fg">
                <Icono nombre="cerrar" className="h-4 w-4" />
              </button>
            </div>
            <Ficha cliente={seleccionado} />
          </div>
        </div>
      )}
    </div>
  );
}

function Chat({ cliente, onFicha, onVolver }: { cliente: Cliente; onFicha: () => void; onVolver: () => void }) {
  const { cambiarPausado, enviarMensaje } = useDatos();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [cambiando, setCambiando] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);
  const mensajes = mensajesDe(cliente);

  useEffect(() => {
    scroll.current?.scrollTo({ top: scroll.current.scrollHeight });
  }, [cliente.id, cliente.conversacion]);

  async function alternarControl() {
    setCambiando(true);
    try {
      await cambiarPausado(cliente.id, !cliente.pausado);
    } catch {
      /* el aviso de error ya se mostró */
    } finally {
      setCambiando(false);
    }
  }

  async function enviar() {
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    if (await enviarMensaje(cliente, t)) setTexto("");
    setEnviando(false);
  }

  let diaAnterior = "";

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex flex-col gap-2.5 border-b border-n-line px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={onVolver} aria-label="Volver a la lista" className="-ml-1 rounded-lg p-1 text-n-muted hover:text-n-fg lg:hidden">
            <Icono nombre="chevronIzq" className="h-5 w-5" />
          </button>
          <Avatar texto={iniciales(cliente.nombre)} color={COLOR_ESTADO_CLIENTE[cliente.estado]} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold text-n-fg">{cliente.nombre}</div>
            <div className="whitespace-nowrap text-[12.5px] tabular-nums text-n-faint">{formatearTelefono(cliente.telefono)}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PillCliente estado={cliente.estado} />
          <div className="ml-auto flex gap-2">
            <button
              onClick={onFicha}
              className="rounded-lg border border-n-line2 px-3 py-1.5 text-[13px] text-n-muted transition hover:text-n-fg xl:hidden"
            >
              Ficha
            </button>
            <button
              onClick={alternarControl}
              disabled={cambiando}
              className={`rounded-lg border px-3.5 py-1.5 text-[13px] font-medium transition disabled:opacity-60 ${
                cliente.pausado
                  ? "border-n-acc/50 bg-n-acc/15 text-n-fg hover:bg-n-acc/25"
                  : "border-n-line2 bg-n-card2 text-n-fg hover:border-n-warn/50"
              }`}
            >
              {cambiando ? "Guardando…" : cliente.pausado ? "Devolver al agente" : "Tomar el control"}
            </button>
          </div>
        </div>
      </header>

      <div ref={scroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
        {mensajes.length === 0 ? (
          <Vacio>Todavía no hay mensajes con este cliente.</Vacio>
        ) : (
          <div className="mx-auto flex max-w-[720px] flex-col gap-2.5">
            {mensajes.map((m, i) => {
              const dia = m.fecha ? new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long" }).format(m.fecha) : "";
              const separador = dia && dia !== diaAnterior;
              if (separador) diaAnterior = dia;
              return (
                <div key={i} className="flex flex-col gap-2.5">
                  {separador && (
                    <div className="my-2 flex items-center gap-3 text-[12px] text-n-faint">
                      <span className="h-px flex-1 bg-n-line" />
                      {dia}
                      <span className="h-px flex-1 bg-n-line" />
                    </div>
                  )}
                  <Burbuja m={m} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="border-t border-n-line p-3">
        {cliente.pausado ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar();
            }}
            className="mx-auto flex max-w-[720px] gap-2"
          >
            <input
              id="mensaje-manual"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={`Escríbele a ${cliente.nombre.split(" ")[0]} desde el número del negocio…`}
              className="min-w-0 flex-1 rounded-lg border border-n-line2 bg-n-bg/60 px-3.5 py-2.5 text-[14px] text-n-fg placeholder:text-n-faint focus:border-n-acc/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={enviando || !texto.trim()}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-n-acc px-4 text-[13.5px] font-medium text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {enviando ? "Enviando…" : "Enviar"}
            </button>
          </form>
        ) : (
          <div className="mx-auto flex max-w-[720px] items-center gap-2 rounded-lg border border-n-line bg-n-bg/50 px-3.5 py-2.5 text-[13px] text-n-muted">
            <Icono nombre="chispa" className="h-4 w-4 text-n-acc2" />
            El agente está atendiendo esta conversación. Toma el control para escribir tú.
          </div>
        )}
      </footer>
    </section>
  );
}

function Burbuja({ m }: { m: Mensaje }) {
  const hora = m.fecha ? new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(m.fecha) : "";
  if (m.autor === "cliente") {
    return (
      <div className="flex flex-col items-start">
        <div className="max-w-[78%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-n-line bg-n-card2 px-3.5 py-2.5 text-[14px] leading-relaxed text-n-fg">
          {m.texto}
        </div>
        <span className="mt-1 flex gap-2 pl-1 text-[11px] text-n-faint">
          {hora}
          {m.fecha && fueraDeHorario(m.fecha) && <span className="text-n-night">fuera de horario</span>}
        </span>
      </div>
    );
  }
  const manual = m.autor === "manual";
  return (
    <div className="flex flex-col items-end">
      <span className={`mb-1 flex items-center gap-1 pr-1 text-[11px] ${manual ? "text-n-warn" : "text-n-acc2"}`}>
        {manual ? "Tú" : (<><Icono nombre="chispa" className="h-3 w-3" /> Agente</>)}
      </span>
      <div
        className={`max-w-[78%] whitespace-pre-wrap rounded-2xl rounded-br-md border px-3.5 py-2.5 text-[14px] leading-relaxed text-n-fg ${
          manual ? "border-n-warn/30 bg-n-warn/10" : "border-n-acc/30 bg-n-acc/[0.14]"
        }`}
      >
        {m.texto}
      </div>
      <span className="mt-1 pr-1 text-[11px] text-n-faint">{hora}</span>
    </div>
  );
}

function Ficha({ cliente }: { cliente: Cliente }) {
  const { cambiarEstadoCliente } = useDatos();
  const ms = mensajesDe(cliente);
  const retiro = cliente.fechaRetiro ? formatoCorto(fechaLocal(cliente.fechaRetiro, cliente.horaRetiro), !!cliente.horaRetiro) : null;

  return (
    <aside className="flex min-h-0 w-full flex-col gap-5 overflow-y-auto p-5">
      <div className="flex items-center gap-3">
        <span
          title="El puntaje de cada cliente llega en una próxima versión del agente."
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-n-line2 text-[18px] font-semibold text-n-faint"
        >
          —
        </span>
        <div>
          <div className="text-[12.5px] text-n-faint">Score de calificación</div>
          <div className="mt-1"><PillCliente estado={cliente.estado} /></div>
        </div>
      </div>

      <div className="rounded-xl border border-n-line bg-n-bg/40 p-3.5 text-[13px] leading-relaxed text-n-faint">
        El resumen automático de cada conversación llega pronto. Por ahora, lo que se sabe está abajo.
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-4 text-[13px]">
        <Dato etiqueta="Auto de interés" valor={cliente.autoDeInteres || "—"} />
        <Dato
          etiqueta="Tarjeta de crédito"
          valor={cliente.tarjetaDeCredito === null ? "—" : cliente.tarjetaDeCredito ? "Sí" : "No"}
        />
        <Dato etiqueta="Primer contacto" valor={cliente.fechaContacto ? formatoCorto(fechaLocal(cliente.fechaContacto), false) : "—"} />
        <Dato etiqueta="Mensajes" valor={String(ms.length)} />
        <Dato etiqueta="Valor estimado" valor={<SinDato motivo="Falta registrar los días y el valor de cada reserva." />} />
        <Dato etiqueta="Origen" valor={<SinDato motivo="Falta que el agente registre de dónde llega cada cliente." />} />
        <div className="col-span-2">
          <Dato etiqueta="Próxima acción" valor={proximaAccion(cliente)} />
        </div>
      </dl>

      <div>
        <div className="mb-2 text-[14px] font-semibold text-n-fg">Reserva</div>
        {retiro ? (
          <div className="rounded-xl border border-n-line bg-n-bg/40 p-3.5">
            <div className="text-[14px] text-n-fg">{retiro}</div>
            <div className="mt-0.5 text-[12.5px] text-n-muted">Retiro · {cliente.autoDeInteres || "auto sin definir"}</div>
          </div>
        ) : (
          <Vacio>Todavía no hay fecha de retiro.</Vacio>
        )}
      </div>

      <label className="flex flex-col gap-1.5 text-[12.5px] text-n-faint">
        Mover a otra etapa
        <select
          id="cambiar-etapa"
          value={cliente.estado}
          onChange={(e) => cambiarEstadoCliente(cliente.id, e.target.value as EstadoCliente).catch(() => {})}
          className="rounded-lg border border-n-line2 bg-n-bg/60 px-3 py-2 text-[13.5px] text-n-fg focus:border-n-acc/60 focus:outline-none"
        >
          {ESTADOS_CLIENTE.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>
      </label>
    </aside>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] text-n-faint">{etiqueta}</dt>
      <dd className="mt-0.5 text-n-fg">{valor}</dd>
    </div>
  );
}
