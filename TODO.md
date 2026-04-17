# Chart Benchmark — Build Checklist

Progress tracker for implementing the React Market Chart Benchmarker per DESIGN.MD.

---

## Requirement 1 — Worker-Based Local Market Feed

- [ ] **Step 1** — Define OHLCV types and worker message contract (`src/types/`)
- [ ] **Step 2** — Implement the market data generator: price simulation, candle building logic (`src/lib/`)
- [ ] **Step 3** — Implement the Web Worker that runs the generator and posts messages (`src/workers/`)
- [ ] **Step 4** — Implement a `useMarketFeed` React hook that wraps the worker lifecycle (`src/hooks/`)
- [ ] **Step 5** — Wire up a minimal UI to verify the feed is working (live candle data in `App.tsx`)

## Requirement 2 — Scenario Engine

- [ ] **Step 6** — Define the scenario configuration shape and scenario engine (market regime, volatility, cadence, burst, seed, duration)

## Requirement 3 — Chart Adapter Layer

- [ ] **Step 7** — Define and document the chart adapter contract (TypeScript interface + update strategy types)
- [ ] **Step 8** — Build a naive React-state-driven adapter as the first reference implementation

## Requirement 4 — Measurement and Reporting

- [ ] **Step 9** — Implement the measurement layer (first render time, update latency, p95/p99, frame pacing, long frames, backlog, memory)
- [ ] **Step 10** — Build the results/reporting UI (metrics display, export, cross-run comparison)

---

## Notes

- Start with Step 1 — all other steps depend on the data types being settled first.
- Each step should be reviewed and understood before moving to the next.
- See `DESIGN.MD` for full requirements and context.
