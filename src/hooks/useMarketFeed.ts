import { useRef, useEffect, useState } from "react";
import { type WorkerMessage } from "../types/workers";
import { type ScenarioConfig } from "../types/scenarios";
import MarketFeedWorker from "../workers/marketFeed.worker.ts?worker";
import { type Candle } from "../types/candles";

export function useMarketFeed() {
  const worker = useRef<InstanceType<typeof MarketFeedWorker> | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);

  function start(config: ScenarioConfig) {
    if (worker.current === null) {
      return;
    } else {
      worker.current.postMessage({ type: "start", config });
    }
  }

  function pause() {
    if (worker.current === null) {
      return;
    } else {
      worker.current.postMessage({ type: "pause" });
    }
  }

  function resume() {
    if (worker.current === null) {
      return;
    } else {
      worker.current.postMessage({ type: "resume" });
    }
  }

  function reset() {
    if (worker.current === null) {
      return;
    } else {
      worker.current.postMessage({ type: "reset" });
      setCandles([]);
    }
  }
  useEffect(() => {
    worker.current = new MarketFeedWorker();
    worker.current.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      switch (msg.type) {
        case "ready":
          break;
        case "candle":
          if (msg.event.type === "new") {
            setCandles((prev) => [...prev, msg.event.candle]);
          } else {
            setCandles((prev) => [...prev.slice(0, -1), msg.event.candle]);
          }
          break;
        case "error":
          break;
      }
    };

    return () => {
      worker.current!.onmessage = null;
      worker.current!.terminate();
      worker.current = null;
    };
  }, []);

  return { candles, start, pause, resume, reset };
}
