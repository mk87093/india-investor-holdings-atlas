import { createClient } from "@supabase/supabase-js";
import { fetchQuotesRaw } from "./yahoo.server";
import type { ScanRow } from "./scanner.functions";

let uni: { symbols: string[]; fnoCount: number; at: number } | null = null;

async function fnoSet(): Promise<Set<string>> {
  const r = await fetch("https://nsearchives.nseindia.com/content/fo/fo_mktlots.csv", { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) return new Set();
  const lines = (await r.text()).split("\n").slice(1);
  return new Set(lines.map((l) => l.split(",")[1]?.trim()).filter((s): s is string => !!s));
}

export async function loadUniverse() {
  if (uni && Date.now() - uni.at < 6 * 3600_000) return uni;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const db = createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false },
    global: { fetch: (i, init) => { const h = new Headers(init?.headers); if (h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization"); h.set("apikey", key); return fetch(i, { ...init, headers: h }); } },
  });
  const all: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("stocks").select("symbol").range(from, from + 999);
    if (error) throw new Error(error.message);
    all.push(...(data ?? []).map((d: any) => d.symbol as string));
    if (!data || data.length < 1000) break;
  }
  const fno = await fnoSet();
  const symbols = all.filter((s) => !fno.has(s));
  uni = { symbols, fnoCount: all.length - symbols.length, at: Date.now() };
  return uni;
}

export async function quoteBatch(symbols: string[]): Promise<ScanRow[]> {
  const res = await fetchQuotesRaw(symbols);
  const out: ScanRow[] = [];
  for (const q of res) {
    const price = q.regularMarketPrice, open = q.regularMarketOpen, vol = q.regularMarketVolume;
    const avg = q.averageDailyVolume10Day || q.averageDailyVolume3Month;
    if (!price || !open || !vol || !avg) continue;
    out.push({
      symbol: String(q.symbol).replace(/\.NS$/, ""),
      name: q.longName ?? q.shortName ?? q.symbol,
      price, open,
      changeFromOpen: ((price - open) / open) * 100,
      changePct: q.regularMarketChangePercent ?? 0,
      volume: vol, avgVolume: avg, volRatio: vol / avg,
      turnoverCr: (price * vol) / 1e7,
    });
  }
  return out;
}
