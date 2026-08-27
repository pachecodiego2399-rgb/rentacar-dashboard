import type { Cliente, EstadoCliente } from "@/lib/types";
import ClienteCard from "./ClienteCard";
import EstadoClienteBadge from "./EstadoClienteBadge";

export default function ClienteStatusColumn({
  estado,
  clientes,
}: {
  estado: EstadoCliente;
  clientes: Cliente[];
}) {
  return (
    <section className="flex min-w-0 flex-col rounded-xl bg-stone-200/50 p-3">
      <header className="mb-3 px-1">
        <EstadoClienteBadge estado={estado} size="lg" count={clientes.length} />
      </header>

      {clientes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone-300 p-4 text-center text-sm text-stone-400">
          Sin clientes en este estado
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {clientes.map((cliente) => (
            <ClienteCard key={cliente.id} cliente={cliente} />
          ))}
        </div>
      )}
    </section>
  );
}
