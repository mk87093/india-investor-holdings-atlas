// Sample shareholding data (illustrative, not live). Percentages = % of total shares.
export type Fundamentals = {
  revenue: number; // ₹ Cr
  netProfit: number; // ₹ Cr
  eps: number;
  roe: number; // %
  opm: number; // %
  debtToEquity: number;
  pe: number;
  bookValue: number;
};

export type Stock = {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE" | "NSE & BSE";
  sector: string;
  price: number;
  marketCap: number; // ₹ Cr
  fii: number;
  fiiPrev: number;
  dii: number;
  diiPrev: number;
  current: Fundamentals;
  previous: Fundamentals;
};

const s = (
  symbol: string, name: string, sector: string, price: number,
  fii: number, fiiPrev: number, dii: number, diiPrev: number,
  c: number[], p: number[],
): Stock => {
  const f = ([a0, a1, a2, a3, a4, a5, a6, a7]: number[]): Fundamentals => ({
    revenue: a0!, netProfit: a1!, eps: a2!, roe: a3!, opm: a4!, debtToEquity: a5!, pe: a6!, bookValue: a7!,
  });
  return { symbol, name, exchange: "NSE & BSE", sector, price, marketCap: MCAP[symbol] ?? 0, fii, fiiPrev, dii, diiPrev, current: f(c), previous: f(p) };
};

const MCAP: Record<string, number> = {
  HDFCBANK: 1308000, ICICIBANK: 893000, AXISBANK: 354000, INFY: 777000, TCS: 1490000, RELIANCE: 1989000,
  BHARTIARTL: 985000, KOTAKBANK: 354000, LT: 500000, ITC: 585000, SBIN: 725000, HINDUNILVR: 583000,
  BAJFINANCE: 436000, MARUTI: 388000, SUNPHARMA: 413000,
};

export const CAP_BUCKETS = [
  { id: "all", label: "All caps" },
  { id: "mega", label: "Mega (> ₹5L Cr)" },
  { id: "large", label: "Large (₹20K–5L Cr)" },
  { id: "mid", label: "Mid/Small (< ₹20K Cr)" },
] as const;
export const capBucket = (mc: number) => (mc > 500000 ? "mega" : mc >= 20000 ? "large" : "mid");

export const STOCKS: Stock[] = [
  s("HDFCBANK", "HDFC Bank", "Banking", 1712, 47.2, 48.0, 35.1, 33.9, [283649, 64062, 84.3, 14.1, 0, 6.8, 20.3, 600], [204666, 46149, 79.1, 16.9, 0, 6.1, 19.5, 579]),
  s("ICICIBANK", "ICICI Bank", "Banking", 1268, 45.6, 44.8, 44.2, 44.9, [236037, 47227, 67.2, 18.7, 0, 6.4, 18.9, 361], [186179, 40888, 58.4, 18.9, 0, 6.2, 17.4, 311]),
  s("AXISBANK", "Axis Bank", "Banking", 1145, 50.1, 51.7, 37.6, 35.8, [138196, 28117, 90.8, 17.2, 0, 8.9, 12.6, 548], [112759, 26386, 85.2, 18.4, 0, 8.7, 13.1, 470]),
  s("INFY", "Infosys", "IT Services", 1872, 33.3, 34.2, 39.0, 37.7, [162990, 26713, 64.4, 31.2, 24.1, 0.09, 29.1, 210], [153670, 26233, 63.3, 32.0, 24.6, 0.08, 28.0, 213]),
  s("TCS", "Tata Consultancy Services", "IT Services", 4120, 12.4, 12.7, 10.9, 10.4, [255324, 48553, 134.2, 51.5, 26.4, 0.08, 30.7, 263], [240893, 46099, 125.9, 50.7, 26.0, 0.09, 29.5, 250]),
  s("RELIANCE", "Reliance Industries", "Conglomerate", 2940, 21.3, 22.1, 18.6, 17.7, [1001122, 79020, 116.8, 8.9, 17.1, 0.44, 25.2, 1302], [974864, 73670, 108.9, 9.2, 16.8, 0.47, 23.8, 1180]),
  s("BHARTIARTL", "Bharti Airtel", "Telecom", 1650, 24.7, 22.9, 21.4, 22.6, [172985, 33556, 55.6, 28.4, 52.7, 2.17, 40.1, 162], [149982, 7467, 13.3, 8.6, 51.0, 2.48, 72.4, 134]),
  s("KOTAKBANK", "Kotak Mahindra Bank", "Banking", 1780, 37.9, 39.6, 28.7, 27.4, [87213, 22126, 111.3, 15.4, 0, 4.1, 16.0, 657], [74856, 18213, 91.6, 14.0, 0, 4.0, 19.4, 539]),
  s("LT", "Larsen & Toubro", "Infrastructure", 3640, 20.0, 21.3, 39.4, 38.0, [255734, 15037, 109.4, 15.3, 10.4, 1.17, 33.3, 630], [221113, 12531, 91.1, 14.4, 10.9, 1.21, 34.0, 594]),
  s("ITC", "ITC", "FMCG", 468, 40.2, 40.9, 41.1, 40.6, [75323, 20458, 16.4, 28.0, 36.2, 0.0, 28.5, 59], [76518, 20751, 16.7, 29.4, 37.5, 0.0, 26.8, 56]),
  s("SBIN", "State Bank of India", "Banking", 812, 10.7, 11.1, 24.4, 24.0, [466813, 70901, 79.4, 17.3, 0, 13.2, 10.2, 467], [406971, 61077, 68.4, 18.8, 0, 13.8, 9.6, 402]),
  s("HINDUNILVR", "Hindustan Unilever", "FMCG", 2480, 11.4, 12.7, 16.1, 15.0, [63121, 10282, 43.7, 20.7, 23.5, 0.03, 56.8, 215], [62707, 10277, 43.7, 20.6, 23.4, 0.02, 53.2, 213]),
  s("BAJFINANCE", "Bajaj Finance", "NBFC", 7050, 21.2, 20.5, 14.9, 15.4, [69683, 16638, 268.9, 19.2, 0, 3.8, 26.2, 1556], [54983, 14451, 235.9, 22.1, 0, 3.7, 30.6, 1270]),
  s("MARUTI", "Maruti Suzuki", "Automobile", 12350, 20.3, 21.9, 25.6, 24.1, [152913, 13955, 443.9, 15.7, 12.1, 0.0, 27.8, 2900], [141858, 13209, 437.0, 16.2, 13.0, 0.0, 26.2, 2720]),
  s("SUNPHARMA", "Sun Pharma", "Pharma", 1720, 17.6, 17.0, 18.9, 19.3, [52578, 10929, 45.6, 16.4, 28.4, 0.03, 37.8, 291], [48497, 9576, 39.9, 16.1, 27.0, 0.05, 36.1, 260]),
];

export const ranked = () => [...STOCKS].sort((a, b) => b.fii - a.fii);
export const findStock = (sym: string) => STOCKS.find((x) => x.symbol === sym.toUpperCase());
export const change = (cur: number, prev: number) => cur - prev;
export const pctChange = (cur: number, prev: number) => (prev === 0 ? 0 : ((cur - prev) / Math.abs(prev)) * 100);
