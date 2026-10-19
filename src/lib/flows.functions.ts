import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type Day = { date: string; fii: number | null; dii: number | null; fiiBuy: number | null; fiiSell: number | null; diiBuy: number | null; diiSell: number | null };
export type Month = { month: string; days: number; fii: number; dii: number; fiiBuy: number; fiiSell: number; diiBuy: number; diiSell: number };

export function monthlyTotals(days: Day[]): Month[] {
  const m = new Map<string, Month>();
  for (const d of days) {
    const k = d.date.slice(0, 7);
    const t = m.get(k) ?? { month: k, days: 0, fii: 0, dii: 0, fiiBuy: 0, fiiSell: 0, diiBuy: 0, diiSell: 0 };
    t.days++; t.fii += d.fii ?? 0; t.dii += d.dii ?? 0;
    t.fiiBuy += d.fiiBuy ?? 0; t.fiiSell += d.fiiSell ?? 0; t.diiBuy += d.diiBuy ?? 0; t.diiSell += d.diiSell ?? 0;
    m.set(k, t);
  }
  return [...m.values()].sort((a, b) => b.month.localeCompare(a.month));
}

export const getFlows = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { saveDailyFlows } = await import("./flows.server");
    await saveDailyFlows();
  } catch (e) { console.error(e); }
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const db = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false },
    global: { fetch: (i, init) => { const h = new Headers(init?.headers); if (h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization"); h.set("apikey", key); return fetch(i, { ...init, headers: h }); } },
  });
  const { data, error } = await db.from("fii_dii_daily").select("*").order("trade_date", { ascending: false }).limit(2000);
  if (error) throw new Error(error.message);
  const by = new Map<string, Day>();
  for (const r of data ?? []) {
    const d = by.get(r.trade_date) ?? { date: r.trade_date, fii: null, dii: null, fiiBuy: null, fiiSell: null, diiBuy: null, diiSell: null };
    if (r.category === "FII") { d.fii = r.net_cr; d.fiiBuy = r.buy_cr; d.fiiSell = r.sell_cr; }
    else { d.dii = r.net_cr; d.diiBuy = r.buy_cr; d.diiSell = r.sell_cr; }
    by.set(r.trade_date, d);
  }
  const days = [...by.values()];
  return { days, months: monthlyTotals(days) };
});
