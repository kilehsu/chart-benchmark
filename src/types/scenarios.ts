import { type MarketGeneratorConfig } from "../lib/marketGenerator";

export interface ScenarioConfig extends MarketGeneratorConfig {
  tickRateMs: number;
}
