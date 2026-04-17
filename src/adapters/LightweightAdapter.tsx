import { useRef, useEffect } from "react";
import {
  createChart,
  CandlestickSeries,
  type ISeriesApi,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { type Candle, fromCents } from "../types/candles";
import { type ChartAdapterProps } from "../types/ChartAdapter";

const toChartCandle = (c: Candle) => ({
  time: (c.time / 1000) as UTCTimestamp,
  open: fromCents(c.open),
  high: fromCents(c.high),
  low: fromCents(c.low),
  close: fromCents(c.close),
});

export function LightweightAdapter({ candles, event }: ChartAdapterProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  useEffect(() => {
    chartInstanceRef.current = createChart(chartRef.current);
    seriesRef.current = chartInstanceRef.current.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });
    seriesRef.current.setData(candles.map((candle) => toChartCandle(candle)));

    return () => {
      chartInstanceRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (event === null || seriesRef.current === null) return;
    seriesRef.current.update(toChartCandle(event.candle));
  }, [event]);

  return <div ref={chartRef} style={{ width: "600px", height: "400px" }} />;
}
