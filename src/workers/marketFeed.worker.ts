import {
  createMarketGenerator,
  type MarketGenerator,
} from "../lib/marketGenerator";
import { type WorkerCommand, type WorkerMessage } from "../types/workers";
import { type ScenarioConfig } from "../types/scenarios";

function startTicking() {
  const event = generator!.tick(Date.now());
  self.postMessage({ type: "candle", event } satisfies WorkerMessage);
}

let generator: MarketGenerator | null = null;
let config: ScenarioConfig | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
self.onmessage = (e: MessageEvent<WorkerCommand>): void => {
  switch (e.data.type) {
    case "start":
      if (intervalId != null) {
        break;
      }
      config = e.data.config;
      generator = createMarketGenerator(config);
      intervalId = setInterval(startTicking, e.data.config.tickRateMs);
      break;
    case "pause":
      clearInterval(intervalId);
      intervalId = null;
      break;
    case "reset":
      if (config === null || generator === null) {
        break;
      }
      clearInterval(intervalId);
      intervalId = null;
      generator.reset();
      break;
    case "resume":
      if (intervalId != null || config === null || generator === null) {
        break;
      }
      intervalId = setInterval(startTicking, config.tickRateMs);
  }
};
