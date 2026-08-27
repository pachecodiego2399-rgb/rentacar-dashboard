import type { Cliente } from "@/lib/types";
import { ESTADO_CLIENTE_STYLES } from "@/lib/estado-cliente";
import { formatearFecha, formatearFechaHora } from "@/lib/format";
import EstadoClienteBadge from "./EstadoClienteBadge";

export default function ClienteCard({ cliente }: { cliente: Cliente }) {
  const style = ESTADO_CLIENTE_STYLES[cliente.estado];
  const fechaContacto = formatearFecha(cliente.fechaContacto);
  const ultimaActualizacion = formatearFechaHora(cliente.ultimaActualizacion);

  // WhatsApp acepta números con el prefijo internacional sin "+" ni
  // espacios en el link wa.me — si el teléfono no viene en ese formato
  // simplemente no mostramos el link, para no armar uno roto.
  const telefonoLimpio = cliente.telefono.replace(/[^\d]/g, "");
  const linkWhatsapp =
    telefonoLimpio.length >= 8 ? `https://wa.me/${telefonoLimpio}` : null;

  return (
    <article
      className={`rounded-lg border border-l-4 border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md ${style.border}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 break-words font-display text-lg font-bold uppercase tracking-wide text-stone-900">
          {cliente.nombre}
        </h3>
      </div>

      <div className="mt-2">
        <EstadoClienteBadge estado={cliente.estado} size="sm" />
      </div>

      {linkWhatsapp ? (
        <a
          href={linkWhatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block font-mono text-sm text-brand-primary underline underline-offset-2"
        >
          {cliente.telefono}
        </a>
      ) : (
        <p className="mt-3 font-mono text-sm text-stone-600">{cliente.telefono}</p>
      )}

      {cliente.autoDeInteres && (
        <p className="mt-2 text-sm text-stone-500">
          Auto de interés:{" "}
          <span className="font-medium text-stone-700">{cliente.autoDeInteres}</span>
        </p>
      )}

      {cliente.tarjetaDeCredito !== null && (
        <p className="mt-1 text-sm text-stone-500">
          Tarjeta de crédito:{" "}
          <span className="font-medium text-stone-700">
            {cliente.tarjetaDeCredito ? "Sí" : "No"}
          </span>
        </p>
      )}

      {fechaContacto && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-500">
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          Primer contacto: <span className="font-medium text-stone-700">{fechaContacto}</span>
        </p>
      )}

      {ultimaActualizacion && (
        <p className="mt-1 text-xs text-stone-400">
          Última actualización: {ultimaActualizacion}
        </p>
      )}
    </article>
  );
}
