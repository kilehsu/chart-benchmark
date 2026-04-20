import { type PerformanceMetrics } from "../types/PerformanceMetrics";
import { useState, useEffect, useRef } from "react";

const STANDARD_HZ = [60, 90, 120, 144, 165, 240, 360];

function snapToRefreshRate(avgIntervalMs: number): number {
  const measured = 1000 / avgIntervalMs;
  return STANDARD_HZ.reduce((closest, hz) =>
    Math.abs(hz - measured) < Math.abs(closest - measured) ? hz : closest
  );
}

function computeMetrics(
  times: number[],
  frameBudget: number,
  totalLongFrames: number,
): PerformanceMetrics {
  if (times.length === 0) {
    return { fps: 0, p95FrameMs: 0, longFrames: 0, totalLongFrames, hz: 0 };
  }

  const sorted = [...times].sort((a, b) => a - b);
  const p95Index = Math.floor(0.95 * sorted.length);
  const hz = snapToRefreshRate(frameBudget);
  const longFrames = times.filter((t) => t > frameBudget * 2).length;

  return {
    fps: Math.round(1000 / (times.reduce((a, b) => a + b, 0) / times.length)),
    p95FrameMs: sorted[p95Index],
    longFrames,
    totalLongFrames: totalLongFrames + longFrames,
    hz,
  };
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    p95FrameMs: 0,
    longFrames: 0,
    totalLongFrames: 0,
    hz: 0,
  });
  const reqAnimationId = useRef<number | null>(null);
  const intervalId = useRef<number | null>(null);
  const lastTimestamp = useRef<number>(performance.now());
  const frameTimes = useRef<number[]>([]);
  const frameBudget = useRef<number>(16.67);
  const totalLongFrames = useRef<number>(0);

  useEffect(() => {
    function measurePerf(timestamp: number) {
      const interval = timestamp - lastTimestamp.current;
      frameTimes.current.push(interval);

      // Skip first 5 frames (startup noise), then lock in refresh rate from next 60
      const count = frameTimes.current.length;
      if (count > 5 && count === 65) {
        const sample = frameTimes.current.slice(5, 65);
        const avg = sample.reduce((a, b) => a + b) / sample.length;
        const snappedHz = snapToRefreshRate(avg);
        frameBudget.current = 1000 / snappedHz;
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
        frameBudget.current,
        totalLongFrames.current,
      );
      totalLongFrames.current = result.totalLongFrames;
      setMetrics(result);
      frameTimes.current = [];
    }, 1000);

    return () => {
      if (intervalId.current !== null) {
        clearInterval(intervalId.current);
      }
    };
  }, []);

  return { metrics };
}
