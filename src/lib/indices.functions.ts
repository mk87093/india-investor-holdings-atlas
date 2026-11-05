import { createServerFn } from "@tanstack/react-start";

const LIST = [
  { sym: "^NSEI", name: "NIFTY 50" },
  { sym: "^NSEBANK", name: "BANK NIFTY" },
  { sym: "^BSESN", name: "SENSEX" },
  { sym: "^INDIAVIX", name: "INDIA VIX" },
];
let cache: { at: number; data: IndexQuote[] } | null = null;
export type IndexQuote = { name: string; price: number | null; change: number | null; changePct: number | null };

export const getIndices = createServerFn({ method: "GET" }).handler(async (): Promise<IndexQuote[]> => {
  if (cache && Date.now() - cache.at < 10_000) return cache.data;
  try {
    const { yget } = await import("./yahoo.server");
    const j = await yget(`/v7/finance/quote?symbols=${encodeURIComponent(LIST.map((l) => l.sym).join(","))}`);
    const rows: any[] = j?.quoteResponse?.result ?? [];
    const data = LIST.map((l) => {
      const q = rows.find((r) => r.symbol === l.sym);
      return { name: l.name, price: q?.regularMarketPrice ?? null, change: q?.regularMarketChange ?? null, changePct: q?.regularMarketChangePercent ?? null };
    });
    cache = { at: Date.now(), data };
    return data;
  } catch (e) {
    console.error("indices", e);
    return cache?.data ?? LIST.map((l) => ({ name: l.name, price: null, change: null, changePct: null }));
  }
});
