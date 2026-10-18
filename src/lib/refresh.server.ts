import { fetchCompany, summarize } from "./screener.server";
import { fetchQuotes } from "./yahoo.server";

const BATCH = 5;

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

// Loads the official NSE equity list into the table when it's missing symbols.
export async function syncUniverse() {
  const db = await admin();
  const { count } = await db.from("stocks").select("symbol", { count: "exact", head: true });
  if ((count ?? 0) >= 2000) return { added: 0 };
  const r = await fetch("https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv", { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`NSE list failed [${r.status}]`);
  const lines = (await r.text()).trim().split(/\r?\n/).slice(1);
  const rows = lines.map((l) => {
    const m = l.match(/^([^,]+),(".*?"|[^,]*),/);
    return m ? { symbol: m[1]!.trim(), name: m[2]!.replace(/^"|"$/g, "").trim() } : null;
  }).filter((x): x is { symbol: string; name: string } => !!x && /^[A-Z0-9&-]+$/.test(x.symbol));
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from("stocks").upsert(rows.slice(i, i + 500), { onConflict: "symbol", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  }
  return { added: rows.length };
}

// Refreshes the stalest few stocks. Called every minute; full cycle of ~2600 stocks takes about 9 hours.
export async function refreshBatch() {
  const db = await admin();
  const { data: due, error } = await db.from("stocks").select("symbol").order("updated_at", { ascending: true, nullsFirst: true }).limit(BATCH);
  if (error) throw new Error(error.message);
  const syms = (due ?? []).map((d) => d.symbol);
  if (!syms.length) return { updated: 0 };
  const quotes = await fetchQuotes(syms).catch(() => ({}) as Record<string, { resultDate: string | null; price: number | null }>);
  let updated = 0;
  for (const symbol of syms) {
    const now = new Date().toISOString();
    try {
      const c = await fetchCompany(symbol);
      const y = quotes[symbol];
      if (!c) { await db.from("stocks").update({ updated_at: now, last_error: "not found" }).eq("symbol", symbol); continue; }
      const s = summarize(c);
      await db.from("stocks").update({
        sector: c.sector, industry: c.industry,
        price: y?.price ?? s.price, market_cap_cr: s.marketCapCr,
        quarter: s.quarter, fii: s.fii, fii_prev: s.fiiPrev, dii: s.dii, dii_prev: s.diiPrev,
        result_quarter: s.resultQuarter, sales: s.sales, sales_yoy: s.salesYoY, profit: s.profit, profit_yoy: s.profitYoY,
        result_date: y?.resultDate ?? null, updated_at: now, last_error: null,
      }).eq("symbol", symbol);
      updated++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // On rate limit, leave updated_at so it's retried next run.
      if (msg.includes("429")) break;
      await db.from("stocks").update({ updated_at: now, last_error: msg.slice(0, 200) }).eq("symbol", symbol);
    }
  }
  return { updated };
}
