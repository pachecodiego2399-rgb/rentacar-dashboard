/**
 * Divisor de cordillera: el elemento de firma del dashboard. Reemplaza la
 * barra plana genérica bajo el header con una silueta de montaña de bajo
 * poligonaje (ecoando el isotipo) — silueta en carbón, con una línea de
 * cresta dorada como si fuera el sol asomando detrás de la sierra.
 */
export default function MountainDivider() {
  const cresta =
    "M0,44 L60,20 L110,34 L180,8 L230,28 L300,14 L360,36 L430,6 L500,30 " +
    "L570,18 L650,38 L730,12 L810,32 L880,20 L960,40 L1040,10 L1120,30 " +
    "L1200,22 L1280,38 L1360,16 L1440,34";

  return (
    <svg
      viewBox="0 0 1440 64"
      preserveAspectRatio="none"
      className="block h-5 w-full sm:h-7"
      aria-hidden="true"
    >
      <path d={`M0,64 L${cresta.slice(1)} L1440,64 Z`} fill="var(--color-accent)" />
      <path
        d={cresta}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
