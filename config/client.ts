/**
 * Configuración de marca por cliente.
 *
 * Este dashboard es un producto reutilizable: cada cliente (arrendadora de
 * autos) obtiene su propio deploy en Vercel apuntando a su propia base de
 * Airtable. Este archivo es el ÚNICO lugar donde debe vivir la identidad
 * visual del cliente — el resto del código lee de acá, nunca hardcodea
 * nombres, logos o colores.
 *
 * Para lanzar un cliente nuevo:
 *   1. Reemplazá los valores de `clientConfig` abajo.
 *   2. Si el logo es un archivo local, ponelo en /public y apuntá `logoUrl`
 *      a esa ruta (ej: "/logo-sierra-nevada.svg"). También podés usar una
 *      URL externa (ej: un logo alojado en Airtable o un CDN).
 *   3. Los colores deben ser valores CSS válidos (hex, rgb, etc.) — se usan
 *      como variables CSS (--color-primary / --color-secondary /
 *      --color-accent / --color-forest) en toda la app.
 */

export interface ClientConfig {
  /** Nombre del negocio, se muestra en el header y en el <title> */
  businessName: string;
  /** Ruta local (/public) o URL externa al logo del cliente */
  logoUrl: string;
  /** Texto alternativo del logo (accesibilidad) */
  logoAlt: string;
  /** Color primario de marca (botones, acentos, header, estado "Arrendado") */
  primaryColor: string;
  /** Color secundario de marca (bordes, detalles neutros) */
  secondaryColor: string;
  /** Color de acento oscuro (texto de marca, estado "Mantención") */
  accentColor: string;
  /** Segundo acento de marca (estado "Disponible", detalles de entorno) */
  forestColor: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Sierra Nevada Rentacar — configuración activa. Identidad "alpine lodge":
// dorado + carbón cálido + verde bosque + acero, inspirada en el propio
// isotipo (montaña + sol).
// ─────────────────────────────────────────────────────────────────────────
export const clientConfig: ClientConfig = {
  businessName: "Sierra Nevada Rentacar",
  logoUrl: "/sierra-nevada-logo.png",
  logoAlt: "Logo de Sierra Nevada Rentacar",
  primaryColor: "#F2C230", // dorado
  secondaryColor: "#B8B8B8", // gris acero
  accentColor: "#1C1917", // carbón cálido
  forestColor: "#008000", // verde disponible (ajustado, mas suave que el neon inicial)
};

// Plantilla genérica para el próximo cliente (comentada — descomentar y
// ajustar, o duplicar este archivo por cliente si preferís deploys
// separados):
//
// export const clientConfig: ClientConfig = {
//   businessName: "Tu Rentacar",
//   logoUrl: "/logo-placeholder.svg",
//   logoAlt: "Logo de Tu Rentacar",
//   primaryColor: "#2563eb",
//   secondaryColor: "#0f172a",
//   accentColor: "#1e293b",
//   forestColor: "#166534",
// };
