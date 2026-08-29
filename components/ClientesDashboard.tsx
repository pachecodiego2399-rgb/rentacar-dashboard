"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Cliente, ClientesResponse, EstadoCliente } from "@/lib/types";
import { ESTADOS_CLIENTE } from "@/lib/estado-cliente";
import ClientesSummaryBar from "./ClientesSummaryBar";
import ClienteStatusColumn from "./ClienteStatusColumn";
import ConversacionCliente from "./ConversacionCliente";

const POLL_INTERVAL_MS = 20_000;

type Estado = "cargando" | "listo" | "error";

export default function ClientesDashboard() {
  const [data, setData] = useState<ClientesResponse | null>(null);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detailClienteId, setDetailClienteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const isFirstLoad = useRef(true);
  // Mientras hay un PATCH de Pausado (o un envío de mensaje manual) en
  // vuelo, el poll de fondo no debe pisar el estado optimista con una
  // lectura que puede haber arrancado justo antes de que el PATCH
  // terminara de guardarse en Airtable — mismo patrón que usa el drag and
  // drop en el dashboard demo para no revertir visualmente una acción que
  // en realidad ya se guardó bien.
  const suppressPollRef = useRef(false);

  function mostrarToast(message: string) {
    setToast(message);
    setTimeout(() => setToast((current) => (current === message ? null : current)), 5000);
  }

  const cargarClientes = useCallback(async () => {
    // Mismo patrón de reintento único que el dashboard de Autos: la
    // primera carga del día puede pegarle a una función de Vercel "fría".
    for (let intento = 0; intento < 2; intento++) {
      try {
        const res = await fetch("/api/clientes", { cache: "no-store" });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Error al cargar los clientes.");
        if (!suppressPollRef.current) setData(body as ClientesResponse);
        setEstado("listo");
        setErrorMsg(null);
        isFirstLoad.current = false;
        return;
      } catch (err) {
        if (intento === 0) {
          await new Promise((resolve) => setTimeout(resolve, 700));
          continue;
        }
        setEstado("error");
        setErrorMsg(err instanceof Error ? err.message : "Error desconocido.");
      }
    }
    isFirstLoad.current = false;
  }, []);

  useEffect(() => {
    cargarClientes();
    const interval = setInterval(cargarClientes, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [cargarClientes]);

  if (estado === "cargando" && isFirstLoad.current) {
    return <ClientesDashboardSkeleton />;
  }

  if (estado === "error" && !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="font-medium text-rose-700">No se pudieron cargar los clientes</p>
        <p className="mt-1 text-sm text-rose-600">{errorMsg}</p>
        <button
          onClick={cargarClientes}
          className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  async function handleTogglePausado(id: string, nuevoPausado: boolean) {
    suppressPollRef.current = true;
    const previous = data;
    setData((current) =>
      current
        ? {
            ...current,
            clientes: current.clientes.map((c) =>
              c.id === id ? { ...c, pausado: nuevoPausado } : c
            ),
          }
        : current
    );
    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pausado: nuevoPausado }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Error al actualizar el estado de pausa");
    } catch (err) {
      setData(previous);
      mostrarToast(
        `No se pudo actualizar el estado de pausa: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      suppressPollRef.current = false;
    }
  }

  async function handleMessageSent(id: string) {
    suppressPollRef.current = true;
    setData((current) =>
      current
        ? {
            ...current,
            clientes: current.clientes.map((c) => (c.id === id ? { ...c, pausado: true } : c)),
          }
        : current
    );
    suppressPollRef.current = false;
    await cargarClientes();
  }

  const clientesPorEstado: Record<EstadoCliente, Cliente[]> = {
    "En conversación": [],
    Calificado: [],
    "Listo para retirar": [],
    "Necesita ayuda humana": [],
    Completado: [],
  };
  for (const cliente of data.clientes) {
    clientesPorEstado[cliente.estado].push(cliente);
  }

  const detailCliente = detailClienteId
    ? data.clientes.find((c) => c.id === detailClienteId) ?? null
    : null;

  return (
    <div className="flex flex-col gap-6">
      <ClientesSummaryBar resumen={data.resumen} />

      {estado === "error" && (
        <p className="text-sm text-amber-600">
          No se pudo actualizar ({errorMsg}) — mostrando los últimos datos disponibles.
        </p>
      )}

      {toast && (
        <div className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {ESTADOS_CLIENTE.map((e) => (
          <ClienteStatusColumn
            key={e}
            estado={e}
            clientes={clientesPorEstado[e]}
            onOpenCliente={(cliente) => setDetailClienteId(cliente.id)}
          />
        ))}
      </div>

      {detailCliente ? (
        <ConversacionCliente
          cliente={detailCliente}
          onClose={() => setDetailClienteId(null)}
          onTogglePausado={handleTogglePausado}
          onMessageSent={handleMessageSent}
          onShowError={mostrarToast}
        />
      ) : null}
    </div>
  );
}

function ClientesDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-stone-200/70" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-stone-200/70" />
        ))}
      </div>
    </div>
  );
}
