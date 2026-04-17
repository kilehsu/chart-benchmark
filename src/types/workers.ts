import { type CandleEvent } from "./candles";
import { type ScenarioConfig } from "./scenarios";

// Worker -> Main thread
export type WorkerMessage =
  | { type: "ready" }
  | { type: "candle"; event: CandleEvent }
  | { type: "error"; message: string };

// Main thread -> Worker
export type WorkerCommand =
  | { type: "start"; config: ScenarioConfig }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "reset" };
