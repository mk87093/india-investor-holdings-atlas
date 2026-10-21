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

// Mithun 3-candle setup (one setup can fire once; max 2 signals per side per day).
// BUY: green candle followed by 3+ reds (or 2 big reds, body >= 1.5x day's avg body),
// then a close above the green candle's body high. 2nd BUY level must be below the 1st.
// SELL mirrors it: red candle, 3+ greens (or 2 big greens), close below body low; 2nd SELL above 1st.
export type MSignal = { t: number; level: number; price: number };
export function mithunSignals(c: Candle[], side: "BUY" | "SELL"): MSignal[] {
  const body = (x: Candle) => Math.abs(x.close - x.open);
  const avg = c.length ? c.reduce((a, x) => a + body(x), 0) / c.length : 0;
  const green = (x: Candle) => x.close > x.open, red = (x: Candle) => x.close < x.open;
  const [setupOk, oppOk] = side === "BUY" ? [green, red] : [red, green];
  const out: MSignal[] = [];
  let usedUntil = -1;
  for (let i = 0; i < c.length - 2 && out.length < 2; i++) {
    const s = c[i]!;
    if (!setupOk(s)) continue;
    let n = 0;
    while (i + 1 + n < c.length && oppOk(c[i + 1 + n]!)) n++;
    const big = n >= 2 && body(c[i + 1]!) >= 1.5 * avg && body(c[i + 2]!) >= 1.5 * avg;
    if (n < 3 && !big) continue;
    const level = side === "BUY" ? Math.max(s.open, s.close) : Math.min(s.open, s.close);
    if (out.length === 1 && (side === "BUY" ? level >= out[0]!.level : level <= out[0]!.level)) continue;
    for (let j = i + 1 + n; j < c.length; j++) {
      const k = c[j]!;
      if (side === "BUY" ? k.close > level : k.close < level) {
        if (j > usedUntil) { out.push({ t: k.time, level, price: k.close }); usedUntil = j; }
        break;
      }
    }
  }
  return out;
}
