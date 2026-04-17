import { type ChartAdapterProps } from "../types/ChartAdapter";
import { Line, LineChart, XAxis, YAxis, Tooltip } from "recharts";
import { useMemo } from "react";
import { fromCents } from "../types/candles";

export function RechartsAdapter({ candles, event: _event }: ChartAdapterProps) {
  const data = useMemo(
    () =>
      candles.map((candle) => {
        const ts = new Date(candle.time);
        return {
          ts: ts.toLocaleTimeString(),
          close: fromCents(candle.close),
        };
      }),
    [candles],
  );
  return (
    <LineChart
      data={data}
      style={{ width: "100%", aspectRatio: 1.618, maxWidth: 600 }}
    >
      <Line dataKey="close" />
      <XAxis dataKey="ts" />
      <YAxis label={{ value: "close", position: "insideLeft", angle: -90 }} />
      <Tooltip />
    </LineChart>
  );
}
