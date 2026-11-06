import { marketInstruments, normalizeGlobalQuote, type GlobalSnapshot } from "./global-markets";
import { yget } from "./yahoo.server";

let cache: GlobalSnapshot | null = null;
let inFlight: Promise<GlobalSnapshot> | null = null;
let checkedAt = 0;
async function loadSnapshot(): Promise<GlobalSnapshot> {
  const raw = new Map<string, Record<string, unknown>>();
  try {
    const result = await yget(`/v7/finance/quote?symbols=${encodeURIComponent(marketInstruments.map((r) => r.symbol).join(","))}`, 30_000);
    for (const row of result?.quoteResponse?.result ?? []) {
      if (typeof row.symbol === "string") raw.set(row.symbol, row);
    }
  } catch {
    // Chart metadata provides a public fallback when the quote API blocks access.
  }
  const missing = marketInstruments.filter((r) => !raw.has(r.symbol));
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(4, missing.length) }, async () => {
    while (cursor < missing.length) {
      const instrument = missing[cursor++];
      if (!instrument) break;
      try {
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(instrument.symbol)}?interval=1d&range=1d`, { signal: AbortSignal.timeout(8_000) });
        if (!response.ok) continue;
        const body = await response.json();
        const meta = body?.chart?.result?.[0]?.meta;
        if (!meta) continue;
        const price = meta.regularMarketPrice;
        // A one-day chart uses the preceding session close as its baseline.
        const baseline = meta.previousClose ?? meta.chartPreviousClose;
        const dailyChange = typeof price === "number" && typeof baseline === "number" ? price - baseline : null;
        raw.set(instrument.symbol, { ...meta, regularMarketChange: dailyChange, regularMarketChangePercent: dailyChange !== null && baseline ? dailyChange / baseline * 100 : null });
      } catch {
        // Each unavailable symbol is shown explicitly, without fabricated prices.
      }
    }
  }));
  const rows = marketInstruments.map((instrument) => {
    const quote = normalizeGlobalQuote(instrument, raw.get(instrument.symbol));
    if (quote.price !== null) return quote;
    const previous = cache?.rows.find((r) => r.symbol === instrument.symbol && r.price !== null);
    return previous ? { ...previous, stale: true } : quote;
  });
  const available = rows.filter((r) => r.price !== null && !r.stale).length;
  return { rows, fetchedAt: new Date().toISOString(), error: available === marketInstruments.length ? null : available === 0 ? "Market quotes could not refresh. Last available quotes are retained where possible." : "Some quotes are temporarily unavailable or could not refresh." };
}
export async function fetchGlobalMarkets(): Promise<GlobalSnapshot> {
  if (cache && Date.now() - checkedAt < 30_000) return cache;
  if (inFlight) return inFlight;
  inFlight = loadSnapshot().then((result) => { cache = result; checkedAt = Date.now(); return result; }).finally(() => { inFlight = null; });
  return inFlight;
}