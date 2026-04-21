import { type ScenarioConfig } from "./scenarios";
import { type PerformanceMetrics } from "./PerformanceMetrics";

export type Adapter = "recharts" | "lightweight";

export interface RunResult {
  adapter: Adapter;
  timestamp: number;
  config: ScenarioConfig;
  metrics: PerformanceMetrics;
}
