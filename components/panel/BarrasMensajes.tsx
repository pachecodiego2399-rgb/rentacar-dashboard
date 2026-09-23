"use client";

import { useState } from "react";
import type { Barra } from "@/lib/metricas";

function pasoEje(max: number): number {
  const bruto = max / 4;
  const p = Math.pow(10, Math.floor(Math.log10(Math.max(bruto, 1))));
  const f = bruto / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

/** Barras apiladas: azul = con el local abierto, violeta = fuera de horario (solo el agente). */
export default function BarrasMensajes({ serie }: { serie: Barra[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const maxReal = Math.max(0, ...serie.map((b) => b.enHorario + b.fueraHorario));
  const paso = pasoEje(Math.max(maxReal, 4));
  const tope = Math.ceil(Math.max(maxReal, 4) / paso) * paso;
  const marcas = Array.from({ length: Math.round(tope / paso) + 1 }, (_, i) => i * paso);
  const cadaEtiqueta = Math.max(1, Math.ceil(serie.length / 12));

  return (
    <div className="mt-5">
      <div className="relative h-[210px] pl-8">
        {marcas.map((v) => (
          <div key={v} className="absolute left-8 right-0 border-t border-n-line" style={{ bottom: `${(v / tope) * 100}%` }}>
            <span className="absolute -left-8 -top-2 w-6 text-right text-[11px] tabular-nums text-n-faint">{v}</span>
          </div>
        ))}
        <div className="absolute inset-0 left-8 flex items-end gap-[3px]">
          {serie.map((b, i) => {
            const total = b.enHorario + b.fueraHorario;
            return (
              <div
                key={i}
                className="relative flex h-full flex-1 flex-col justify-end"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                {hover === i && total > 0 && (
                  <div className="absolute bottom-[calc(100%+6px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-n-line2 bg-n-card2 px-2.5 py-1.5 text-[12px] shadow-xl">
                    <div className="font-medium text-n-fg">{b.etiqueta}</div>
                    <div className="text-n-acc2">{b.enHorario} en horario</div>
                    <div className="text-n-night">{b.fueraHorario} fuera de horario</div>
                  </div>
                )}
                <div
                  className="w-full rounded-t-[3px] bg-n-night/80"
                  style={{ height: `${(b.fueraHorario / tope) * 100}%`, opacity: hover === null || hover === i ? 1 : 0.55 }}
                />
                <div
                  className="w-full bg-n-acc/85"
                  style={{
                    height: `${(b.enHorario / tope) * 100}%`,
                    borderRadius: b.fueraHorario ? 0 : "3px 3px 0 0",
                    opacity: hover === null || hover === i ? 1 : 0.55,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex gap-[3px] pl-8">
        {serie.map((b, i) => (
          <div key={i} className="flex-1 overflow-visible whitespace-nowrap text-center text-[11px] text-n-faint">
            {i % cadaEtiqueta === 0 ? b.etiqueta : ""}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-5 text-[12px] text-n-muted">
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-n-acc" /> Con el local abierto</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-n-night" /> Con el local cerrado — solo el agente</span>
      </div>
    </div>
  );
}
