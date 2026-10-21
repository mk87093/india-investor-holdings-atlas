import { createServerFn } from "@tanstack/react-start";
import type { Candle, MSignal } from "./breakout";

export type FnoRow = {
  symbol: string; ltp: number; dayHigh: number; dayLow: number; fromLowPct: number; fromHighPct: number;
  volRatio: number | null; updated: number; candles: Candle[]; threeBuy: MSignal[]; threeSell: MSignal[];
};

export const runFnoScan = createServerFn({ method: "GET" }).handler(async () => {
  const { fnoScan } = await import("./fno.server");
  try { return { ...(await fnoScan()), error: null as string | null }; }
  catch (e) { console.error(e); return { stocks: [] as FnoRow[], scanned: 0, total: 0, at: new Date().toISOString(), error: "Market data abhi available nahi hai." }; }
});
