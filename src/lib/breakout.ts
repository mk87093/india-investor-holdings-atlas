// 3-candle breakout logic on 5-min candles (browser-safe, shared).
export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };
export type Signal = { side: "BUY" | "SELL"; setupTime: number; signalTime: number; level: number };

// BUY: green candle, then 3 red candles, then a close above the green candle's high.
// SELL: red candle, then 3 green candles, then a close below the red candle's low.
export function findSignals(c: Candle[]): Signal[] {
  const out: Signal[] = [];
  const seen = new Set<string>();
  for (let i = 0; i <= c.length - 5; i++) {
    const s = c[i]!;
    const next = c.slice(i + 1, i + 4);
    const buy = s.close > s.open && next.every((x) => x.close < x.open);
    const sell = s.close < s.open && next.every((x) => x.close > x.open);
    if (!buy && !sell) continue;
    const side = buy ? "BUY" : "SELL";
    const level = buy ? s.high : s.low;
    for (let j = i + 4; j < c.length; j++) {
      const k = c[j]!;
      if (buy ? k.close > level : k.close < level) {
        const key = `${side}-${k.time}`;
        if (!seen.has(key)) { out.push({ side, setupTime: s.time, signalTime: k.time, level }); seen.add(key); }
        break;
      }
    }
  }
  return out.sort((a, b) => a.signalTime - b.signalTime);
}

export function lastDay(c: Candle[]): Candle[] {
  const last = c[c.length - 1];
  if (!last) return [];
  const d = Math.floor((last.time + 19800) / 86400);
  return c.filter((x) => Math.floor((x.time + 19800) / 86400) === d);
}

export const latestSignal = (c: Candle[]) => findSignals(lastDay(c)).at(-1) ?? null;
