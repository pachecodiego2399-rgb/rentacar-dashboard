import type { ResumenClientes } from "@/lib/types";

interface StatDef {
  label: string;
  value: number;
  dotClass: string;
}

export default function ClientesSummaryBar({ resumen }: { resumen: ResumenClientes }) {
  const stats: StatDef[] = [
    { label: "Total de clientes", value: resumen.total, dotClass: "bg-stone-400" },
    { label: "Calificados", value: resumen.calificados, dotClass: "bg-brand-primary" },
    {
      label: "Listos para retirar",
      value: resumen.listosParaRetirar,
      dotClass: "bg-brand-forest",
    },
    {
      label: "Necesitan ayuda humana",
      value: resumen.necesitaAyudaHumana,
      dotClass: "bg-red-600",
    },
    { label: "Completados", value: resumen.completados, dotClass: "bg-emerald-700" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${stat.dotClass}`} />
            <span className="font-display text-xs font-semibold uppercase tracking-wide text-stone-500">
              {stat.label}
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-stone-900 sm:text-3xl">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
