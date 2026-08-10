# Rentacar Dashboard

Dashboard de flota para negocios de arriendo de autos. Muestra los autos
agrupados por estado (Disponible / Arrendado / Mantención) leyendo los datos
desde Airtable. Pensado como producto reutilizable: cada cliente obtiene su
propio deploy con su propia marca y su propia base de Airtable.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Airtable como fuente de datos (vía API route server-side)
- Deploy en Vercel

## Estructura relevante

```
config/client.ts        # Marca del cliente: nombre, logo, colores
lib/airtable.ts               # Cliente de Airtable (server-only): lectura y PATCH de estado
lib/resumen.ts                 # Cálculo de resumen por estado (client-safe)
lib/types.ts                    # Tipos compartidos (Auto, EstadoAuto, etc.)
app/api/autos/route.ts         # GET: expone los autos al frontend
app/api/autos/[id]/route.ts   # PATCH: cambia el Estado de un auto puntual
components/                     # Header, SummaryBar, StatusColumn, CarCard, Dashboard
```

## 1. Instalar dependencias

Requisitos: Node.js 18.18+ (recomendado 20 LTS) y npm.

```bash
npm install
```

## 2. Configurar variables de entorno

Copiá el archivo de ejemplo:

```bash
cp .env.example .env.local
```

Completá `.env.local` con los datos de la base de Airtable del cliente:

```
AIRTABLE_API_KEY=pat_xxxxxxxxxxxxxxxx
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_TABLE_NAME=Autos
```

- **AIRTABLE_API_KEY**: Personal Access Token generado en
  [airtable.com/create/tokens](https://airtable.com/create/tokens), con
  permisos de lectura Y escritura (`data.records:read` y
  `data.records:write`) sobre la base del cliente — el dashboard permite
  cambiar el Estado de un auto desde la interfaz, así que el token no puede
  ser solo de lectura.
- **AIRTABLE_BASE_ID**: ID de la base (empieza con `app...`).
- **AIRTABLE_TABLE_NAME**: nombre exacto de la tabla (por defecto `Autos`).

La tabla de Airtable debe tener estas columnas:

| Columna              | Tipo                                          |
| --------------------- | ---------------------------------------------- |
| Nombre                | Texto                                          |
| Patente               | Texto                                          |
| Estado                | Selección única: Disponible / Arrendado / Mantención |
| Precio por día        | Número                                         |
| Requisitos            | Texto                                          |
| Fecha de devolución   | Fecha                                          |

`.env.local` está en `.gitignore` — nunca se sube al repo. El token de
Airtable solo se usa en `lib/airtable.ts`, importado exclusivamente desde las
API routes (`app/api/autos/route.ts` y `app/api/autos/[id]/route.ts`), así
que nunca llega al navegador.

## Cambiar el estado de un auto desde el dashboard

Cada tarjeta de auto tiene botones grandes para marcarlo con otro estado
("Marcar Disponible", "Marcar Arrendado", "Marcar Mantención" — se muestran
los dos estados a los que se puede pasar, no el actual). Al tocar uno:

1. El botón queda deshabilitado y muestra "Guardando...".
2. Se hace un `PATCH` a `/api/autos/:id`, que a su vez actualiza el campo
   Estado en Airtable server-side.
3. Si funciona, la tarjeta muestra "✓ Actualizado" y a los pocos segundos se
   reordena a su nueva columna (sin recargar la página).
4. Si falla (por ejemplo, el token no tiene permiso de escritura, o se cae
   la conexión), la tarjeta muestra "No se pudo actualizar, intentá de
   nuevo." y se puede reintentar tocando el botón otra vez.

## 3. Correr localmente

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). El dashboard hace
polling a `/api/autos` cada 20 segundos para mantenerse actualizado.

## 4. Personalizar la marca de un cliente

Editá [`config/client.ts`](./config/client.ts):

```ts
export const clientConfig: ClientConfig = {
  businessName: "Sierra Nevada Rentacar",
  logoUrl: "/logo-sierra-nevada.svg", // o una URL externa
  logoAlt: "Logo de Sierra Nevada Rentacar",
  primaryColor: "#15803d",
  secondaryColor: "#14532d",
};
```

Si el logo es un archivo, ponelo en `public/`. El resto de la app (título,
header, acentos de color) lee de este archivo — no hay nada de marca
hardcodeado en los componentes.

## 5. Desplegar en Vercel

1. Subí el proyecto a un repo de GitHub/GitLab/Bitbucket (o usá `vercel` CLI
   directo desde esta carpeta).
2. En [vercel.com](https://vercel.com), importá el repo (New Project).
3. En **Environment Variables**, agregá las tres variables de `.env.example`
   con los valores reales del cliente: `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`,
   `AIRTABLE_TABLE_NAME`.
4. Deploy. Vercel detecta Next.js automáticamente (no requiere configuración
   adicional de build).

### Un cliente nuevo = un deploy nuevo

Para agregar otro cliente (además de Sierra Nevada):

1. Actualizá `config/client.ts` con su marca (o mantené una copia del
   proyecto por cliente si preferís repos separados).
2. Creá un nuevo proyecto en Vercel apuntando a su propia base de Airtable
   (variables de entorno distintas).
3. Cada cliente tiene su propio dominio/URL de Vercel, su propia data y su
   propia marca, sin tocar el código compartido.

## Notas

- El formato de precio y fecha usa el locale `es-CL` (separador de miles con
  punto). Ajustable en `lib/format.ts` si un cliente opera en otro país.
- Si un auto en Airtable tiene un valor de `Estado` vacío o inesperado, se
  muestra en la columna "Mantención" para que quede visible en vez de
  perderse silenciosamente.
