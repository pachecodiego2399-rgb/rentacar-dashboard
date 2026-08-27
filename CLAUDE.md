# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Fleet dashboard for car rental businesses ("Rentacar Dashboard"). Shows cars grouped by status
(Disponible / Arrendado / Mantención) reading data from Airtable, and lets staff change a car's
status directly from the UI. Built as a reusable product: each client gets their own Vercel deploy
pointing at their own Airtable base and brand config. UI text/copy is in Spanish (the app's
audience); code identifiers are also largely in Spanish (`Auto`, `estado`, `resumen`, etc.) — match
that convention when adding code.

## Commands

```bash
npm install       # install dependencies (Node 18.18+, 20 LTS recommended)
npm run dev        # start dev server at http://localhost:3000
npm run build       # production build
npm run start        # run production build
npm run lint         # next lint
```

There is no test suite configured in this repo.

Environment setup: `cp .env.example .env.local`, then fill in `AIRTABLE_API_KEY`,
`AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME`. The API key needs both read and write scopes
(`data.records:read` and `data.records:write`) since the dashboard writes status changes back to
Airtable.

## Architecture

**Data flow**: Airtable is the only data store. `lib/airtable.ts` (marked `import "server-only"`)
is the sole module that touches Airtable's REST API directly and holds the API key — it must never
be imported from a Client Component, or the build fails. It's imported only by the two API routes:

- `app/api/autos/route.ts` — `GET`, fetches + paginates all records, returns `{ autos, resumen }`.
- `app/api/autos/[id]/route.ts` — `PATCH`, validates body, writes `Estado` (and conditionally
  `Fecha de devolución`) for one record.

The client (`components/Dashboard.tsx`) polls `GET /api/autos` every 20s (`POLL_INTERVAL_MS`) and
also does an optimistic local update immediately after a successful `PATCH` from `CarCard`, so a
status change reorders into its new column without waiting for the next poll.

**Airtable field-name fragility**: the underlying Airtable base has real column names that don't
exactly match the domain model, due to typos made when the base was created — this is handled
deliberately in `lib/airtable.ts`, not treated as a bug to "fix":
- Reads: `getCampo()` matches column names after normalizing (trim, lowercase, strip accents), so
  minor mismatches in the base don't break reads.
- Writes: the `Estado` option "Mantención" is stored in Airtable as "Mantencion" (no accent) —
  see `OPCION_AIRTABLE_POR_ESTADO`. The "Fecha de devolución" field is actually named
  `"Fecha de devolucion "` in the base (no accent, trailing space) — see
  `CAMPO_FECHA_DEVOLUCION`. Airtable rejects writes to unrecognized field/option names outright
  (`UNKNOWN_FIELD_NAME` / `INVALID_MULTIPLE_CHOICE_OPTIONS`), so these exact literal strings matter
  for PATCH requests even though normalized matching is used for reads.
- An auto with an empty/unrecognized `Estado` value is mapped to "Mantención" rather than dropped,
  so it stays visible instead of silently disappearing from the board.
- Dates from Airtable are `"YYYY-MM-DD"` with no time component. `lib/format.ts` builds a local
  `Date` from the numeric parts instead of `new Date(isoString)`, because parsing the ISO string
  directly is interpreted as UTC midnight and renders one day early in timezones behind UTC (e.g.
  Chile).

**Per-client branding**: `config/client.ts` exports the single `clientConfig` object (business
name, logo, four brand colors). It's the only place client identity should live — nothing else
hardcodes a name/logo/color. `app/layout.tsx` injects the colors as CSS custom properties
(`--color-primary`, etc.) consumed by `tailwind.config.ts`'s `brand.*` color tokens. Onboarding a
new client means editing this file (and adding a logo to `public/`) and pointing a new Vercel
project at the client's own Airtable base/env vars — not code changes elsewhere.

**Module split rationale**: `lib/resumen.ts` (status counts) is separate from `lib/airtable.ts`
specifically because it has no `server-only` import and is called from the client
(`Dashboard.tsx`) for the optimistic-update recompute, whereas `lib/airtable.ts` cannot be
imported client-side at all.

**Component tree**: `app/page.tsx` → `Header` + `Dashboard`. `Dashboard` (client component) owns
polling/fetch state and splits `autos` into the three status columns, rendering one `StatusColumn`
per status, each containing `CarCard`s. `CarCard` owns its own per-card save state (`idle` /
`guardando` / `ok` / `error`) and, when marking a car "Arrendado", opens an inline date-picker form
for the return date before firing the `PATCH`.

**Clientes section (read-only)**: `app/clientes/page.tsx` mirrors the Autos page but for leads
captured by the WhatsApp bot (Airtable table `Clientes`, configurable via
`AIRTABLE_CLIENTES_TABLE_NAME`, default `"Clientes"`). Unlike Autos, this section is read-only —
the AI agent changes a client's `Estado` (`En conversación` / `Calificado` / `Listo para retirar` /
`Completado`) mid-conversation via an n8n Airtable Tool node, not Salvador from the dashboard, so
there's no PATCH endpoint or write path here. `lib/airtable.ts` exports `fetchClientes()`
alongside `fetchAutos()`, using the same API key/base but a separate table-name env var.
`lib/estado-cliente.ts` mirrors `lib/estado.ts` (labels/colors per state, kept separate from Autos'
`ESTADO_STYLES` because the state sets don't overlap). `components/Header.tsx` now renders
`NavTabs` (client component, `usePathname`) to switch between `/` (Autos) and `/clientes`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
