export const marketCategories = [
  { id: "indices", label: "Global Indices" },
  { id: "bonds", label: "Bonds & Yields" },
  { id: "commodities", label: "Commodities" },
  { id: "crypto", label: "Crypto" },
  { id: "forex", label: "Forex" },
] as const;
export type MarketCategory = (typeof marketCategories)[number]["id"];
export type MarketInstrument = { symbol: string; name: string; region: string; category: MarketCategory; unit: string; kind: "index" | "yield" | "futures" | "spot" };
export const marketInstruments: MarketInstrument[] = [
  { symbol: "^DJI", name: "Dow Jones", region: "US", category: "indices", unit: "points", kind: "index" },
  { symbol: "^GSPC", name: "S&P 500", region: "US", category: "indices", unit: "points", kind: "index" },
  { symbol: "^IXIC", name: "Nasdaq Composite", region: "US", category: "indices", unit: "points", kind: "index" },
  { symbol: "^N225", name: "Nikkei 225", region: "Japan", category: "indices", unit: "points", kind: "index" },
  { symbol: "^HSI", name: "Hang Seng", region: "Hong Kong", category: "indices", unit: "points", kind: "index" },
  { symbol: "000001.SS", name: "Shanghai Composite", region: "China", category: "indices", unit: "points", kind: "index" },
  { symbol: "^FTSE", name: "FTSE 100", region: "UK", category: "indices", unit: "points", kind: "index" },
  { symbol: "^GDAXI", name: "DAX", region: "Germany", category: "indices", unit: "points", kind: "index" },
  { symbol: "^FCHI", name: "CAC 40", region: "France", category: "indices", unit: "points", kind: "index" },
  { symbol: "^STOXX50E", name: "Euro Stoxx 50", region: "Europe", category: "indices", unit: "points", kind: "index" },
  { symbol: "^AXJO", name: "ASX 200", region: "Australia", category: "indices", unit: "points", kind: "index" },
  { symbol: "^KS11", name: "KOSPI", region: "South Korea", category: "indices", unit: "points", kind: "index" },
  { symbol: "^IRX", name: "US 13-week Treasury Yield", region: "US", category: "bonds", unit: "% yield", kind: "yield" },
  { symbol: "^FVX", name: "US 5-year Treasury Yield", region: "US", category: "bonds", unit: "% yield", kind: "yield" },
  { symbol: "^TNX", name: "US 10-year Treasury Yield", region: "US", category: "bonds", unit: "% yield", kind: "yield" },
  { symbol: "^TYX", name: "US 30-year Treasury Yield", region: "US", category: "bonds", unit: "% yield", kind: "yield" },
  { symbol: "ZB=F", name: "US Treasury Bond Futures", region: "CBOT", category: "bonds", unit: "points", kind: "futures" },
  { symbol: "BZ=F", name: "Brent Crude", region: "Global", category: "commodities", unit: "USD/barrel", kind: "futures" },
  { symbol: "CL=F", name: "WTI Crude", region: "US", category: "commodities", unit: "USD/barrel", kind: "futures" },
  { symbol: "NG=F", name: "Natural Gas", region: "US", category: "commodities", unit: "USD/MMBtu", kind: "futures" },
  { symbol: "GC=F", name: "Gold", region: "Global", category: "commodities", unit: "USD/oz", kind: "futures" },
  { symbol: "SI=F", name: "Silver", region: "Global", category: "commodities", unit: "USD/oz", kind: "futures" },
  { symbol: "HG=F", name: "Copper", region: "Global", category: "commodities", unit: "USD/lb", kind: "futures" },
  { symbol: "BTC-USD", name: "Bitcoin", region: "24/7", category: "crypto", unit: "USD", kind: "spot" },
  { symbol: "ETH-USD", name: "Ethereum", region: "24/7", category: "crypto", unit: "USD", kind: "spot" },
  { symbol: "SOL-USD", name: "Solana", region: "24/7", category: "crypto", unit: "USD", kind: "spot" },
  { symbol: "XRP-USD", name: "XRP", region: "24/7", category: "crypto", unit: "USD", kind: "spot" },
  { symbol: "INR=X", name: "USD / INR", region: "India", category: "forex", unit: "INR per USD", kind: "spot" },
  { symbol: "DX-Y.NYB", name: "US Dollar Index", region: "Global", category: "forex", unit: "points", kind: "index" },
  { symbol: "EURUSD=X", name: "EUR / USD", region: "Europe", category: "forex", unit: "USD per EUR", kind: "spot" },
  { symbol: "JPY=X", name: "USD / JPY", region: "Japan", category: "forex", unit: "JPY per USD", kind: "spot" },
  { symbol: "GBPUSD=X", name: "GBP / USD", region: "UK", category: "forex", unit: "USD per GBP", kind: "spot" },
];
export type GlobalQuote = MarketInstrument & { price: number | null; change: number | null; changePct: number | null; quoteAt: string | null; delayMinutes: number | null; marketState: string | null; stale: boolean };
export type GlobalSnapshot = { rows: GlobalQuote[]; fetchedAt: string; error: string | null };
const number = (v: unknown) => typeof v === "number" && Number.isFinite(v) ? v : null;
export function normalizeGlobalQuote(instrument: MarketInstrument, raw?: Record<string, unknown>): GlobalQuote {
  const timestamp = number(raw?.["regularMarketTime"]);
  const state = raw?.["marketState"];
  return { ...instrument, price: number(raw?.["regularMarketPrice"]), change: number(raw?.["regularMarketChange"]), changePct: number(raw?.["regularMarketChangePercent"]), quoteAt: timestamp && timestamp > 0 ? new Date(timestamp * 1000).toISOString() : null, delayMinutes: number(raw?.["exchangeDataDelayedBy"]), marketState: typeof state === "string" ? state : null, stale: false };
}