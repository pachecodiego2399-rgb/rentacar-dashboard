"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Auto, AutosResponse, EstadoAuto } from "@/lib/types";
import { ESTADOS } from "@/lib/estado";
import SummaryBar from "./SummaryBar";
import StatusColumn from "./StatusColumn";

const POLL_INTERVAL_MS = 20_000;

type Estado = "cargando" | "listo" | "error";

export default function Dashboard() {
  const [data, setData] = useState<AutosResponse | null>(null);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isFirstLoad = useRef(true);

  const cargarAutos = useCallback(async () => {
    try {
      const res = await fetch("/api/autos", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Error al cargar los autos.");
      setData(body as AutosResponse);
      setEstado("listo");
      setErrorMsg(null);
    } catch (err) {
      setEstado("error");
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      isFirstLoad.current = false;
    }
  }, []);

  useEffect(() => {
    cargarAutos();
    const interval = setInterval(cargarAutos, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [cargarAutos]);

  if (estado === "cargando" && isFirstLoad.current) {
    return <DashboardSkeleton />;
  }

  if (estado === "error" && !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="font-medium text-rose-700">No se pudieron cargar los autos</p>
        <p className="mt-1 text-sm text-rose-600">{errorMsg}</p>
        <button
          onClick={cargarAutos}
          className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  const autosPorEstado: Record<EstadoAuto, Auto[]> = {
    Disponible: [],
    Arrendado: [],
    "Mantención": [],
  };
  for (const auto of data.autos) {
    autosPorEstado[auto.estado].push(auto);
  }

  return (
    <div className="flex flex-col gap-6">
      <SummaryBar resumen={data.resumen} />

      {estado === "error" && (
        <p className="text-sm text-amber-600">
          No se pudo actualizar ({errorMsg}) — mostrando los últimos datos disponibles.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {ESTADOS.map((e) => (
          <StatusColumn key={e} estado={e} autos={autosPorEstado[e]} />
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-stone-200/70" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-stone-200/70" />
        ))}
      </div>
    </div>
  );
}
