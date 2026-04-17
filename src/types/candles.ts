// Phantom branded type — prevents accidentally passing raw dollar floats where
// integer cents are expected. At runtime this is just a number.
export type Cents = number & { readonly __brand: "Cents" };

export function toCents(dollars: number): Cents {
  return Math.round(dollars * 100) as Cents;
}

export function fromCents(cents: Cents): number {
  return cents / 100;
}

// All price fields are stored in integer cents to avoid floating point errors.
// time is a Unix timestamp in milliseconds (Date.now()).
// volume is a whole-unit integer count (shares / contracts).
export interface Candle {
  time: number;
  open: Cents;
  high: Cents;
  low: Cents;
  close: Cents;
  volume: number;
}

export interface CandleEvent {
  type: "new" | "update";
  candle: Candle;
}
