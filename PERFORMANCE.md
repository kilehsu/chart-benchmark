# Performance Measurement Design

## Two-Tier Model

The measurement layer operates at two levels simultaneously:

**Rolling window** — a fixed-size buffer of recent frame intervals (hardcoded at 300 frames). This feeds the live display. It answers "how is the chart performing right now?" Older frames are evicted as new ones arrive, so the display always reflects recent behavior rather than run history.

**Reservoir (RunningStats)** — a fixed-size random sample of all frame intervals across the entire run, maintained via reservoir sampling (Algorithm R). This feeds the final benchmark report. Memory is bounded regardless of run duration. At end of run, the reservoir is sorted once to compute percentile statistics.

The two tiers are independent. The live display sorts ~300 items every second. The final report sorts `reservoirSize` items exactly once.

---

## PerformanceMonitorConfig

Passed into `usePerformanceMonitor`. Controls all user-facing benchmark parameters.

```ts
interface PerformanceMonitorConfig {
  // Reservoir sampling
  reservoirSize: number;         // number of frames to keep in sample (e.g. 1000)
  percentiles: Percentiles[];    // which percentiles to compute at end of run (e.g. [95, 99])

  // Frame budget
  hz?: number;                   // user's monitor refresh rate (e.g. 60, 144, 240)
                                 // if omitted, auto-detected from first 60 rAF frames
                                 // the derived frameBudget (1000/hz) is the floor —
                                 // longFrameThresholdMs cannot be set below it
  longFrameThresholdMs?: number; // ms above which a frame is counted as "long"
                                 // defaults to frameBudget * 1.2 if omitted
                                 // clamped to >= frameBudget if provided
}
```

`hz` and `longFrameThresholdMs` are both optional. If neither is provided the behavior matches the current auto-detect logic. If `hz` is provided, auto-detection is skipped and `frameBudget = 1000 / hz` is used immediately from frame 1.

---

## RunningStats

Accumulated state updated on every frame. Never stores raw frame times beyond the reservoir.

```ts
interface RunningStats {
  frameIntervals: number[]; // reservoir — at most reservoirSize entries
  longFrames: number;       // exact running count, not approximated from reservoir
  currStep: number;         // total frames seen (n in Algorithm R)
}
```

`longFrames` is a running counter updated incrementally on every frame. It is not reconstructed from the reservoir at the end — reservoir sampling cannot give an exact count.

---

## Hook API

```ts
function usePerformanceMonitor(config: PerformanceMonitorConfig): {
  metrics: PerformanceMetrics;            // live rolling window, recomputed ~1/sec
  getFinalMetrics: () => FinalBenchmarkMetrics; // call once at end of run
}
```

The hook owns the rAF loop, the rolling window, and the RunningStats accumulator. It does not render anything.

---

## PerformanceMetrics (live display)

Recomputed every second from the rolling window. Consumed by the display component.

```ts
interface PerformanceMetrics {
  fps: number;
  hz: number;
  longFrames: number;                        // long frame count within the current window
  percentiles: Partial<Record<Percentiles, number>>; // keyed by configured percentiles
}
```

`percentiles` only contains keys present in `PerformanceMonitorConfig.percentiles`.

---

## FinalBenchmarkMetrics (end of run)

Computed once when `getFinalMetrics()` is called. Sorts the reservoir and reads off the requested percentile indices.

```ts
interface FinalBenchmarkMetrics {
  totalFrames: number;                   // RunningStats.currStep
  avgFps: number;                        // totalFrames / elapsed seconds
  longFrames: number;                    // RunningStats.longFrames (exact)
  hz: number;                            // detected or configured
  percentiles: Record<Percentiles, number>; // computed from sorted reservoir
}
```

---

## File Layout

```
src/
  hooks/
    usePerformanceMonitor.tsx   ← rAF loop, rolling window, RunningStats accumulator
  components/
    PerformanceDisplay.tsx      ← canvas display, consumes usePerformanceMonitor
  types/
    PerformanceMetrics.ts       ← all types defined above
```

`PerformanceDisplay` is one possible consumer of the hook. The same hook could feed a results table, a JSON export, or a cross-run comparison view without any changes to the measurement logic.
