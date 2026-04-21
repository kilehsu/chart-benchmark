import { type ChartAdapterProps } from "../types/ChartAdapter";
import {
  Bar,
  BarChart,
  type BarShapeProps,
  CartesianGrid,
  DefaultZIndexes,
  ErrorBar,
  Rectangle,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";
import { memo } from "react";
import { fromCents, type Candle, type Cents } from "../types/candles";

const timestampToMinutes = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getUTCHours()}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
};

const formatDollars = (value: Cents) => `$${fromCents(value).toFixed(2)}`;

const Candlestick = (props: BarShapeProps) => {
  // @ts-expect-error Recharts does spread MarketCandle on the props but the types don't reflect that
  const color = props.open < props.close ? "green" : "red";
  return <Rectangle {...props} fill={color} />;
};

const barDataKey: (entry: Candle) => [number, number] = (entry) => [
  Math.min(entry.close, entry.open),
  Math.max(entry.close, entry.open),
];

const whiskerDataKey: (entry: Candle) => [number, number] = (entry) => {
  const bodyLow = Math.min(entry.close, entry.open);
  const bodyHigh = Math.max(entry.close, entry.open);
  return [bodyLow - entry.low, entry.high - bodyHigh];
};

const TooltipContent = (props: TooltipContentProps) => {
  const { active, payload } = props;
  if (active && payload && payload.length) {
    const entry = payload[0].payload;
    return (
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #ccc",
          padding: "0 1em",
        }}
      >
        <p style={{ margin: 0 }}>{`Time: ${timestampToMinutes(entry.time)}`}</p>
        <p style={{ margin: 0 }}>{`Open: ${formatDollars(entry.open)}`}</p>
        <p style={{ margin: 0 }}>{`Close: ${formatDollars(entry.close)}`}</p>
        <p style={{ margin: 0 }}>{`Low: ${formatDollars(entry.low)}`}</p>
        <p style={{ margin: 0 }}>{`High: ${formatDollars(entry.high)}`}</p>
      </div>
    );
  }
  return null;
};

export const RechartsAdapter = memo(function RechartsAdapter({
  candles,
  event: _event,
}: ChartAdapterProps) {
  return (
    <BarChart data={candles} width={700} height={433}>
      <XAxis dataKey="time" tickFormatter={timestampToMinutes} />
      <YAxis
        domain={["dataMin - 1", "dataMax + 1"]}
        tickFormatter={formatDollars}
      />
      <CartesianGrid vertical={false} />
      <Bar dataKey={barDataKey} shape={Candlestick} isAnimationActive={false}>
        <ErrorBar
          dataKey={whiskerDataKey}
          width={0}
          zIndex={DefaultZIndexes.bar - 1}
          isAnimationActive={false}
        />
      </Bar>
      <Tooltip content={TooltipContent} />
    </BarChart>
  );
});
