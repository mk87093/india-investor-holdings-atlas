import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

export type ScanRow = {
  symbol: string; name: string; price: number; open: number; changeFromOpen: number;
  changePct: number; volume: number; avgVolume: number; volRatio: number; turnoverCr: number;
};

export const runCashScan = createServerFn({ method: "POST" })
  .inputValidator(z.object({ minUp: z.number().min(0).max(50), minTurnoverCr: z.number().min(0), minVolRatio: z.number().min(0) }))
  .handler(async ({ data }) => {
    const { scanRows } = await import("./scanner.server");
    const { quoteSnapshot } = await import("./breadth.server");
    try {
      const snapshot = await quoteSnapshot();
      const rows = scanRows(snapshot.cashQuotes);
      const hits = rows
        .filter((r) => r.changeFromOpen >= data.minUp && r.turnoverCr >= data.minTurnoverCr && r.volRatio >= data.minVolRatio)
        .sort((a, b) => b.changeFromOpen - a.changeFromOpen);
      return { rows: hits, scanned: snapshot.cash.covered, fnoExcluded: snapshot.fnoExcluded, at: snapshot.at, error: snapshot.error };
    } catch (e) {
      console.error(e);
      return { rows: [] as ScanRow[], scanned: 0, fnoExcluded: 0, at: new Date().toISOString(), error: "Market data abhi available nahi hai, thodi der baad try karein." };
    }
  });

export const getCandles = createServerFn({ method: "GET" })
  .inputValidator(z.object({ symbol: z.string().regex(/^[A-Z0-9&-]{1,20}$/) }))
  .handler(async ({ data }) => {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(data.symbol + ".NS")}?interval=5m&range=5d`, { headers: { "User-Agent": UA } });
    if (!r.ok) return [];
    const j: any = await r.json();
    const res = j?.chart?.result?.[0];
    const t: number[] = res?.timestamp ?? [];
    const q = res?.indicators?.quote?.[0] ?? {};
    const out: { time: number; open: number; high: number; low: number; close: number; volume: number }[] = [];
    t.forEach((time, i) => {
      const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i];
      if ([o, h, l, c].every((v) => typeof v === "number")) out.push({ time: time + 19800, open: o, high: h, low: l, close: c, volume: q.volume?.[i] ?? 0 });
    });
    return out;
  });
