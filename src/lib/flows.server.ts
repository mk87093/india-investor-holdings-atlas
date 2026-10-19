// Daily FII/FPI and DII cash-market activity from NSE's public endpoint (today's figures only).
// History builds up in the fii_dii_daily table; monthly totals are summed from it.
const MON: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };

export function parseNseDate(d: string) {
  const [dd, m, yy] = d.split("-");
  return `${yy}-${MON[m!]}-${dd!.padStart(2, "0")}`;
}

export async function saveDailyFlows() {
  const res = await fetch("https://www.nseindia.com/api/fiidiiTradeReact", {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/120", Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`NSE flows ${res.status}`);
  const list = (await res.json()) as { category: string; date: string; buyValue: string; sellValue: string; netValue: string }[];
  const rows = list.map((r) => ({
    trade_date: parseNseDate(r.date),
    category: r.category.startsWith("FII") ? "FII" : "DII",
    buy_cr: Number(r.buyValue), sell_cr: Number(r.sellValue), net_cr: Number(r.netValue),
    updated_at: new Date().toISOString(),
  }));
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("fii_dii_daily").upsert(rows);
  if (error) throw new Error(error.message);
  return rows.length;
}
