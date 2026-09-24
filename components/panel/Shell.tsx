"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { clientConfig } from "@/config/client";
import { PERIODOS, iniciales, mensajesAgenteUltimas24h } from "@/lib/metricas";
import { useDatos } from "./DatosProvider";
import { Icono, Proximamente } from "./ui";

const NAV = [
  { href: "/", label: "Panel", icono: "panel" },
  { href: "/clientes", label: "Clientes", icono: "clientes" },
  { href: "/pipeline", label: "Pipeline", icono: "pipeline" },
  { href: "/conversaciones", label: "Conversaciones", icono: "chat" },
  { href: "/agenda", label: "Agenda", icono: "agenda" },
  { href: "/flota", label: "Flota", icono: "auto" },
] as const;

const SISTEMA = [
  { label: "Agente", icono: "agente" },
  { label: "Integración", icono: "integracion" },
  { label: "Configuración", icono: "config" },
] as const;

export default function Shell({ children }: { children: React.ReactNode }) {
  const { presentacion, setPresentacion, aviso, error, clientes } = useDatos();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMenuAbierto(false), [pathname]);

  return (
    <div className="min-h-screen bg-n-bg font-sans text-n-fg">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px]"
        style={{ background: "radial-gradient(900px 380px at 60% -120px, rgba(76,126,255,0.10), transparent 70%)" }}
      />

      {!presentacion && (
        <>
          <aside
            className={`fixed inset-y-0 left-0 z-40 w-[248px] border-r border-n-line bg-n-side transition-transform lg:translate-x-0 ${
              menuAbierto ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar />
          </aside>
          {menuAbierto && (
            <button
              aria-label="Cerrar menú"
              onClick={() => setMenuAbierto(false)}
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            />
          )}
        </>
      )}

      <div className={`relative ${presentacion ? "" : "lg:pl-[248px]"}`}>
        <Topbar onMenu={() => setMenuAbierto(true)} />
        <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          {error && clientes.length === 0 ? (
            <div className="mb-6 rounded-xl border border-n-bad/40 bg-n-bad/10 px-4 py-3 text-[13px] text-n-bad">
              No se pudieron cargar los datos: {error}
            </div>
          ) : null}
          {children}
        </main>
      </div>

      {presentacion && (
        <button
          onClick={() => setPresentacion(false)}
          className="fixed bottom-5 right-5 z-50 rounded-full border border-n-line2 bg-n-card px-4 py-2 text-[13px] text-n-muted shadow-lg hover:text-n-fg"
        >
          Salir de presentación
        </button>
      )}

      {aviso && (
        <div
          role="status"
          className={`fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+68px)] z-50 w-max max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-xl border px-4 py-2.5 text-center text-[13px] font-medium shadow-2xl ${
            aviso.tipo === "error"
              ? "border-n-bad/40 bg-[#2a1216] text-n-bad"
              : "border-n-ok/30 bg-[#0e2320] text-n-ok"
          }`}
        >
          {aviso.texto}
        </div>
      )}
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const { clientes } = useDatos();
  const [preguntaAbierta, setPreguntaAbierta] = useState(false);

  const ayuda = clientes.filter((c) => c.estado === "Necesita ayuda humana").length;
  const pausados = clientes.filter((c) => c.pausado).length;
  const mensajes24h = useMemo(() => mensajesAgenteUltimas24h(clientes), [clientes]);

  const badge = (href: string) =>
    href === "/clientes" ? ayuda : href === "/conversaciones" ? pausados : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-5">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="font-display text-[17px] font-semibold text-n-fg">{clientConfig.shortName}</span>
          <span className="text-[14px] text-n-muted">{clientConfig.businessType}</span>
        </Link>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {NAV.map((item) => {
          const activo = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const n = badge(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition ${
                activo ? "bg-n-hover text-n-fg" : "text-n-muted hover:bg-n-card hover:text-n-fg"
              }`}
            >
              <Icono nombre={item.icono} />
              <span className="flex-1">{item.label}</span>
              {n > 0 && (
                <span
                  className={`min-w-[20px] rounded-full px-1.5 text-center text-[11px] font-semibold ${
                    item.href === "/clientes" ? "bg-n-bad/20 text-n-bad" : "bg-n-acc/20 text-n-acc2"
                  }`}
                >
                  {n}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 px-6 text-[11px] font-medium uppercase tracking-[0.08em] text-n-faint">Sistema</div>
      <nav className="mt-2 flex flex-col gap-0.5 px-3">
        {SISTEMA.map((item) => (
          <div
            key={item.label}
            title="Disponible próximamente"
            className="flex cursor-default items-center gap-3 rounded-lg px-3 py-2 text-[14px] text-n-faint"
          >
            <Icono nombre={item.icono} />
            <span className="flex-1">{item.label}</span>
            <Proximamente>Pronto</Proximamente>
          </div>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-n-line p-4">
        <div className="rounded-xl border border-n-line bg-n-card px-3 py-2.5">
          <div className="flex items-center gap-2 text-[13px] font-medium text-n-fg">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-n-ok opacity-50 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-n-ok" />
            </span>
            Agente activo
          </div>
          <div className="mt-0.5 pl-4 text-[12px] text-n-muted">
            {mensajes24h} {mensajes24h === 1 ? "respuesta" : "respuestas"} en 24 h
          </div>
        </div>

        <div className="flex items-center gap-3 px-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-n-line2 text-[12px] font-semibold text-n-acc2">
            {iniciales(clientConfig.ownerName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-n-fg">{clientConfig.ownerName}</div>
            <div className="text-[12px] text-n-faint">{clientConfig.ownerRole}</div>
          </div>
          <button
            onClick={async () => {
              await fetch("/api/logout", { method: "POST" }).catch(() => {});
              window.location.href = "/login";
            }}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="rounded-lg p-1.5 text-n-faint transition hover:bg-n-card hover:text-n-fg"
          >
            <Icono nombre="salir" className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setPreguntaAbierta((v) => !v)}
            className="flex w-full items-center gap-2 rounded-full border border-n-acc/40 bg-n-acc/10 px-4 py-2.5 text-[13.5px] font-medium text-n-fg transition hover:bg-n-acc/20"
          >
            <Icono nombre="chispa" className="h-4 w-4 text-n-acc2" />
            Pregúntale al agente
          </button>
          {preguntaAbierta && <PreguntaAgente onCerrar={() => setPreguntaAbierta(false)} />}
        </div>
      </div>
    </div>
  );
}

const PREGUNTAS = [
  "¿Cuántos retiros tengo hoy?",
  "¿Qué requiere mi atención?",
  "¿Qué auto piden más?",
  "¿Cuántos escribieron fuera de horario?",
];

function PreguntaAgente({ onCerrar }: { onCerrar: () => void }) {
  return (
    <div className="absolute bottom-[calc(100%+10px)] left-0 z-50 w-[320px] rounded-2xl border border-n-line2 bg-n-card p-4 shadow-2xl">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-[14px] font-semibold text-n-fg">
            <Icono nombre="chispa" className="h-4 w-4 text-n-acc2" /> Pregúntale al agente
          </div>
          <p className="mt-1 text-[12.5px] text-n-muted">
            Muy pronto vas a poder preguntarle al agente sobre tus reservas, tu flota y tus clientes, con datos en vivo.
          </p>
        </div>
        <button onClick={onCerrar} aria-label="Cerrar" className="text-n-faint hover:text-n-fg">
          <Icono nombre="cerrar" className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {PREGUNTAS.map((p) => (
          <span key={p} className="rounded-full border border-n-line2 px-2.5 py-1 text-[12px] text-n-faint">
            {p}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-full border border-n-line bg-n-bg px-3 py-2 text-[12.5px] text-n-faint">
        Disponible próximamente <span className="ml-auto"><Proximamente>Pronto</Proximamente></span>
      </div>
    </div>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { periodo, setPeriodo, presentacion, setPresentacion } = useDatos();
  const router = useRouter();
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-n-line bg-n-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {!presentacion && (
          <button onClick={onMenu} aria-label="Abrir menú" className="rounded-lg p-1.5 text-n-muted hover:text-n-fg lg:hidden">
            <Icono nombre="panel" />
          </button>
        )}

        {presentacion ? (
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[17px] font-semibold">{clientConfig.shortName}</span>
            <span className="text-[14px] text-n-muted">{clientConfig.businessType}</span>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(q.trim() ? `/clientes?q=${encodeURIComponent(q.trim())}` : "/clientes");
            }}
            className="flex w-full max-w-[340px] items-center gap-2 rounded-lg border border-n-line bg-n-card/70 px-3 py-2 text-n-faint focus-within:border-n-acc/60"
          >
            <Icono nombre="buscar" className="h-4 w-4 shrink-0" />
            <input
              id="buscar-global"
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Busca un cliente, teléfono o auto"
              className="w-full bg-transparent text-[13.5px] text-n-fg placeholder:text-n-faint focus:outline-none"
            />
            <kbd className="hidden rounded border border-n-line2 px-1.5 text-[10.5px] text-n-faint sm:inline">⌘K</kbd>
          </form>
        )}

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center rounded-lg border border-n-line bg-n-card/70 p-0.5 sm:flex">
            {PERIODOS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodo(p.id)}
                className={`rounded-md px-3 py-1.5 text-[13px] transition ${
                  periodo === p.id ? "bg-n-hover text-n-fg" : "text-n-muted hover:text-n-fg"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPresentacion(!presentacion)}
            className="flex items-center gap-2 rounded-lg border border-n-line bg-n-card/70 px-3 py-1.5 text-[13px] text-n-muted transition hover:text-n-fg"
          >
            <Icono nombre="presentacion" className="h-4 w-4" />
            <span className="hidden md:inline">Presentación</span>
          </button>
        </div>
      </div>
    </header>
  );
}
