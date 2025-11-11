# Latency Topology Visualizer

# Latency Topology Visualizer

Small notes on running this project locally.

Prerequisites
- Node.js v18+
- npm

Install

```bash
npm ci
```

Run the mock WebSocket server (optional)

```bash
node ./scripts/mock-server.js
```

Start the Next.js dev server

```bash
# default (file-backed history)
npm run dev

# enable WASM sqlite (requires `sql.js` installed)
export USE_WASM_SQLITE=1
npm run dev
```

Import authoritative data into the project (copies into `data/` and optionally imports locations into `history.sqlite`):

```bash
# copy and import sample files
node scripts/import-data.js --exchanges=data/exchanges.json --regions=data/provider-regions.sample.json --import-sqlite
```

Smoke test (quick verification script)

```bash
node scripts/history-smoke-test.js
```

APIs of interest
- GET /api/locations — returns location list (from sqlite if available, otherwise `data/exchanges.json`)
- GET /api/regions — returns FeatureCollection (normalized) and server counts
- GET /api/mock-latency — returns generated mock latency events
- POST /api/history — append a latency record: { pair, from, to, value, ts }
- GET /api/history?pair=... — query stored history

## Usage — importer, diagnostics, and assign

Import a GeoJSON of provider regions and map a feature property into the region code used by the app:

```bash
# Copy a user GeoJSON into the project and map its `iso_a3` (or `code`) property into `properties.region` before import
node scripts/import-regions.js /absolute/path/to/your.geo.json --map-prop=iso_a3
```

This will:
- copy the file to `data/provider-regions.json`
- if `--map-prop` is provided, copy `feature.properties[<prop>]` to `feature.properties.region`
- run the importer which repairs/initializes `history.sqlite`, imports `data/exchanges.json` locations, and assigns `region_code` values

Diagnostic endpoint (to inspect ambiguous matches):

```bash
curl http://127.0.0.1:3000/api/locations/diagnose | jq .
```

Batch assign API (if you prefer manual assignment):

POST JSON to `/api/locations/assign` with either a single object or an array:

```json
{ "assignments": [ { "id": "binance-aws-tokyo", "region": "JPN" } ] }
```

Run the smoke test included in `scripts/import-smoke-test.js` to exercise import → diagnose → assign flows:

```bash
node scripts/import-smoke-test.js
```

Notes
- The project supports a portable SQLite via `sql.js` (WASM). If you enable it, set `USE_WASM_SQLITE=1` and install `sql.js`.
- The importer includes a nearest-region fallback for regions that only provide simple `bounds` instead of full polygons. This is a best-effort assignment.

CI
- A simple GitHub Actions workflow is included at `.github/workflows/ci.yml` which runs install, typecheck and the smoke test on push and PR.

Server probes and realtime broadcasts
-----------------------------------

This project includes a demo server-side probe runner that performs pairwise HTTP probes between configured locations and persists results to the history store.

- To run the mock WebSocket server with an HTTP broadcast bridge (so server probe runs are forwarded to WS clients):

```bash
# start mock WS + HTTP bridge
node ./scripts/mock-server.js
```

- To trigger server probes (manual):

```bash
# POST to the run endpoint (rate-limited demo)
curl -X POST http://localhost:3000/api/probes/run
```

- In the UI Controls panel you can toggle "Server Probes (live)" to receive server probe records in realtime (the app broadcasts them via the mock WS server bridge).

Environment flags
- `USE_WASM_SQLITE=1` — enable sql.js WASM-backed sqlite persistence (optional).
- `NEXT_PUBLIC_USE_LIVE_LATENCY=1` — enable client-side browser probe adapter (self-probes demo).
- `NEXT_PUBLIC_USE_SERVER_PROBES=1` — enable polling of server probes (alternative to UI toggle).

Scheduler
---------

You can run a simple scheduler that periodically triggers server probe runs (demo only):

