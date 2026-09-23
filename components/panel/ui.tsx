import type { EstadoAuto, EstadoCliente } from "@/lib/types";

// ── Colores por estado (tema oscuro) ─────────────────────────────────────

export const COLOR_ESTADO_CLIENTE: Record<EstadoCliente, string> = {
  "En conversación": "#4c7eff",
  Calificado: "#7fc1ff",
  "Listo para retirar": "#34d399",
  "Necesita ayuda humana": "#f87171",
  Completado: "#8c97b3",
};

export const ETIQUETA_CORTA_CLIENTE: Record<EstadoCliente, string> = {
  "En conversación": "En conv.",
  Calificado: "Calificado",
  "Listo para retirar": "Listo",
  "Necesita ayuda humana": "Ayuda",
  Completado: "Completado",
};

export const COLOR_ESTADO_AUTO: Record<EstadoAuto, string> = {
  Disponible: "#34d399",
  Arrendado: "#4c7eff",
  "Mantención": "#f5b454",
};

// ── Piezas ───────────────────────────────────────────────────────────────

export function Card({
  children,
  className = "",
  as: Tag = "section",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag
      className={`rounded-2xl border border-n-line bg-n-card/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Titulo({ titulo, bajada, derecha }: { titulo: string; bajada?: string; derecha?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-n-fg">{titulo}</h2>
        {bajada ? <p className="mt-0.5 text-[13px] text-n-muted">{bajada}</p> : null}
      </div>
      {derecha}
    </div>
  );
}

export function Encabezado({ titulo, bajada, children }: { titulo: string; bajada: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[26px] font-semibold tracking-tight text-n-fg">{titulo}</h1>
        <p className="mt-1 text-[14px] text-n-muted">{bajada}</p>
      </div>
      {children}
    </div>
  );
}

export function Pill({ color, children, className = "" }: { color: string; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-[12px] font-medium ${className}`}
      style={{ color, background: `${color}1a`, borderColor: `${color}40` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}

export function PillCliente({ estado, corta = false }: { estado: EstadoCliente; corta?: boolean }) {
  return <Pill color={COLOR_ESTADO_CLIENTE[estado]}>{corta ? ETIQUETA_CORTA_CLIENTE[estado] : estado}</Pill>;
}

export function PillAuto({ estado }: { estado: EstadoAuto }) {
  return <Pill color={COLOR_ESTADO_AUTO[estado]}>{estado}</Pill>;
}

/** Dato que el sistema todavía no registra: se muestra "—", nunca un número inventado. */
export function SinDato({ motivo, className = "" }: { motivo: string; className?: string }) {
  return (
    <span title={motivo} className={`cursor-help text-n-faint ${className}`}>
      —
    </span>
  );
}

export function Proximamente({ children = "Próximamente" }: { children?: React.ReactNode }) {
  return (
    <span className="rounded-md border border-n-line2 px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-n-faint">
      {children}
    </span>
  );
}

export function Delta({ valor }: { valor: number | null }) {
  if (valor === null || !Number.isFinite(valor)) return null;
  const sube = valor >= 0;
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-n-faint">
      <span className={sube ? "text-n-ok" : "text-n-bad"}>
        {sube ? "↗" : "↘"} {sube ? "+" : ""}
        {new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(valor)}%
      </span>
      vs. anterior
    </span>
  );
}

export function Avatar({ texto, color = "#4c7eff" }: { texto: string; color?: string }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold"
      style={{ color, background: `${color}14`, borderColor: `${color}33` }}
    >
      {texto}
    </span>
  );
}

export function Vacio({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-n-line2 px-4 py-8 text-center text-[13px] text-n-faint">
      {children}
    </div>
  );
}

// ── Íconos (trazo 1.6, heredan currentColor) ─────────────────────────────

type IconoNombre =
  | "panel"
  | "clientes"
  | "pipeline"
  | "chat"
  | "agenda"
  | "auto"
  | "agente"
  | "integracion"
  | "config"
  | "buscar"
  | "presentacion"
  | "salir"
  | "cerrar"
  | "enviar"
  | "chevronIzq"
  | "chevronDer"
  | "exportar"
  | "chispa";

const PATHS: Record<IconoNombre, React.ReactNode> = {
  panel: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  clientes: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5" />
      <path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.5 3.5 5.2" />
    </>
  ),
  pipeline: (
    <>
      <rect x="3.5" y="4" width="5" height="16" rx="1.5" />
      <rect x="9.5" y="4" width="5" height="11" rx="1.5" />
      <rect x="15.5" y="4" width="5" height="7" rx="1.5" />
    </>
  ),
  chat: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z" />,
  agenda: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  auto: (
    <>
      <path d="M4 16.5V12l2-5h12l2 5v4.5a1 1 0 0 1-1 1h-1.5M5.5 17.5H5a1 1 0 0 1-1-1" />
      <path d="M4 12h16M9.5 17.5h5" />
      <circle cx="7.5" cy="17" r="1.8" />
      <circle cx="16.5" cy="17" r="1.8" />
    </>
  ),
  agente: <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM18.5 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />,
  integracion: <path d="M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 0 1-11 0zM12 16.5V21" />,
  config: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.4M12 18.8v2.4M4.2 7.5l2.1 1.2M17.7 15.3l2.1 1.2M4.2 16.5l2.1-1.2M17.7 8.7l2.1-1.2" />
    </>
  ),
  buscar: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  presentacion: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M12 16v4M8 20h8" />
    </>
  ),
  salir: <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 8l-4 4 4 4M6 12h10" />,
  cerrar: <path d="M6 6l12 12M18 6L6 18" />,
  enviar: <path d="M12 19V5M6 11l6-6 6 6" />,
  chevronIzq: <path d="M15 5l-7 7 7 7" />,
  chevronDer: <path d="M9 5l7 7-7 7" />,
  exportar: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  chispa: <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />,
};

export function Icono({ nombre, className = "h-[18px] w-[18px]" }: { nombre: IconoNombre; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[nombre]}
    </svg>
  );
}
