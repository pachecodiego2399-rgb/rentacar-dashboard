"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDatos } from "@/components/panel/DatosProvider";
import { COLOR_ESTADO_CLIENTE, Encabezado, Icono } from "@/components/panel/ui";
import { ESTADOS_CLIENTE } from "@/lib/estado-cliente";
import { fechaLocal, formatoCorto, haceCuanto, ultimaInteraccion } from "@/lib/metricas";
import type { Cliente, EstadoCliente } from "@/lib/types";

export default function PipelinePage() {
  const { clientes, cambiarEstadoCliente, cargando } = useDatos();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [auto, setAuto] = useState("");
  const [arrastrando, setArrastrando] = useState<Cliente | null>(null);
  // El arrastre empieza recién al mover 6px: un clic sigue abriendo la conversación.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const autosPedidos = useMemo(() => [...new Set(clientes.map((c) => c.autoDeInteres.trim()).filter(Boolean))].sort(), [clientes]);

  const visibles = clientes
    .filter((c) => !q || c.nombre.toLowerCase().includes(q.toLowerCase()))
    .filter((c) => !auto || c.autoDeInteres.trim() === auto);

  function alSoltar(e: DragEndEvent) {
    setArrastrando(null);
    const destino = e.over?.id as EstadoCliente | undefined;
    const c = clientes.find((x) => x.id === e.active.id);
    if (!c || !destino || c.estado === destino) return;
    cambiarEstadoCliente(c.id, destino).catch(() => {});
  }

  return (
    <div className="flex flex-col gap-5">
      <Encabezado
        titulo="Pipeline"
        bajada='Arrastra una tarjeta para cambiar de etapa. Si la sueltas en "Listo para retirar" o "Necesita ayuda humana", te llega el aviso igual que si lo hiciera el agente.'
      />

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-w-[220px] items-center gap-2 rounded-lg border border-n-line bg-n-card/70 px-3 py-2 text-n-faint focus-within:border-n-acc/60">
          <Icono nombre="buscar" className="h-4 w-4" />
          <input
            id="buscar-pipeline"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Busca un cliente"
            className="w-full bg-transparent text-[13.5px] text-n-fg placeholder:text-n-faint focus:outline-none"
          />
        </label>
        <select
          id="pipeline-auto"
          value={auto}
          onChange={(e) => setAuto(e.target.value)}
          className="rounded-lg border border-n-line bg-n-card/70 px-3 py-2 text-[13px] text-n-muted focus:outline-none"
        >
          <option value="">Auto: todos</option>
          {autosPedidos.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-4 text-[12.5px] text-n-faint">
          <span className="flex items-center gap-1.5"><Icono nombre="chispa" className="h-3.5 w-3.5 text-n-acc2" /> Atiende el agente</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-n-warn" /> Lo atiendes tú</span>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(e) => setArrastrando(clientes.find((c) => c.id === e.active.id) ?? null)}
        onDragEnd={alSoltar}
        onDragCancel={() => setArrastrando(null)}
      >
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="grid min-w-[1180px] grid-cols-5 gap-3">
            {ESTADOS_CLIENTE.map((estado) => (
              <Columna
                key={estado}
                estado={estado}
                clientes={visibles.filter((c) => c.estado === estado)}
                cargando={cargando}
                onAbrir={(c) => router.push(`/conversaciones?c=${c.id}`)}
              />
            ))}
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {arrastrando ? <Tarjeta cliente={arrastrando} flotando /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Columna({
  estado,
  clientes,
  cargando,
  onAbrir,
}: {
  estado: EstadoCliente;
  clientes: Cliente[];
  cargando: boolean;
  onAbrir: (c: Cliente) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: estado });
  const color = COLOR_ESTADO_CLIENTE[estado];
  const ordenados = [...clientes].sort((a, b) => (ultimaInteraccion(b)?.getTime() ?? 0) - (ultimaInteraccion(a)?.getTime() ?? 0));

  return (
    <section className="flex min-w-0 flex-col">
      <header className="mb-2.5 flex items-center justify-between px-1">
        <span className="flex items-center gap-2 text-[14px] font-medium text-n-fg">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
          {estado}
          <span className="text-n-faint">{clientes.length}</span>
        </span>
      </header>
      <div
        ref={setNodeRef}
        className={`flex min-h-[420px] flex-1 flex-col gap-2.5 rounded-2xl border p-2 transition ${
          isOver ? "border-n-acc/60 bg-n-acc/[0.07]" : "border-n-line bg-n-card/30"
        }`}
      >
        {cargando
          ? Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-n-card" />)
          : ordenados.map((c) => <Arrastrable key={c.id} cliente={c} onAbrir={onAbrir} />)}
        {!cargando && clientes.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-n-line px-3 text-center text-[12.5px] text-n-faint">
            Suelta aquí para mover a {estado.toLowerCase()}
          </div>
        )}
      </div>
    </section>
  );
}

function Arrastrable({ cliente, onAbrir }: { cliente: Cliente; onAbrir: (c: Cliente) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: cliente.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onAbrir(cliente)}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? "opacity-30" : ""}`}
    >
      <Tarjeta cliente={cliente} />
    </div>
  );
}

function Tarjeta({ cliente, flotando = false }: { cliente: Cliente; flotando?: boolean }) {
  const color = COLOR_ESTADO_CLIENTE[cliente.estado];
  return (
    <article
      className={`relative overflow-hidden rounded-xl border bg-n-card p-3.5 transition ${
        flotando ? "rotate-[1.5deg] border-n-acc/60 shadow-2xl shadow-black/60" : "border-n-line hover:border-n-line2 hover:bg-n-card2"
      }`}
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: color }} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[14px] font-medium text-n-fg">{cliente.nombre}</div>
          <div className="truncate text-[12.5px] text-n-muted">{cliente.autoDeInteres || "Sin auto de interés"}</div>
        </div>
        <span
          title="El puntaje de cada cliente llega en una próxima versión del agente."
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-n-line2 text-[11px] text-n-faint"
        >
          —
        </span>
      </div>
      {cliente.fechaRetiro && (
        <div className="mt-2 text-[12.5px] text-n-muted">
          Retiro: {formatoCorto(fechaLocal(cliente.fechaRetiro, cliente.horaRetiro), !!cliente.horaRetiro)}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-n-line pt-2.5 text-[12px]">
        {cliente.pausado ? (
          <span className="flex items-center gap-1.5 text-n-warn"><span className="h-1.5 w-1.5 rounded-full bg-n-warn" /> Tú</span>
        ) : (
          <span className="flex items-center gap-1.5 text-n-acc2"><Icono nombre="chispa" className="h-3.5 w-3.5" /> Agente</span>
        )}
        <span className="text-n-faint">{haceCuanto(ultimaInteraccion(cliente))}</span>
      </div>
    </article>
  );
}
