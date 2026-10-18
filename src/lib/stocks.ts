// Stock universe (symbols on NSE/BSE). All numbers come live from screener.in and Yahoo Finance.
export type StockRef = { symbol: string; name: string; sector: string };

export const UNIVERSE: StockRef[] = [
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking" },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Banking" },
  { symbol: "AXISBANK", name: "Axis Bank", sector: "Banking" },
  { symbol: "INFY", name: "Infosys", sector: "IT Services" },
  { symbol: "TCS", name: "Tata Consultancy Services", sector: "IT Services" },
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Conglomerate" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", sector: "Telecom" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Banking" },
  { symbol: "LT", name: "Larsen & Toubro", sector: "Infrastructure" },
  { symbol: "ITC", name: "ITC", sector: "FMCG" },
  { symbol: "SBIN", name: "State Bank of India", sector: "Banking" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", sector: "FMCG" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", sector: "NBFC" },
  { symbol: "MARUTI", name: "Maruti Suzuki", sector: "Automobile" },
  { symbol: "SUNPHARMA", name: "Sun Pharma", sector: "Pharma" },
  { symbol: "WIPRO", name: "Wipro", sector: "IT Services" },
  { symbol: "HCLTECH", name: "HCL Technologies", sector: "IT Services" },
  { symbol: "TECHM", name: "Tech Mahindra", sector: "IT Services" },
  { symbol: "PERSISTENT", name: "Persistent Systems", sector: "IT Services" },
  { symbol: "TMPV", name: "Tata Motors Passenger Vehicles", sector: "Automobile" },
  { symbol: "M&M", name: "Mahindra & Mahindra", sector: "Automobile" },
  { symbol: "BAJAJ-AUTO", name: "Bajaj Auto", sector: "Automobile" },
  { symbol: "EICHERMOT", name: "Eicher Motors", sector: "Automobile" },
  { symbol: "TATASTEEL", name: "Tata Steel", sector: "Metals" },
  { symbol: "JSWSTEEL", name: "JSW Steel", sector: "Metals" },
  { symbol: "HINDALCO", name: "Hindalco Industries", sector: "Metals" },
  { symbol: "NTPC", name: "NTPC", sector: "Power" },
  { symbol: "POWERGRID", name: "Power Grid Corp", sector: "Power" },
  { symbol: "TATAPOWER", name: "Tata Power", sector: "Power" },
  { symbol: "ONGC", name: "Oil & Natural Gas Corp", sector: "Oil & Gas" },
  { symbol: "IOC", name: "Indian Oil Corp", sector: "Oil & Gas" },
  { symbol: "ASIANPAINT", name: "Asian Paints", sector: "FMCG" },
  { symbol: "NESTLEIND", name: "Nestle India", sector: "FMCG" },
  { symbol: "BRITANNIA", name: "Britannia Industries", sector: "FMCG" },
  { symbol: "CIPLA", name: "Cipla", sector: "Pharma" },
  { symbol: "DRREDDY", name: "Dr. Reddy's Labs", sector: "Pharma" },
  { symbol: "DIVISLAB", name: "Divi's Laboratories", sector: "Pharma" },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement", sector: "Cement" },
  { symbol: "SHREECEM", name: "Shree Cement", sector: "Cement" },
  { symbol: "INDUSINDBK", name: "IndusInd Bank", sector: "Banking" },
  { symbol: "BANKBARODA", name: "Bank of Baroda", sector: "Banking" },
  { symbol: "CHOLAFIN", name: "Cholamandalam Investment", sector: "NBFC" },
  { symbol: "ADANIPORTS", name: "Adani Ports & SEZ", sector: "Infrastructure" },
  { symbol: "DLF", name: "DLF", sector: "Realty" },
  { symbol: "GODREJPROP", name: "Godrej Properties", sector: "Realty" },
  { symbol: "ETERNAL", name: "Eternal (Zomato)", sector: "Internet" },
  { symbol: "NYKAA", name: "FSN E-Commerce (Nykaa)", sector: "Internet" },
  { symbol: "IRCTC", name: "IRCTC", sector: "Travel" },
  { symbol: "INDIGO", name: "InterGlobe Aviation", sector: "Aviation" },
  { symbol: "KPITTECH", name: "KPIT Technologies", sector: "IT Services" },
  { symbol: "CDSL", name: "CDSL", sector: "Financial Services" },
  { symbol: "ROUTE", name: "Route Mobile", sector: "Telecom" },
  { symbol: "SONATSOFTW", name: "Sonata Software", sector: "IT Services" },
  { symbol: "CAMPUS", name: "Campus Activewear", sector: "Consumer" },
  { symbol: "JUBLFOOD", name: "Jubilant FoodWorks", sector: "Consumer" },
];

export const findRef = (sym: string) => UNIVERSE.find((x) => x.symbol === sym.toUpperCase());
export const pctChange = (cur: number, prev: number) => (prev === 0 ? 0 : ((cur - prev) / Math.abs(prev)) * 100);

export const CAP_BUCKETS = [
  { id: "all", label: "All caps" },
  { id: "mega", label: "Mega (> ₹5L Cr)" },
  { id: "large", label: "Large (₹20K–5L Cr)" },
  { id: "mid", label: "Mid/Small (< ₹20K Cr)" },
] as const;
export const capBucket = (mc: number) => (mc > 500000 ? "mega" : mc >= 20000 ? "large" : "mid");

export const rankByFii = <T extends { fii: number | null }>(rows: T[]) =>
  [...rows].sort((a, b) => (b.fii ?? -1) - (a.fii ?? -1));

export const sectorStats = (rows: { sector: string; fii: number | null; dii: number | null }[]) => {
  const m = new Map<string, { sector: string; fii: number; dii: number; n: number }>();
  for (const x of rows) {
    if (x.fii == null || x.dii == null) continue;
    const e = m.get(x.sector) ?? { sector: x.sector, fii: 0, dii: 0, n: 0 };
    e.fii += x.fii; e.dii += x.dii; e.n++;
    m.set(x.sector, e);
  }
  return [...m.values()]
    .map((e) => ({ sector: e.sector, count: e.n, fii: +(e.fii / e.n).toFixed(2), dii: +(e.dii / e.n).toFixed(2) }))
    .sort((a, b) => b.fii - a.fii);
};
