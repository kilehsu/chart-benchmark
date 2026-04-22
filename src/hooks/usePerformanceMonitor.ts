import {
  type FinalBenchmarkMetrics,
  type PerformanceMetrics,
  type PerformanceMetricsConfig,
  type RunningStats,
  type Percentiles,
} from "../types/PerformanceMetrics";
import { useEffect, useRef, useState } from "react";

const STANDARD_HZ = [60, 90, 120, 144, 165, 240, 360];
const MAX_WINDOW_FRAMES = 300;

function snapToRefreshRate(avgIntervalMs: number): number {
  const measured = 1000 / avgIntervalMs;
  return STANDARD_HZ.reduce((closest, hz) =>
    Math.abs(hz - measured) < Math.abs(closest - measured) ? hz : closest,
  );
}

function computeMetrics(
  times: number[],
  percentiles: number[],
  frameBudget: number,
): PerformanceMetrics {
  if (times.length === 0) {
    return { fps: 0, longFrames: 0, percentiles: {}, hz: 0 };
  }

  const sorted = [...times].sort((a, b) => a - b);

  return {
    fps: Math.round(1000 / (times.reduce((a, b) => a + b, 0) / times.length)),
    percentiles: Object.fromEntries(
      percentiles.map((perc) => [
        perc,
        sorted[Math.floor((perc / 100) * sorted.length)],
      ]),
    ) as Partial<Record<(typeof percentiles)[number], number>>,
    longFrames: times.filter((t) => t > frameBudget * 1.2).length,
    hz: snapToRefreshRate(frameBudget),
  };
}

function computeFinalMetrics(
  runningStats: RunningStats,
  config: PerformanceMetricsConfig,
  detectedHz: number,
  startTime: number,
): FinalBenchmarkMetrics {
  const sorted = [...runningStats.frameIntervals].sort((a, b) => a - b);
  const elapsedSeconds = (performance.now() - startTime) / 1000;
  return {
    totalFrames: runningStats.currStep,
    avgFps: runningStats.currStep / elapsedSeconds,
    longFrames: runningStats.longFrames,
    hz: config.hz ?? detectedHz,
    percentiles: Object.fromEntries(
      config.percentiles.map((perc) => [
        perc,
        sorted[Math.floor((perc / 100) * sorted.length)],
      ]),
    ) as Record<Percentiles, number>,
  };
}

export function usePerformanceMonitor(config: PerformanceMetricsConfig): {
  metrics: PerformanceMetrics;
  getFinalMetrics: () => FinalBenchmarkMetrics;
} {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    longFrames: 0,
    hz: 0,
    percentiles: {},
  });
  const reqAnimationId = useRef<number | null>(null);
  const intervalId = useRef<number | null>(null);
  const lastTimestamp = useRef<number>(performance.now());
  const startTime = useRef<number>(performance.now());
  const frameTimes = useRef<number[]>([]);
  const frameBudget = useRef<number | undefined>(
    config.hz !== undefined ? 1000 / config.hz : undefined,
  );
  const detectedHz = useRef<number>(60);
  const runningStatsRef = useRef<RunningStats>({
    frameIntervals: [],
    longFrames: 0,
    currStep: 0,
  });
  useEffect(() => {
    function measurePerf(timestamp: number) {
      const interval = timestamp - lastTimestamp.current;
      frameTimes.current.push(interval);
      if (frameTimes.current.length > MAX_WINDOW_FRAMES) {
        frameTimes.current.shift();
      }

      if (
        runningStatsRef.current.frameIntervals.length < config.reservoirSize
      ) {
        runningStatsRef.current.frameIntervals.push(interval);
      } else {
        const idx = Math.floor(
          runningStatsRef.current.currStep * Math.random(),
        );
        if (idx < runningStatsRef.current.frameIntervals.length) {
          runningStatsRef.current.frameIntervals[idx] = interval;
        }
      }
      runningStatsRef.current.currStep++;
      const step = runningStatsRef.current.currStep;
      if (frameBudget.current === undefined && step === 65) {
        const sample = frameTimes.current.slice(-60);
        const avg = sample.reduce((a, b) => a + b) / sample.length;
        const snappedHz = snapToRefreshRate(avg);
        detectedHz.current = snappedHz;
        frameBudget.current = 1000 / snappedHz;
      }

      const threshold =
        config.longFrameThresholdMs ??
        (frameBudget.current !== undefined
          ? frameBudget.current * 1.2
          : undefined);
      if (threshold !== undefined && interval >= threshold) {
        runningStatsRef.current.longFrames += 1;
      }

      lastTimestamp.current = timestamp;
      reqAnimationId.current = requestAnimationFrame(measurePerf);
    }

    reqAnimationId.current = requestAnimationFrame(measurePerf);

    return () => {
      if (reqAnimationId.current !== null) {
        cancelAnimationFrame(reqAnimationId.current);
      }
    };
  }, []);

  useEffect(() => {
    intervalId.current = setInterval(() => {
      const result = computeMetrics(
        frameTimes.current,
        config.percentiles,
        frameBudget.current,
      );

      setMetrics(result);
    }, 1000);

    return () => {
      if (intervalId.current !== null) {
        clearInterval(intervalId.current);
      }
    };
  }, []);

  return {
    metrics,
    getFinalMetrics: () =>
      computeFinalMetrics(
        runningStatsRef.current,
        config,
        detectedHz.current,
        startTime.current,
      ),
  };
}
