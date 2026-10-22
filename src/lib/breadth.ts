export type BreadthQuote = {
  symbol?: string;
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketChange?: number;
  regularMarketTime?: number;
};

export type MarketBreadth = {
  total: number; covered: number; advances: number; declines: number; unchanged: number;
  missing: number; latestQuoteAt: number | null;
};

export function marketBreadth(symbols: string[], quotes: BreadthQuote[]): MarketBreadth {
  const members = new Set(symbols);
  const seen = new Set<string>();
  const result: MarketBreadth = { total: members.size, covered: 0, advances: 0, declines: 0, unchanged: 0, missing: members.size, latestQuoteAt: null };
  for (const quote of quotes) {
    const symbol = quote.symbol?.replace(/\.NS$/, "");
    if (!symbol || !members.has(symbol) || seen.has(symbol)) continue;
    const price = quote.regularMarketPrice;
    const previous = quote.regularMarketPreviousClose;
    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) continue;
    const change = typeof previous === "number" && Number.isFinite(previous) && previous > 0
      ? price - previous : quote.regularMarketChange;
    if (typeof change !== "number" || !Number.isFinite(change)) continue;
    seen.add(symbol);
    result.covered++;
    if (change > 0) result.advances++;
    else if (change < 0) result.declines++;
    else result.unchanged++;
    if (typeof quote.regularMarketTime === "number" && Number.isFinite(quote.regularMarketTime)) {
      result.latestQuoteAt = Math.max(result.latestQuoteAt ?? 0, quote.regularMarketTime);
    }
  }
  result.missing = result.total - result.covered;
  return result;
}