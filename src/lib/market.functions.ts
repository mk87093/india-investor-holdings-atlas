import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { fetchCompany } from "./screener.server";

const SYM = z.string().regex(/^[A-Z0-9&-]{1,20}$/);

function publicDb() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const STOCKS_PER_MINUTE = 5;
export function syncStatus(total: number, pending: number, failed: number) {
  const minutes = Math.ceil(pending / STOCKS_PER_MINUTE);
  return { total, pending, failed, synced: total - pending - failed, etaMinutes: minutes };
}

const COLS = "symbol,name,sector,industry,price,market_cap_cr,quarter,fii,fii_prev,dii,dii_prev,result_quarter,sales,sales_yoy,profit,profit_yoy,result_date,updated_at";

// All stocks that have shareholding data, from the database (refreshed by the background job).
export const getMarketOverview = createServerFn({ method: "GET" }).handler(async () => {
  const db = publicDb();
  const out: Database["public"]["Tables"]["stocks"]["Row"][] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("stocks").select(COLS).not("fii", "is", null).order("fii", { ascending: false }).range(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data as typeof out));
    if (!data || data.length < 1000) break;
  }
  const head = () => db.from("stocks").select("symbol", { count: "exact", head: true });
  const PLACEHOLDER = "2001-01-01T00:00:00Z"; // never-synced rows carry null or a year-2000 timestamp
  const [all, pending, failed] = await Promise.all([
    head(),
    head().or(`updated_at.is.null,updated_at.lt.${PLACEHOLDER}`),
    head().gte("updated_at", PLACEHOLDER).not("last_error", "is", null),
  ]);
  const total = all.count ?? 0, p = pending.count ?? 0, f = failed.count ?? 0;
  return {
    total,
    sync: syncStatus(total, p, f),
    rows: out.map((r) => ({
      symbol: r.symbol, name: r.name, sector: r.sector ?? "Other", industry: r.industry,
      price: r.price, marketCapCr: r.market_cap_cr, quarter: r.quarter,
      fii: r.fii, fiiPrev: r.fii_prev, dii: r.dii, diiPrev: r.dii_prev,
      resultQuarter: r.result_quarter, sales: r.sales, salesYoY: r.sales_yoy, profit: r.profit, profitYoY: r.profit_yoy,
      resultDate: r.result_date, updatedAt: r.updated_at,
    })),
  };
});

export const getStockRef = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ symbol: SYM }).parse(d))
  .handler(async ({ data }) => {
    const { data: row } = await publicDb().from("stocks").select("symbol,name,sector,industry").eq("symbol", data.symbol).maybeSingle();
    return row;
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

// Lets an open browser drive syncing (in addition to the scheduled job).
// Takes no input and is globally throttled: does nothing if any stock was refreshed in the last 10 seconds.
export const pumpSync = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: latest } = await supabaseAdmin.from("stocks").select("updated_at").not("updated_at", "is", null).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (latest?.updated_at && Date.now() - new Date(latest.updated_at).getTime() < 10_000) return { skipped: true, updated: 0 };
  const { refreshBatch } = await import("./refresh.server");
  try { return { skipped: false, ...(await refreshBatch()) }; }
  catch (e) { console.error(e); return { skipped: false, updated: 0 }; }
});
