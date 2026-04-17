import { type Candle, type CandleEvent } from "./candles";
import { type ComponentType } from "react";

export interface ChartAdapterProps {
  candles: Candle[];
  event: CandleEvent | null;
}

export type ChartAdapterComponent = ComponentType<ChartAdapterProps>;
