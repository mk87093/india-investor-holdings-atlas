import { lastDay, mithunSignals, type Candle } from "./breakout";
import type { FnoRow } from "./fno.functions";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
let syms: { list: string[]; at: number } | null = null;
let cache: { data: { stocks: FnoRow[]; scanned: number; total: number; at: string }; at: number } | null = null;
const INDICES = new Set(["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY", "NIFTYNXT50", "SYMBOL"]);

async function fnoSymbols() {
  if (syms && Date.now() - syms.at < 6 * 3600_000) return syms.list;
  const r = await fetch("https://nsearchives.nseindia.com/content/fo/fo_mktlots.csv", { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error("fno list " + r.status);
  const list = [...new Set((await r.text()).split("\n").map((l) => l.split(",")[1]?.trim().toUpperCase() ?? "").filter((s) => /^[A-Z0-9&-]+$/.test(s) && !INDICES.has(s)))];
  syms = { list, at: Date.now() };
  return list;
}

async function candles(symbol: string): Promise<Candle[]> {
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol + ".NS")}?interval=5m&range=1d`, { headers: { "User-Agent": UA } });
  if (!r.ok) return [];
  const j: any = await r.json();
  const res = j?.chart?.result?.[0];
  const q = res?.indicators?.quote?.[0] ?? {};
  const out: Candle[] = [];
  (res?.timestamp ?? []).forEach((time: number, i: number) => {
    const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i];
    if ([o, h, l, c].every((v) => typeof v === "number")) out.push({ time: time + 19800, open: o, high: h, low: l, close: c, volume: q.volume?.[i] ?? 0 });
  });
  return lastDay(out);
}

function row(symbol: string, c: Candle[]): FnoRow | null {
  if (c.length < 2) return null;
  const ltp = c.at(-1)!.close;
  const dayHigh = Math.max(...c.map((x) => x.high)), dayLow = Math.min(...c.map((x) => x.low));
  const vols = c.map((x) => x.volume).filter((v) => v > 0);
  const avg = vols.length ? vols.reduce((a, b) => a + b, 0) / vols.length : 0;
  const recent = c.slice(-6).map((x) => x.volume);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  return {
    symbol, ltp, dayHigh, dayLow,
    fromLowPct: ((ltp - dayLow) / dayLow) * 100, fromHighPct: ((dayHigh - ltp) / dayHigh) * 100,
    volRatio: avg ? recentAvg / avg : null, updated: c.at(-1)!.time, candles: c,
    threeBuy: mithunSignals(c, "BUY"), threeSell: mithunSignals(c, "SELL"),
  };
}

export async function fnoScan() {
  if (cache && Date.now() - cache.at < 50_000) return cache.data;
  const list = await fnoSymbols();
  const stocks: FnoRow[] = [];
  let i = 0;
  await Promise.all(Array.from({ length: 10 }, async () => {
    while (i < list.length) {
      const s = list[i++]!;
      try { const r = row(s, await candles(s)); if (r) stocks.push(r); } catch { /* skip */ }
    }
  }));
  const data = { stocks, scanned: stocks.length, total: list.length, at: new Date().toISOString() };
  cache = { data, at: Date.now() };
  return data;
}
