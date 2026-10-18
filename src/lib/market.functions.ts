import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { UNIVERSE } from "./stocks";
import { fetchCompany, mapLimit, summarize } from "./screener.server";
import { fetchQuotes } from "./yahoo.server";

const SYM = z.string().regex(/^[A-Z0-9&-]{1,20}$/);

// All stocks: real FII/DII (latest + previous quarter), market cap, latest quarterly result, next result date.
export const getMarketOverview = createServerFn({ method: "GET" }).handler(async () => {
  const symbols = UNIVERSE.map((u) => u.symbol);
  const [companies, quotes] = await Promise.all([
    mapLimit(symbols, 2, async (s) => {
      try { const c = await fetchCompany(s); return c ? summarize(c) : null; }
      catch (e) { console.error(s, e); return null; }
    }),
    fetchQuotes(symbols).catch((e) => { console.error(e); return {} as Awaited<ReturnType<typeof fetchQuotes>>; }),
  ]);
  return UNIVERSE.map((u, i) => {
    const c = companies[i], y = quotes[u.symbol];
    return {
      ...u,
      available: !!c && c.fii != null,
      price: y?.price ?? c?.price ?? null,
      marketCapCr: c?.marketCapCr ?? y?.marketCapCr ?? null,
      quarter: c?.quarter ?? null,
      fii: c?.fii ?? null, fiiPrev: c?.fiiPrev ?? null,
      dii: c?.dii ?? null, diiPrev: c?.diiPrev ?? null,
      resultQuarter: c?.resultQuarter ?? null,
      sales: c?.sales ?? null, salesYoY: c?.salesYoY ?? null,
      profit: c?.profit ?? null, profitYoY: c?.profitYoY ?? null,
      resultDate: y?.resultDate ?? null,
    };
  });
});

export const getCompanyDetail = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ symbol: SYM }).parse(d))
  .handler(async ({ data }) => {
    try {
      return { company: await fetchCompany(data.symbol), error: null as string | null };
    } catch (e) {
      console.error(e);
      return { company: null, error: "Company data unavailable right now" };
    }
  });
