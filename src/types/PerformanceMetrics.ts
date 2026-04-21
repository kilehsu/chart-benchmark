export type Percentiles = 90 | 95 | 99 | 99.5;

export interface PerformanceMetrics {
  fps: number;
  p95FrameMs: number;
  longFrames: number;
  hz: number;
}

export interface PerformanceMetricsConfig {
  reservoirSize: number; // Number of frames to keep in the sample for final calculation(e.g. 1000)
  percentiles: Percentiles[]; // Which percentiles to compute and display during and at end of the run (e.g. [90, 95, 99, 99.5])
  hz?: number;
  longFrameThresholdMs?: number;
}

export interface RunningStats {
  frameIntervals: number[];
  longFrames: number;
  currStep: number;
}
