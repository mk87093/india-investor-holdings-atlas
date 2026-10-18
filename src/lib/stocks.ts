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


// Compact sample entries: fundamentals derived from revenue, profit and YoY growth.
const g = (symbol: string, name: string, sector: string, price: number, mcap: number,
  fii: number, fiiPrev: number, dii: number, diiPrev: number, rev: number, np: number, gr: number, de: number, pe: number): Stock => {
  MCAP[symbol] = mcap;
  const shares = mcap / price; // Cr shares
  const k = 1 + gr / 100;
  const cur = [rev, np, +(np / shares).toFixed(1), +(np / (mcap / pe) * 100 / 5).toFixed(1), +(np / rev * 160).toFixed(1), de, pe, +((mcap / pe) * 5 / shares).toFixed(0)];
  const prev = [+(rev / k).toFixed(0), +(np / (k * k)).toFixed(0), +(np / (k * k) / shares).toFixed(1), +(cur[3]! / k).toFixed(1), +(cur[4]! / Math.sqrt(k)).toFixed(1), +(de * k).toFixed(2), +(pe / k).toFixed(1), +(cur[7]! / k).toFixed(0)];
  return s(symbol, name, sector, price, fii, fiiPrev, dii, diiPrev, cur, prev);
};

const MORE: Stock[] = [
  g("WIPRO", "Wipro", "IT Services", 560, 293000, 7.4, 6.9, 10.6, 10.1, 89760, 11112, 1, 0.2, 26),
  g("HCLTECH", "HCL Technologies", "IT Services", 1780, 483000, 18.9, 19.4, 22.1, 21.3, 117055, 17390, 8, 0.1, 28),
  g("TECHM", "Tech Mahindra", "IT Services", 1650, 161000, 23.0, 24.5, 39.8, 38.1, 52988, 2397, -10, 0.1, 55),
  g("PERSISTENT", "Persistent Systems", "IT Services", 5600, 87000, 22.4, 21.2, 28.7, 29.5, 11939, 1400, 20, 0.1, 62),
  g("TATAMOTORS", "Tata Motors", "Automobile", 920, 338000, 19.2, 20.2, 15.9, 15.1, 437928, 31807, 25, 1.2, 10),
  g("M&M", "Mahindra & Mahindra", "Automobile", 2950, 366000, 40.1, 39.0, 26.3, 26.9, 138279, 11269, 14, 1.6, 30),
  g("BAJAJ-AUTO", "Bajaj Auto", "Automobile", 9800, 273000, 14.2, 13.5, 11.9, 11.2, 44870, 7708, 22, 0.1, 35),
  g("EICHERMOT", "Eicher Motors", "Automobile", 4800, 131000, 28.1, 28.9, 18.4, 17.1, 16536, 4001, 21, 0.0, 32),
  g("TATASTEEL", "Tata Steel", "Metals", 150, 187000, 19.0, 19.9, 25.4, 24.0, 229171, -4910, -40, 1.0, 60),
  g("JSWSTEEL", "JSW Steel", "Metals", 940, 230000, 26.4, 25.9, 11.2, 11.0, 175006, 8812, 10, 1.1, 26),
  g("HINDALCO", "Hindalco Industries", "Metals", 680, 152000, 27.3, 28.4, 26.0, 24.6, 215962, 10155, -1, 0.6, 15),
  g("NTPC", "NTPC", "Power", 380, 368000, 17.2, 17.9, 33.6, 32.4, 181166, 20812, 16, 1.5, 18),
  g("POWERGRID", "Power Grid Corp", "Power", 330, 307000, 28.1, 28.6, 33.4, 32.8, 45843, 15573, 3, 1.4, 20),
  g("TATAPOWER", "Tata Power", "Power", 420, 134000, 9.4, 9.0, 16.2, 15.8, 61449, 4280, 9, 1.5, 33),
  g("ONGC", "Oil & Natural Gas Corp", "Oil & Gas", 270, 340000, 8.7, 8.4, 19.6, 19.9, 643037, 49221, -2, 0.5, 7),
  g("IOC", "Indian Oil Corp", "Oil & Gas", 165, 233000, 7.8, 7.2, 12.4, 12.9, 866345, 41730, 30, 0.8, 6),
  g("ASIANPAINT", "Asian Paints", "FMCG", 2900, 278000, 13.9, 15.3, 12.2, 11.0, 35495, 5460, 3, 0.1, 51),
  g("NESTLEIND", "Nestle India", "FMCG", 2450, 236000, 11.1, 11.8, 9.7, 9.1, 24394, 3933, 9, 0.2, 60),
  g("BRITANNIA", "Britannia Industries", "FMCG", 5300, 128000, 18.0, 18.9, 16.0, 15.3, 16769, 2140, 8, 0.6, 60),
  g("CIPLA", "Cipla", "Pharma", 1500, 121000, 27.1, 26.0, 24.5, 25.8, 25774, 4122, 41, 0.0, 29),
  g("DRREDDY", "Dr. Reddy's Labs", "Pharma", 1250, 104000, 27.0, 28.2, 24.1, 23.0, 28011, 5568, 23, 0.1, 19),
  g("DIVISLAB", "Divi's Laboratories", "Pharma", 5900, 156000, 17.7, 17.0, 23.9, 24.3, 7845, 1600, -12, 0.0, 97),
  g("ULTRACEMCO", "UltraTech Cement", "Cement", 11200, 323000, 17.4, 17.9, 20.0, 19.2, 70908, 7005, 39, 0.3, 46),
  g("SHREECEM", "Shree Cement", "Cement", 26000, 94000, 11.4, 11.0, 13.3, 13.0, 20521, 2396, 84, 0.1, 39),
  g("INDUSINDBK", "IndusInd Bank", "Banking", 1050, 82000, 30.6, 34.1, 37.5, 34.0, 55143, 8977, 21, 6.9, 9),
  g("BANKBARODA", "Bank of Baroda", "Banking", 245, 127000, 10.3, 10.9, 15.0, 13.8, 118379, 17789, 26, 12.0, 7),
  g("CHOLAFIN", "Cholamandalam Investment", "NBFC", 1350, 113000, 26.6, 25.8, 19.2, 18.8, 19163, 3423, 28, 7.0, 33),
  g("ADANIPORTS", "Adani Ports & SEZ", "Infrastructure", 1400, 302000, 13.5, 14.8, 17.4, 15.1, 26711, 8104, 50, 0.9, 37),
  g("DLF", "DLF", "Realty", 820, 203000, 15.2, 14.9, 5.2, 5.0, 6427, 2724, 25, 0.1, 74),
  g("GODREJPROP", "Godrej Properties", "Realty", 2600, 72000, 16.6, 17.9, 9.1, 8.0, 3036, 725, 26, 1.3, 99),
  g("ZOMATO", "Zomato", "Internet", 260, 230000, 46.4, 44.2, 19.8, 18.5, 12114, 351, 71, 0.1, 400),
  g("NYKAA", "FSN E-Commerce (Nykaa)", "Internet", 180, 52000, 11.9, 9.8, 19.1, 18.0, 6386, 40, 140, 0.4, 1000),
  g("IRCTC", "IRCTC", "Travel", 820, 65600, 7.3, 7.6, 14.2, 13.8, 4270, 1111, 11, 0.0, 59),
  g("INDIGO", "InterGlobe Aviation", "Aviation", 4500, 174000, 26.1, 25.0, 21.6, 22.9, 68904, 8172, 300, 3.4, 21),
  g("KPITTECH", "KPIT Technologies", "IT Services", 1500, 41000, 19.3, 17.8, 13.4, 13.0, 4872, 597, 46, 0.2, 69),
  g("CDSL", "CDSL", "Financial Services", 1450, 15200, 15.1, 12.2, 14.3, 13.8, 1082, 420, 52, 0.0, 36),
  g("ROUTE", "Route Mobile", "Telecom", 1500, 9400, 8.2, 9.8, 12.1, 10.5, 4023, 380, 6, 0.1, 25),
  g("SONATSOFTW", "Sonata Software", "IT Services", 600, 16800, 9.4, 11.2, 21.2, 20.1, 8612, 425, -8, 0.3, 40),
  g("CAMPUS", "Campus Activewear", "Consumer", 280, 8500, 6.1, 5.3, 18.4, 17.2, 1448, 89, -24, 0.3, 95),
  g("JUBLFOOD", "Jubilant FoodWorks", "Consumer", 620, 41000, 24.2, 25.6, 41.0, 39.5, 5654, 216, -38, 1.4, 190),
];
STOCKS.push(...MORE);

