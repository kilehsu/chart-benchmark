import { usePerformanceMonitor } from "../hooks/usePerformanceMonitor";
import { type PerformanceMetricsConfig } from "../types/PerformanceMetrics";
import { useRef, useEffect } from "react";

export function PerformanceMonitor(config: PerformanceMetricsConfig) {
  const { metrics, getFinalMetrics } = usePerformanceMonitor(config);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const ctx = canvas.getContext("2d");
    if (ctx === null) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "14px monospace";
    ctx.fillStyle = "#111";
    ctx.fillText(`FPS: ${metrics.fps}`, 10, 20);
    let finalIdx = 0;
    Object.entries(metrics.percentiles).forEach(([perc, val], idx) => {
      ctx.fillText(`p${perc}: ${val.toFixed(2)}ms`, 10, 20 * (idx + 2));
      finalIdx = idx;
    });
    ctx.fillText(`Long frames: ${metrics.longFrames}`, 10, 20 * (finalIdx + 3));
    ctx.fillText(`Hz: ${metrics.hz}`, 10, 20 * (finalIdx + 4));
  }, [metrics]);

  const canvasHeight = 20 * (Object.keys(metrics.percentiles).length + 3) + 20;
  return <canvas ref={canvasRef} width={220} height={canvasHeight} />;
}