```bash
PROBE_INTERVAL_MS=60000 node scripts/schedule-probes.js
```

For production use, replace with a resilient worker or hosted cron and secure the `/api/probes/run` endpoint.

Status summary (what's done vs remaining)
----------------------------------------
- Done: 3D globe visualization, markers, animated arcs/pulses, heatmap demo, legend, controls, CSV export, mock WS server, demo server probe runner, WASM sqlite adapter support, aggregation endpoint and UI wiring, worker script and PM2 sample.
- Partially done: external latency source integration (mock + client adapter present), region data completeness (sample-level), mobile LOD/touch tuning, detailed dashboard metrics and persistent rate-limiter.
- Not done: video recording demo, scheduled PDF/report exports, production-grade secrets management and rate-limiting (Redis), durable rollups/aggregation in sqlite and CI integration for TS routes.

External latency source / polling
--------------------------------

This app can poll an external latency API and ingest the returned records into the realtime store. The server provides a simple proxy endpoint at `/api/external-latency` that will forward requests to a configured upstream service.

How it works:
- Set the upstream API URL in your environment on the server: `EXTERNAL_LATENCY_API_URL=https://example.com/latency`.
- The endpoint is rate-limited and cached; you can configure `EXTERNAL_LATENCY_CACHE_TTL_MS` and `EXTERNAL_LATENCY_RATE_LIMIT_MS` via env.
- In the UI, enable the "External source" toggle under Controls (or set `externalSourceEnabled` in the Zustand store) and the app will poll `/api/external-latency` periodically.

Configuration and tuning:
- Poll interval: set `NEXT_PUBLIC_EXTERNAL_POLL_MS` (ms). Default is 7000 (7s).
- The app accepts a variety of response shapes: an array of records or an object with `data: [...]`. Each record should include at least `from`, `to`, `value` (ms) and `ts` (timestamp). Example accepted shapes:

	Array form:
	```json
	[ { "from": "a", "to": "b", "value": 34, "ts": 169... }, ... ]
	```

	Envelope form:
	```json
	{ "source": "myapi", "data": [ { "f":"a","t":"b","avg":34,"ts":169... }, ... ] }
	```

Mapping rules in `RealtimeProvider`:
- `from`/`f`/`src` map to `from`.
- `to`/`t`/`dst` map to `to`.
- `value`/`avg`/`lat`/`rtt` map to `value` (ms).
- `ts`/`time` map to `ts`.

Example free sources to adapt:
- Cloudflare, Fastly or public CDN endpoints can be used as probe targets for browser-side probes. For aggregated external latency feeds, search for free CSV/JSON feeds or public monitoring endpoints that expose latency summaries.

Enabling in dev:
1. Add env to `.env.local` (or export in shell):

```
EXTERNAL_LATENCY_API_URL=https://example.com/latency
NEXT_PUBLIC_EXTERNAL_POLL_MS=7000
```

2. Start dev and enable the toggle in Controls. The app will poll the configured upstream and ingest records into the realtime store and history.


License: MIT

How to record a short demo
-------------------------

1. Start the dev server and mock WS server:

```bash
npm run dev
node ./scripts/mock-server.js
```

2. Use your OS screen recorder (QuickTime on macOS or any screen recorder) and record a 30–60s clip:
	- Start the app at http://localhost:3000
	- Open the Controls panel, enable Server Probes and Heatmap
	- Select a pair in the History panel and show the chart
	- Pan/zoom the globe and show regions legend

3. Save the recording as MP4 and include it with your submission.

Next steps and suggestions
--------------------------
- Add Playwright UI tests (smoke test added in `tests/playwright.smoke.spec.ts`).
- Harden production auth for probe endpoints using a secrets manager (don't store tokens in code).
- Add a scheduled worker (cron, serverless or container) to run `scripts/compute-rollups.js` periodically.
- Create PDF report export using headless Chromium if you need programmatic PDF exports.
