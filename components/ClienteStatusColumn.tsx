"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { Cliente, EstadoCliente } from "@/lib/types";
import ClienteCard from "./ClienteCard";
import EstadoClienteBadge from "./EstadoClienteBadge";

export default function ClienteStatusColumn({
  estado,
  clientes,
  onOpenCliente,
  onCambiarEstado,
}: {
  estado: EstadoCliente;
  clientes: Cliente[];
  onOpenCliente?: (cliente: Cliente) => void;
  onCambiarEstado?: (id: string, nuevoEstado: EstadoCliente) => Promise<void>;
}) {
  // Cada columna es una zona donde se puede soltar una tarjeta: el id del
  // droppable es el Estado, así onDragEnd sabe a qué estado mover al cliente.
  const { setNodeRef, isOver } = useDroppable({ id: estado });

  return (
    <section
      ref={setNodeRef}
      className={`flex min-w-0 flex-col rounded-xl border-2 border-dashed p-3 transition-colors ${
        isOver ? "border-[#b8791a] bg-amber-50" : "border-transparent bg-stone-200/50"
      }`}
    >
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
            <ClienteArrastrable
              key={cliente.id}
              cliente={cliente}
              onOpen={onOpenCliente}
              onCambiarEstado={onCambiarEstado}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ClienteArrastrable({
  cliente,
  onOpen,
  onCambiarEstado,
}: {
  cliente: Cliente;
  onOpen?: (cliente: Cliente) => void;
  onCambiarEstado?: (id: string, nuevoEstado: EstadoCliente) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: cliente.id,
    data: { estado: cliente.estado },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? "opacity-40" : ""}`}
    >
      <ClienteCard cliente={cliente} onOpen={onOpen} onCambiarEstado={onCambiarEstado} />
    </div>
  );
}
