import { useState } from "react";
import { useMarketFeed } from "./hooks/useMarketFeed";
import { PerformanceMonitor } from "./hooks/usePerformanceMonitor";
import { DEFAULT_CONFIG } from "./lib/marketGenerator";
import type { ScenarioConfig } from "./types/scenarios";
import { RechartsAdapter } from "./adapters/RechartsAdapter";
import { LightweightAdapter } from "./adapters/LightweightAdapter";
import { type ChartAdapterComponent } from "./types/ChartAdapter";
import { type Adapter } from "./types/RunResult";

const BAR_OPTIONS = [1000, 5000, 15_000, 30_000, 60_000];
const TICK_OPTIONS = [16, 100, 250, 500, 1000];
const ADAPTERS: Record<Adapter, ChartAdapterComponent> = {
  lightweight: LightweightAdapter,
  recharts: RechartsAdapter,
};
const CHART_OPTIONS = Object.keys(ADAPTERS) as Adapter[];

export default function App() {
  const [chartOption, setChartOption] = useState<Adapter>("lightweight");
  const { candles, lastEvent, start, pause, resume, reset } = useMarketFeed();
  const [config, setConfig] = useState<ScenarioConfig>({
    ...DEFAULT_CONFIG,
    tickRateMs: 1000,
  });
  const handleBarIntervalChange = (value: number) => {
    setConfig((prev) => ({ ...prev, barIntervalMs: value }));
  };
  const handleTickIntervalChange = (value: number) => {
    setConfig((prev) => ({ ...prev, tickRateMs: value }));
  };
  const handleVolatilityChange = (value: number) => {
    setConfig((prev) => ({ ...prev, volatility: value }));
  };
  const handleDriftChange = (value: number) => {
    setConfig((prev) => ({ ...prev, drift: value }));
  };
  const handleSeedChange = (value: number) => {
    setConfig((prev) => ({ ...prev, seed: value }));
  };

  const Adapter = ADAPTERS[chartOption];
  return (
    <div>
      <label>
        Select chart type:
        <select
          name="chartType"
          value={chartOption}
          onChange={(e) => {
            setChartOption(e.target.value as Adapter);
          }}
        >
          {CHART_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>
      <p>
        Bar Interval Options (sec)
        {BAR_OPTIONS.map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="barInterval"
              checked={config.barIntervalMs === option}
              onChange={() => {
                handleBarIntervalChange(option);
              }}
              value={option}
            ></input>
            {option / 1000} sec
          </label>
        ))}
      </p>
      <p>
        Tick Interval Options (ms)
        {TICK_OPTIONS.map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="tickInterval"
              checked={config.tickRateMs === option}
              onChange={() => {
                handleTickIntervalChange(option);
              }}
              value={option}
            ></input>
            {option} ms
          </label>
        ))}
      </p>
      <label>
        Adjust Drift
        <input
          type="range"
          id="drift"
          value={config.drift}
          onChange={(e) => {
            handleDriftChange(+e.target.value);
          }}
          min={-0.005}
          max={0.005}
          step={0.0001}
        />
      </label>
      <label>
        Adjust Volatility
        <input
          type="range"
          id="volatility"
          value={config.volatility}
          onChange={(e) => {
            handleVolatilityChange(+e.target.value);
          }}
          min={0}
          max={0.01}
          step={0.001}
        />
      </label>
      <input
        type="number"
        value={config.seed}
        placeholder="Enter seed"
        onChange={(e) => {
          handleSeedChange(+e.target.value);
        }}
      />
      <button onClick={() => start(config)}>Start</button>
      <button onClick={() => pause()}>Pause</button>
      <button onClick={() => resume()}>Resume</button>
      <button onClick={() => reset()}>Reset</button>
      <PerformanceMonitor />
      <Adapter candles={candles} event={lastEvent} />
    </div>
  );
}
