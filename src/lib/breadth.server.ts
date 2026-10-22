import { marketBreadth } from "./breadth";
import { loadUniverse } from "./scanner.server";
import { fetchQuotesRaw } from "./yahoo.server";

async function buildSnapshot() {
  const universe = await loadUniverse();
  const symbols = [...universe.fnoSymbols, ...universe.symbols];
  const batches: string[][] = [];
  for (let i = 0; i < symbols.length; i += 150) batches.push(symbols.slice(i, i + 150));
  const quotes: any[] = [];
  let index = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (index < batches.length) {
      const batch = batches[index++];
      if (!batch) continue;
      try { quotes.push(...await fetchQuotesRaw(batch)); }
      catch (error) { console.error("Market quote batch unavailable", error); }
    }
  }));
  const fno = marketBreadth(universe.fnoSymbols, quotes);
  const cash = marketBreadth(universe.symbols, quotes);
  const cashMembers = new Set(universe.symbols);
  return {
    fno, cash, cashQuotes: quotes.filter((q) => cashMembers.has(String(q.symbol).replace(/\.NS$/, ""))),
    fnoExcluded: universe.fnoCount, at: new Date().toISOString(),
    error: fno.covered + cash.covered === 0 ? "Market data unavailable. Please try again shortly." : null,
  };
}

type Snapshot = Awaited<ReturnType<typeof buildSnapshot>>;
let cached: { data: Snapshot; at: number } | null = null;
let pending: Promise<Snapshot> | null = null;

export async function quoteSnapshot(): Promise<Snapshot> {
  if (cached && Date.now() - cached.at < 50_000) return cached.data;
  if (pending) return pending;
  pending = buildSnapshot().then((data) => { cached = { data, at: Date.now() }; return data; });
  try { return await pending; }
  finally { pending = null; }
}