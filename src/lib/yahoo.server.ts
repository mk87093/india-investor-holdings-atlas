// Yahoo Finance (unofficial, no key). Needs a session cookie + crumb.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
let session: { cookie: string; crumb: string; at: number } | null = null;
const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 10 * 60 * 1000;

async function getSession() {
  if (session && Date.now() - session.at < 60 * 60 * 1000) return session;
  const r = await fetch("https://fc.yahoo.com", { headers: { "User-Agent": UA }, redirect: "manual" });
  const raw = r.headers.get("set-cookie") ?? "";
  const cookie = raw.split(/,(?=\s*\w+=)/).map((c) => c.split(";")[0]!.trim()).filter(Boolean).join("; ");
  const c = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", { headers: { "User-Agent": UA, Cookie: cookie } });
  if (!c.ok) throw new Error(`Yahoo crumb failed [${c.status}]`);
  session = { cookie, crumb: await c.text(), at: Date.now() };
  return session;
}

async function yget(path: string): Promise<any> {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  for (let attempt = 0; attempt < 2; attempt++) {
    const s = await getSession();
    const url = `https://query2.finance.yahoo.com${path}${path.includes("?") ? "&" : "?"}crumb=${encodeURIComponent(s.crumb)}`;
    const r = await fetch(url, { headers: { "User-Agent": UA, Cookie: s.cookie } });
    if (r.status === 401 || r.status === 403) { session = null; continue; }
    if (!r.ok) throw new Error(`Yahoo request failed [${r.status}]: ${(await r.text()).slice(0, 200)}`);
    const data = await r.json();
    cache.set(path, { at: Date.now(), data });
    return data;
  }
  throw new Error("Yahoo authorization failed");
}

export const ySym = (sym: string) => `${sym}.NS`;

// Raw quote rows, cached 50s (used by the live scanner).
const rawCache = new Map<string, { at: number; data: any[] }>();
export async function fetchQuotesRaw(symbols: string[]): Promise<any[]> {
  const key = symbols.join(",");
  const hit = rawCache.get(key);
  if (hit && Date.now() - hit.at < 50_000) return hit.data;
  const s = await getSession();
  const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.map(ySym).join(","))}&crumb=${encodeURIComponent(s.crumb)}`;
  const r = await fetch(url, { headers: { "User-Agent": UA, Cookie: s.cookie } });
  if (r.status === 401 || r.status === 403) { session = null; throw new Error("Yahoo auth"); }
  if (!r.ok) throw new Error(`Yahoo quote failed [${r.status}]`);
  const data = (await r.json())?.quoteResponse?.result ?? [];
  rawCache.set(key, { at: Date.now(), data });
  return data;
}
const n = (v: any): number | null => (v && typeof v.raw === "number" ? v.raw : typeof v === "number" ? v : null);

export async function fetchQuotes(symbols: string[]) {
  const j = await yget(`/v7/finance/quote?symbols=${encodeURIComponent(symbols.map(ySym).join(","))}`);
  const out: Record<string, { price: number | null; marketCapCr: number | null; resultDate: string | null; changePct: number | null }> = {};
  for (const q of j?.quoteResponse?.result ?? []) {
    const sym = String(q.symbol).replace(/\.NS$/, "");
    const ts = q.earningsTimestampStart ?? q.earningsTimestamp ?? null;
    out[sym] = {
      price: q.regularMarketPrice ?? null,
      marketCapCr: q.marketCap ? Math.round(q.marketCap / 1e7) : null,
      resultDate: ts ? new Date(ts * 1000).toISOString().slice(0, 10) : null,
      changePct: q.regularMarketChangePercent ?? null,
    };
  }
  return out;
}

export async function fetchSummary(sym: string) {
  const mods = "price,financialData,defaultKeyStatistics,summaryDetail,calendarEvents,majorHoldersBreakdown";
  const j = await yget(`/v10/finance/quoteSummary/${encodeURIComponent(ySym(sym))}?modules=${mods}`);
  const r = j?.quoteSummary?.result?.[0];
  if (!r) return null;
  const fd = r.financialData ?? {}, ks = r.defaultKeyStatistics ?? {}, sd = r.summaryDetail ?? {};
  const ed = r.calendarEvents?.earnings?.earningsDate?.[0];
  const pct = (v: any) => (n(v) == null ? null : +(n(v)! * 100).toFixed(2));
  return {
    price: n(r.price?.regularMarketPrice),
    changePct: pct(r.price?.regularMarketChangePercent),
    marketCapCr: n(r.price?.marketCap) ? Math.round(n(r.price?.marketCap)! / 1e7) : null,
    resultDate: ed ? new Date(n(ed)! * 1000).toISOString().slice(0, 10) : null,
    resultEstimated: !!r.calendarEvents?.earnings?.isEarningsDateEstimate,
    revenueCr: n(fd.totalRevenue) ? Math.round(n(fd.totalRevenue)! / 1e7) : null,
    revenueGrowth: pct(fd.revenueGrowth),
    earningsGrowth: pct(fd.earningsGrowth),
    profitMargin: pct(fd.profitMargins),
    operatingMargin: pct(fd.operatingMargins),
    roe: pct(fd.returnOnEquity),
    debtToEquity: n(fd.debtToEquity) == null ? null : +(n(fd.debtToEquity)! / 100).toFixed(2),
    eps: n(ks.trailingEps),
    bookValue: n(ks.bookValue),
    pe: n(sd.trailingPE),
    institutionsPct: pct(r.majorHoldersBreakdown?.institutionsPercentHeld),
    promotersPct: pct(r.majorHoldersBreakdown?.insidersPercentHeld),
    fetchedAt: new Date().toISOString(),
  };
}
