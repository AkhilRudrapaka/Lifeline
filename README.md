# Lifeline

**Lifeline** is a NitroStack MCP server for intelligent emergency hospital routing. Instead of sending a patient to the *nearest* hospital, Lifeline triages the emergency, ranks nearby hospitals by medical specialization match, ICU/ER bed availability, travel ETA, and estimated wait time, calculates a live ambulance route, and lets a client reserve a bed before the patient arrives.

Track: **HealthTech & Life Sciences**

> All hospital data in `src/server/data/hospitals.json` is synthetic demo data (`data_type: "SYNTHETIC_DEMO"`) — it does not represent real facilities, capacity, or wait times.

## Table of Contents

- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [MCP Tools](#mcp-tools)
- [Ranking Model](#ranking-model)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [NitroStack Studio](#nitrostack-studio)
- [Deployment](#deployment)

## Architecture

Lifeline follows a strict layered architecture — **widgets call tools, tools call services, services own state and I/O**. Business logic never lives in a tool handler or a React component.

```
Widget (React)  ──callTool──▶  Tool (Controller)  ──▶  Service  ──▶  JSON mock DB / OpenRouteService
```

- **Services** (`src/server/services/`) are DI singletons and own all business logic and state (the in-memory hospital dataset, the reservation ledger, the ranking algorithm, the routing client, the triage classifier). They are framework-agnostic and fully unit-testable in isolation.
- **Tools** (`src/server/tools/`) are thin `@Controller`/`@Tool` classes. They validate input with Zod, delegate to exactly one service, and log — nothing else.
- **Widgets** (`src/widgets/app/`) are Next.js routes rendered inside the MCP client. They never read the hospital data or call services directly — only `callTool(...)`.
- **Shared** (`src/server/shared/`) holds cross-cutting error classes (`AppError` → `McpError`) and constants (tool names, capability vocabulary, ranking weights).
- **Interfaces** (`src/server/interfaces/`) are the single source of truth for every domain shape (`Hospital`, `Patient`, `Reservation`, `Route`, `RankedHospital`, `EmergencyAssessment`, …). `src/server/types/` re-exports them for convenience.

## Folder Structure

```
src/
├── app.module.ts              # Root @McpApp / @Module
├── index.ts                   # Bootstrap entrypoint
├── health/
│   └── system.health.ts       # Liveness/memory health check
├── modules/
│   └── lifeline/
│       └── lifeline.module.ts # Registers all Lifeline controllers + services
├── server/
│   ├── interfaces/            # Source-of-truth domain contracts
│   ├── types/                 # Barrel re-export of interfaces/
│   ├── shared/                # AppError hierarchy, constants, ranking weights
│   ├── utils/                 # DistanceCalculator, GeoUtils, IdGenerator
│   ├── data/
│   │   └── hospitals.json     # Synthetic mock hospital database
│   ├── services/              # HospitalService, RoutingService, TriageService,
│   │                          # RankingService, ReservationService
│   └── tools/                 # One controller per tool domain
└── widgets/
    ├── app/
    │   └── emergency-dispatch/
    │       ├── page.tsx           # Orchestrator (state, callTool wiring)
    │       ├── MapView.tsx        # Leaflet map (dynamically imported, no SSR)
    │       ├── HospitalList.tsx   # Ranked hospital cards
    │       ├── ReservationModal.tsx
    │       ├── types.ts           # Local mirror of tool output shapes
    │       └── utils.ts           # parseToolResult() for callTool responses
    └── widget-manifest.json
```

## MCP Tools

| Tool | Description |
|---|---|
| `triage_symptoms` | Deterministic, rule-based classification of free-form symptom text into `severity`, `requiredDepartment`, and `confidence`. |
| `get_nearby_hospitals` | Hospitals within a radius of a location, optionally filtered by required capability. |
| `get_hospital_capabilities` | A hospital's specializations, languages, and verification status. |
| `check_resource_availability` | Live ER/ICU bed counts and estimated wait time for a hospital. |
| `calculate_route` | ETA, distance, and GeoJSON route between two points via OpenRouteService (falls back to a haversine estimate if unavailable). |
| `rank_hospitals` | Weighted ranking of a candidate hospital list — sorted best-first, drives the `emergency-dispatch` widget. |
| `request_emergency_reservation` | Reserves an ER/ICU bed, decrements live availability, returns a confirmation code. |

Typical flow: `triage_symptoms` → `get_nearby_hospitals` (filtered by the triaged department) → `rank_hospitals` (renders the map/list widget) → `calculate_route` (per selected hospital) → `request_emergency_reservation`.

## Ranking Model

`rank_hospitals` scores every candidate 0–100. Every factor except specialization match is min-max normalized *across the current candidate set* before weighting, so scores stay meaningful whether the search radius was 5 km or 50 km.

| Factor | Weight | Scoring |
|---|---|---|
| Specialization match | 0.30 | `1.0` exact capability match · `0.3` General ER only · `0` no match |
| ICU beds available | 0.15 | min-max normalized |
| ER beds available | 0.15 | min-max normalized |
| Distance | 0.15 | inverse min-max normalized (closer scores higher) |
| ETA | 0.15 | inverse min-max normalized (faster scores higher) |
| ER wait time | 0.10 | inverse min-max normalized (shorter scores higher) |

Ties are broken by distance ascending. The configured weights are also returned in every `rank_hospitals` response (`ranking_weights`) for transparency. See `DEFAULT_RANKING_WEIGHTS` in [src/server/shared/constants.ts](src/server/shared/constants.ts).

## Environment Variables

See [`.env.example`](.env.example) for the full list. The only Lifeline-specific variable is:

| Variable | Required | Description |
|---|---|---|
| `ORS_API_KEY` | No | [OpenRouteService](https://openrouteservice.org/dev/#/signup) API key for live routing. Free tier: 2000 requests/day. If unset, `calculate_route` degrades to a haversine-distance ETA estimate — routing never blocks dispatch. |

Never commit a real `.env` file or hardcode API keys in source.

## Installation

```bash
npm run install:all
```

This runs `nitrostack-cli install`, which installs both the root MCP server dependencies and the `src/widgets` Next.js project's dependencies.

If you only need the root server:

```bash
npm install
npm --prefix src/widgets install
```

Then copy the environment template and (optionally) add your OpenRouteService key:

```bash
cp .env.example .env
```

## Running Locally

```bash
npm run dev
```

This starts the MCP server (STDIO transport by default in development) via `nitrostack-cli dev`. To exercise the tools without a full MCP client, use [NitroStack Studio](#nitrostack-studio).

To run the widget's Next.js dev server standalone (useful for fast UI iteration on `EmergencyDispatchWidget`):

```bash
npm --prefix src/widgets run dev
```

## NitroStack Studio

[NitroStack Studio](https://nitrostack.ai/studio) is the recommended way to test and debug Lifeline during development — it lets you invoke tools directly (e.g. `rank_hospitals`) and preview the resulting `emergency-dispatch` widget (map, ranked list, route overlay, reservation flow) without needing a full chat client.

1. Download NitroStack Studio.
2. Point it at this project directory.
3. Run `npm run dev` (or let Studio manage the dev process).
4. Invoke tools from the Studio chat/testing pane in the order described in [MCP Tools](#mcp-tools).

## Deployment

```bash
npm run build      # nitrostack-cli build — compiles src/ to dist/ and builds the widgets export
npm run start:prod # nitrostack-cli start — runs the compiled server
```

In production (`NODE_ENV=production`), the server defaults to dual transport (STDIO + HTTP SSE). Relevant variables (see `.env.example`):

- `MCP_TRANSPORT_TYPE` — `stdio` | `http` | `dual`
- `PORT`, `HOST` — HTTP transport binding
- `ENABLE_CORS` — enable CORS for HTTP transport
- `ORS_API_KEY` — set this in your production environment for live routing

The `src/widgets` Next.js app builds as a static export (`output: 'export'` in `next.config.js`) and is served by the MCP server alongside the tool definitions — no separate hosting is required.

## Author

Team Kanya Rashi
