"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Auto, Cliente, EstadoAuto, EstadoCliente } from "@/lib/types";
import type { Periodo } from "@/lib/metricas";

const POLL_MS = 20_000;

interface Datos {
  clientes: Cliente[];
  autos: Auto[];
  cargando: boolean;
  error: string | null;
  periodo: Periodo;
  setPeriodo: (p: Periodo) => void;
  presentacion: boolean;
  setPresentacion: (v: boolean) => void;
  aviso: { texto: string; tipo: "ok" | "error" } | null;
  avisar: (texto: string, tipo?: "ok" | "error") => void;
  recargar: () => Promise<void>;
  cambiarEstadoCliente: (id: string, estado: EstadoCliente) => Promise<void>;
  cambiarPausado: (id: string, pausado: boolean) => Promise<void>;
  enviarMensaje: (cliente: Cliente, texto: string) => Promise<boolean>;
  cambiarEstadoAuto: (id: string, estado: EstadoAuto, fechaDevolucion: string | null) => Promise<void>;
}

const Ctx = createContext<Datos | null>(null);

export function useDatos(): Datos {
  const d = useContext(Ctx);
  if (!d) throw new Error("useDatos debe usarse dentro de <DatosProvider>");
  return d;
}

async function pedir<T>(url: string, init?: RequestInit): Promise<T> {
  // Un reintento silencioso: la primera llamada del día puede caer en una
  // función de Vercel "fría".
  for (let intento = 0; ; intento++) {
    try {
      const res = await fetch(url, { cache: "no-store", ...init });
      if (res.status === 401) {
        // Sesión vencida o cerrada en otro lado: de vuelta al login.
        window.location.href = `/login?volver=${encodeURIComponent(location.pathname + location.search)}`;
        throw new Error("Sesión expirada");
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Error ${res.status}`);
      return body as T;
    } catch (e) {
      if (intento >= 1 || (e instanceof Error && e.message === "Sesión expirada")) throw e;
      await new Promise((r) => setTimeout(r, 700));
    }
  }
}

export default function DatosProvider({ children }: { children: React.ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [autos, setAutos] = useState<Auto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodoState] = useState<Periodo>("30d");
  const [presentacion, setPresentacion] = useState(false);
  const [aviso, setAviso] = useState<Datos["aviso"]>(null);
  // Mientras hay un cambio en vuelo, el poll de fondo no debe pisar el
  // estado optimista con una lectura que arrancó antes de guardarse.
  const enVuelo = useRef(0);

  useEffect(() => {
    try {
      const p = localStorage.getItem("panel-periodo") as Periodo | null;
      if (p) setPeriodoState(p);
    } catch {}
  }, []);

  const setPeriodo = useCallback((p: Periodo) => {
    setPeriodoState(p);
    try {
      localStorage.setItem("panel-periodo", p);
    } catch {}
  }, []);

  const avisar = useCallback((texto: string, tipo: "ok" | "error" = "ok") => {
    setAviso({ texto, tipo });
    setTimeout(() => setAviso((a) => (a?.texto === texto ? null : a)), 4500);
  }, []);

  const recargar = useCallback(async () => {
    try {
      const [rc, ra] = await Promise.all([
        pedir<{ clientes: Cliente[] }>("/api/clientes"),
        pedir<{ autos: Auto[] }>("/api/autos"),
      ]);
      if (enVuelo.current === 0) {
        setClientes(rc.clientes);
        setAutos(ra.autos);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los datos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
    const t = setInterval(recargar, POLL_MS);
    return () => clearInterval(t);
  }, [recargar]);

  const patchCliente = useCallback(
    async (id: string, cambio: Partial<Cliente>, body: object, textoError: string) => {
      enVuelo.current++;
      const antes = clientes;
      setClientes((cs) => cs.map((c) => (c.id === id ? { ...c, ...cambio } : c)));
      try {
        await pedir(`/api/clientes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch (e) {
        setClientes(antes);
        avisar(`${textoError}: ${e instanceof Error ? e.message : e}`, "error");
        throw e;
      } finally {
        enVuelo.current--;
      }
    },
    [clientes, avisar]
  );

  const cambiarEstadoCliente = useCallback(
    async (id: string, estado: EstadoCliente) => {
      await patchCliente(id, { estado }, { estado }, "No se pudo cambiar la etapa");
      avisar(`Movido a "${estado}"`);
      recargar();
    },
    [patchCliente, avisar, recargar]
  );

  const cambiarPausado = useCallback(
    async (id: string, pausado: boolean) => {
      await patchCliente(id, { pausado }, { pausado }, "No se pudo cambiar el control");
      avisar(pausado ? "Tomaste el control: el agente no responderá" : "El agente vuelve a atender");
    },
    [patchCliente, avisar]
  );

  const enviarMensaje = useCallback(
    async (cliente: Cliente, texto: string) => {
      try {
        await pedir("/api/pausa-manual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telefono: cliente.telefono, mensaje: texto }),
        });
        avisar("Mensaje enviado");
        await recargar();
        return true;
      } catch (e) {
        avisar(`No se pudo enviar: ${e instanceof Error ? e.message : e}`, "error");
        return false;
      }
    },
    [avisar, recargar]
  );

  const cambiarEstadoAuto = useCallback(
    async (id: string, estado: EstadoAuto, fechaDevolucion: string | null) => {
      enVuelo.current++;
      const antes = autos;
      setAutos((as) =>
        as.map((a) => (a.id === id ? { ...a, estado, fechaDevolucion: estado === "Arrendado" ? fechaDevolucion : null } : a))
      );
      try {
        await pedir(`/api/autos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado, fechaDevolucion }),
        });
        avisar(`Auto marcado como ${estado}`);
      } catch (e) {
        setAutos(antes);
        avisar(`No se pudo actualizar el auto: ${e instanceof Error ? e.message : e}`, "error");
      } finally {
        enVuelo.current--;
      }
    },
    [autos, avisar]
  );

  return (
    <Ctx.Provider
      value={{
        clientes,
        autos,
        cargando,
        error,
        periodo,
        setPeriodo,
        presentacion,
        setPresentacion,
        aviso,
        avisar,
        recargar,
        cambiarEstadoCliente,
        cambiarPausado,
        enviarMensaje,
        cambiarEstadoAuto,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
