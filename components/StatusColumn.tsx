import type { Auto, EstadoAuto } from "@/lib/types";
import CarCard from "./CarCard";
import EstadoBadge from "./EstadoBadge";

export default function StatusColumn({
  estado,
  autos,
  onEstadoChange,
}: {
  estado: EstadoAuto;
  autos: Auto[];
  onEstadoChange: (id: string, nuevoEstado: EstadoAuto) => void;
}) {
  return (
    <section className="flex min-w-0 flex-col rounded-xl bg-stone-200/50 p-3">
      <header className="mb-3 px-1">
        <EstadoBadge estado={estado} size="lg" count={autos.length} />
      </header>

      {autos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone-300 p-4 text-center text-sm text-stone-400">
          Sin autos en este estado
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {autos.map((auto) => (
            <CarCard key={auto.id} auto={auto} onEstadoChange={onEstadoChange} />
          ))}
        </div>
      )}
    </section>
  );
}
