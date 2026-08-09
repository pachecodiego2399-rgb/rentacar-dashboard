import type { Auto } from "@/lib/types";
import { ESTADO_STYLES } from "@/lib/estado";
import { formatearPrecio, formatearFecha } from "@/lib/format";
import EstadoBadge from "./EstadoBadge";

export default function CarCard({ auto }: { auto: Auto }) {
  const style = ESTADO_STYLES[auto.estado];
  const fecha = formatearFecha(auto.fechaDevolucion);

  return (
    <article
      className={`rounded-lg border border-l-4 border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md ${style.border}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 break-words font-display text-lg font-bold uppercase tracking-wide text-stone-900">
          {auto.nombre}
        </h3>
        <span className="shrink-0 rounded bg-stone-100 px-2 py-0.5 font-mono text-xs text-stone-600">
          {auto.patente}
        </span>
      </div>

      <div className="mt-2">
        <EstadoBadge estado={auto.estado} size="sm" />
      </div>

      <p className="mt-3 text-lg font-semibold text-stone-900">
        {formatearPrecio(auto.precioPorDia)}
        <span className="ml-1 text-xs font-normal text-stone-400">/ día</span>
      </p>

      {auto.requisitos && (
        <p className="mt-2 text-sm text-stone-500">{auto.requisitos}</p>
      )}

      {fecha && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-500">
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          Devolución: <span className="font-medium text-stone-700">{fecha}</span>
        </p>
      )}
    </article>
  );
}
