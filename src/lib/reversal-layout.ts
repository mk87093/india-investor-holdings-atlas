export const REVERSAL_COLUMNS = 1;
export const REVERSAL_ROWS = 15;
export const REVERSAL_BOX_COUNT = REVERSAL_COLUMNS * REVERSAL_ROWS;

export function rankReversals<T extends { fromLowPct: number; fromHighPct: number }>(stocks: T[], buy: boolean): T[] {
  return [...stocks].sort((a, b) => buy ? b.fromLowPct - a.fromLowPct : b.fromHighPct - a.fromHighPct).slice(0, REVERSAL_BOX_COUNT);
}

/** Sector strength: average buy reversal minus average sell reversal of listed stocks. */
export function sectorFlow(up: { symbol: string; fromLowPct: number }[], down: { symbol: string; fromHighPct: number }[], sectors: Record<string, string>) {
  const map = new Map<string, { sum: number; n: number }>();
  const add = (sym: string, v: number) => { const s = sectors[sym] || "Other"; const e = map.get(s) ?? { sum: 0, n: 0 }; e.sum += v; e.n++; map.set(s, e); };
  up.forEach(r => add(r.symbol, r.fromLowPct)); down.forEach(r => add(r.symbol, -r.fromHighPct));
  return [...map].map(([name, e]) => ({ name, pct: e.sum / e.n })).sort((a, b) => b.pct - a.pct);
}
