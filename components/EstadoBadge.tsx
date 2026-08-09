import type { EstadoAuto } from "@/lib/types";
import { ESTADO_STYLES } from "@/lib/estado";

interface Props {
  estado: EstadoAuto;
  /** "lg": encabezado de columna, con contador. "sm": marca compacta en la tarjeta. */
  size?: "lg" | "sm";
  count?: number;
}

export default function EstadoBadge({ estado, size = "sm", count }: Props) {
  const style = ESTADO_STYLES[estado];

  if (size === "lg") {
    return (
      <span
        className={`inline-flex items-center gap-2 py-2 pl-4 pr-5 ${style.solidBg} ${style.solidText}`}
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%, 10px 50%)" }}
      >
        <span className="font-display text-sm font-bold uppercase tracking-wide">
          {style.label}
        </span>
        {typeof count === "number" && (
          <span className="font-sans text-base font-semibold tabular-nums">
            {count}
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wide ${style.solidBg} ${style.solidText}`}
    >
      {style.label}
    </span>
  );
}
