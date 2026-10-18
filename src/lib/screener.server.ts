// Real company data scraped from screener.in public pages (shareholding pattern, quarterly results, ratios).
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const cache = new Map<string, { at: number; data: Company | null }>();
const TTL = 6 * 60 * 60 * 1000;

export type Table = { headers: string[]; rows: Record<string, (number | null)[]> };
export type Company = {
  symbol: string;
  price: number | null;
  marketCapCr: number | null;
  ratios: Record<string, number | null>;
  shareholding: Table;
  quarters: Table;
};

const strip = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
export const num = (s: string): number | null => {
  const v = parseFloat(s.replace(/[,%₹\s]/g, "").replace(/Cr\.?$/, ""));
  return Number.isFinite(v) ? v : null;
};

export function parseSectionTable(html: string, id: string): Table {
  const start = html.indexOf(`id="${id}"`);
  if (start < 0) return { headers: [], rows: {} };
  const tStart = html.indexOf("<table", start);
  const tEnd = html.indexOf("</table>", tStart);
  const table = html.slice(tStart, tEnd);
  const trs = table.match(/<tr[\s\S]*?<\/tr>/g) ?? [];
  let headers: string[] = [];
  const rows: Table["rows"] = {};
  for (const tr of trs) {
    const cells = (tr.match(/<t[hd][\s\S]*?<\/t[hd]>/g) ?? []).map(strip);
    if (!cells.length) continue;
    if (/<th/.test(tr) && !headers.length) { headers = cells.slice(1); continue; }
    const label = cells[0]!.replace(/\s*\+$/, "").trim();
    if (label) rows[label] = cells.slice(1).map(num);
  }
  return { headers, rows };
}

export function parseRatios(html: string) {
  const start = html.indexOf('id="top-ratios"');
  const end = html.indexOf("</ul>", start);
  const out: Record<string, number | null> = {};
  if (start < 0) return out;
  for (const li of html.slice(start, end).match(/<li[\s\S]*?<\/li>/g) ?? []) {
    const name = strip(li.match(/class="name"[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? "");
    const val = strip(li.match(/class="nowrap value"[^>]*>([\s\S]*?)<\/span>\s*<\/li>/)?.[1] ?? li.match(/class="number"[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? "");
    if (name) out[name] = num(val.split("/")[0] ?? "");
  }
  return out;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function getHtml(url: string) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
    if (r.status === 404) return null;
    if (r.status === 429) { await sleep(2000 * (attempt + 1)); continue; }
    if (!r.ok) throw new Error(`screener.in request failed [${r.status}]`);
    return r.text();
  }
  throw new Error("screener.in rate limited [429]");
}

export async function fetchCompany(symbol: string): Promise<Company | null> {
  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  const slug = encodeURIComponent(symbol);
  let html = await getHtml(`https://www.screener.in/company/${slug}/consolidated/`);
  let quarters = html ? parseSectionTable(html, "quarters") : { headers: [], rows: {} };
  if (!html || !quarters.headers.length) {
    html = await getHtml(`https://www.screener.in/company/${slug}/`);
    quarters = html ? parseSectionTable(html, "quarters") : quarters;
  }
  if (!html) { cache.set(symbol, { at: Date.now(), data: null }); return null; }
  const ratios = parseRatios(html);
  const data: Company = {
    symbol,
    price: ratios["Current Price"] ?? null,
    marketCapCr: ratios["Market Cap"] ?? null,
    ratios,
    shareholding: parseSectionTable(html, "shareholding"),
    quarters,
  };
  cache.set(symbol, { at: Date.now(), data });
  return data;
}

export async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]!); }
  }));
  return out;
}

const last = (a?: (number | null)[]) => (a && a.length ? a[a.length - 1] ?? null : null);
const prev = (a?: (number | null)[], back = 2) => (a && a.length >= back ? a[a.length - back] ?? null : null);

export function summarize(c: Company) {
  const sh = c.shareholding.rows, q = c.quarters.rows;
  const sales = q["Sales"] ?? q["Revenue"], np = q["Net Profit"];
  return {
    price: c.price,
    marketCapCr: c.marketCapCr,
    quarter: c.shareholding.headers.at(-1) ?? null,
    fii: last(sh["FIIs"]), fiiPrev: prev(sh["FIIs"]),
    dii: last(sh["DIIs"]), diiPrev: prev(sh["DIIs"]),
    resultQuarter: c.quarters.headers.at(-1) ?? null,
    sales: last(sales), salesYoY: prev(sales, 5),
    profit: last(np), profitYoY: prev(np, 5),
  };
}
