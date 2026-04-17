import {
  type Candle,
  type CandleEvent,
  type Cents,
  toCents,
} from "../types/candles";

export interface MarketGeneratorConfig {
  // How long each candle covers in milliseconds (e.g. 60_000 = 1-minute bars)
  barIntervalMs: number;
  // Per-tick drift: the average price change as a fraction of current price.
  // Positive = upward trend, negative = downward, 0 = random walk.
  drift: number;
  // Per-tick volatility: standard deviation of price changes as a fraction of current price.
  volatility: number;
  // Seed for the PRNG — same seed always produces the same sequence.
  seed: number;
}

export const DEFAULT_CONFIG: MarketGeneratorConfig = {
  barIntervalMs: 60_000,
  drift: 0,
  volatility: 0.001,
  seed: 1,
};

// Mulberry32 — a fast, seedable pseudo-random number generator.
// Returns a function that produces uniform values in [0, 1), identical to
// Math.random() in usage but fully deterministic given the same seed.
function mulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller transform — converts two independent uniform samples (u1, u2)
// into one standard-normal sample z (mean=0, stdDev=1).
// Multiplying z by volatility and adding drift gives a realistic price change.
function boxMuller(rand: () => number): number {
  const u1 = rand();
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export interface MarketGenerator {
  // Advance the simulation by one tick at the given timestamp.
  // Returns a CandleEvent — either 'new' (bar just opened) or 'update' (current bar changed).
  tick(nowMs: number): CandleEvent;
  // Reset internal state back to the initial condition using the same config.
  reset(): void;
}

export function createMarketGenerator(
  config: Partial<MarketGeneratorConfig> = {},
): MarketGenerator {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Starting price hardcoded to $150.00 (in cents) for now
  const START_PRICE_CENTS: Cents = toCents(150.0);

  let rand = mulberry32(cfg.seed);
  let currentPriceCents: Cents = START_PRICE_CENTS;
  let currentBar: Candle | null = null;
  let barStartMs = 0;

  function openNewBar(nowMs: number): Candle {
    return {
      time: nowMs,
      open: currentPriceCents,
      high: currentPriceCents,
      low: currentPriceCents,
      close: currentPriceCents,
      volume: 0,
    };
  }

  function tick(nowMs: number): CandleEvent {
    // Advance price using geometric random walk:
    //   nextPrice = currentPrice * (1 + drift + volatility * z)
    // where z is a standard-normal sample from Box-Muller.
    const z = boxMuller(rand);
    const changeFraction = cfg.drift + cfg.volatility * z;
    const nextPriceCents = Math.round(
      currentPriceCents * (1 + changeFraction),
    ) as Cents;

    // Clamp to 1 cent so price never goes zero or negative
    currentPriceCents = Math.max(1, nextPriceCents) as Cents;

    // Simulate a volume contribution for this tick (1–100 units)
    const tickVolume = Math.max(1, Math.round(boxMuller(rand) * 20 + 40));

    // Open the very first bar
    if (currentBar === null) {
      barStartMs = nowMs;
      currentBar = openNewBar(nowMs);
    }

    // Check if the current bar's interval has elapsed
    const barElapsed = nowMs - barStartMs >= cfg.barIntervalMs;

    if (barElapsed) {
      // Close the old bar and open a new one
      barStartMs = nowMs;
      currentBar = openNewBar(nowMs);
      currentBar.volume = tickVolume;

      return { type: "new", candle: { ...currentBar } };
    }

    // Update the current bar in place
    currentBar.close = currentPriceCents;
    currentBar.high = Math.max(currentBar.high, currentPriceCents) as Cents;
    currentBar.low = Math.min(currentBar.low, currentPriceCents) as Cents;
    currentBar.volume += tickVolume;

    return { type: "update", candle: { ...currentBar } };
  }

  function reset(): void {
    rand = mulberry32(cfg.seed);
    currentPriceCents = START_PRICE_CENTS;
    currentBar = null;
    barStartMs = 0;
  }

  return { tick, reset };
}