export const ranked = () => [...STOCKS].sort((a, b) => b.fii - a.fii);
export const findStock = (sym: string) => STOCKS.find((x) => x.symbol === sym.toUpperCase());
export const change = (cur: number, prev: number) => cur - prev;
export const pctChange = (cur: number, prev: number) => (prev === 0 ? 0 : ((cur - prev) / Math.abs(prev)) * 100);

export const sectorStats = () => {
  const m = new Map<string, { sector: string; fii: number; dii: number; n: number }>();
  for (const x of STOCKS) {
    const e = m.get(x.sector) ?? { sector: x.sector, fii: 0, dii: 0, n: 0 };
    e.fii += x.fii; e.dii += x.dii; e.n++;
    m.set(x.sector, e);
  }
  return [...m.values()]
    .map((e) => ({ sector: e.sector, count: e.n, fii: +(e.fii / e.n).toFixed(2), dii: +(e.dii / e.n).toFixed(2) }))
    .sort((a, b) => b.fii - a.fii);
};

// Sample results calendar for Q2 FY27 (Jul–Sep 2026), declared Oct–Nov 2026.
export const resultDate = (sym: string) => {
  let h = 0;
  for (const ch of sym) h = (h * 31 + ch.charCodeAt(0)) % 1000;
  const d = new Date(Date.UTC(2026, 9, 10));
  d.setUTCDate(d.getUTCDate() + (h % 40));
  return d.toISOString().slice(0, 10);
};
export const resultsCalendar = () =>
  STOCKS.map((x) => ({
    ...x,
    date: resultDate(x.symbol),
    profitGrowth: pctChange(x.current.netProfit, x.previous.netProfit),
    revenueGrowth: pctChange(x.current.revenue, x.previous.revenue),
  })).sort((a, b) => a.date.localeCompare(b.date));
