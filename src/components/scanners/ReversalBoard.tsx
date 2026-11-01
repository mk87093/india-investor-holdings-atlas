import { useState } from "react";
import { ChevronDown, ChevronUp, ChartCandlestick, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CandleChart } from "./CandleChart";
import { istTime } from "./ScannerNav";
import type { FnoRow } from "@/lib/fno.functions";

function PriceTrace({ row }: { row: FnoRow }) {
  const prices = row.candles.map((c) => c.close);
  if (prices.length < 2) return <span className="text-xs text-muted-foreground">Chart unavailable</span>;
  const low = Math.min(...prices), range = Math.max(...prices) - low || 1;
  const points = prices.map((p, i) => `${i / (prices.length - 1) * 240},${52 - (p - low) / range * 44}`).join(" ");
  return <svg viewBox="0 0 240 60" className="h-14 w-full" role="img" aria-label={`${row.symbol} intraday price`}><path d="M0 16H240 M0 36H240 M0 56H240" stroke="var(--border)" strokeDasharray="3 5" fill="none" /><polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.7" vectorEffect="non-scaling-stroke" /></svg>;
}

export function ReversalBoard({ rows, buy, sectors }: { rows: FnoRow[]; buy: boolean; sectors: Record<string, string> }) {
  const [open, setOpen] = useState<string | null>(null);
  const Icon = buy ? TrendingUp : TrendingDown;
  return <section className={`reversal-side min-w-0 ${buy ? "reversal-buy" : "reversal-sell"}`} aria-label={buy ? "Top gainers from day low" : "Top losers from day high"}>
    <header className="mb-4 flex items-center justify-between border-b border-current/30 pb-3 text-reversal-tone">
      <div className="flex items-center gap-3"><Icon className="size-6" /><div><h2 className="text-base font-semibold">{buy ? "Top gainers from day low" : "Top losers from day high"}</h2><span className="font-mono text-xs text-muted-foreground">{buy ? "BULL" : "BEAR"} / {rows.length} STOCKS</span></div></div>
      <span className="reversal-beacon size-2 rounded-full bg-current" />
    </header>
    <div className="grid gap-3">
      {rows.map((row, index) => {
        const pct = buy ? row.fromLowPct : row.fromHighPct;
        const hit = pct >= 1 && (row.volRatio ?? 0) >= 1;
        const expanded = open === row.symbol;
        return <article id={`reversal-${buy ? "buy" : "sell"}-${row.symbol}`} key={row.symbol} className={`reversal-stock relative overflow-hidden rounded-lg border p-3 sm:p-4 ${hit ? "reversal-confirmed" : "border-border"}`}>
          <div className="relative flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-3"><span className="pt-1 font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><h3 className="break-words font-mono text-base font-semibold">{row.symbol}</h3><p className="mt-1 break-words text-xs text-muted-foreground">{sectors[row.symbol] || "Sector unavailable"}</p></div></div>
            <span className={`shrink-0 rounded border px-2 py-1 font-mono text-xs ${hit ? "border-current/40 bg-reversal-tone/10 text-reversal-tone" : "border-border text-muted-foreground"}`}>{buy ? "BULL" : "BEAR"}{hit && " •"}</span>
          </div>
          <div className="relative mt-3 grid grid-cols-2 items-center gap-4"><div><p className="font-mono text-[10px] text-muted-foreground">LTP</p><p className="font-mono text-xl font-semibold">{row.ltp.toFixed(2)}</p></div><div className="text-reversal-tone"><PriceTrace row={row} /></div></div>
          <dl className="relative mt-2 grid grid-cols-3 gap-2 border-t border-border pt-3 font-mono"><div><dt className="text-[10px] text-muted-foreground">{buy ? "UP FROM LOW" : "DOWN FROM HIGH"}</dt><dd className={`mt-1 text-sm font-semibold ${hit ? "text-reversal-tone" : "text-foreground"}`}>{pct.toFixed(2)}%</dd></div><div><dt className="text-[10px] text-muted-foreground">VOL VS TREND</dt><dd className="mt-1 text-sm">{row.volRatio === null ? "—" : `${row.volRatio.toFixed(2)}×`}</dd></div><div><dt className="text-[10px] text-muted-foreground">UPDATED</dt><dd className="mt-1 text-sm">{istTime(row.updated)}</dd></div></dl>
          <Button variant="ghost" size="sm" className="relative mt-3 w-full border border-border text-foreground hover:text-foreground" onClick={() => setOpen(expanded ? null : row.symbol)} aria-expanded={expanded} aria-label={`${expanded ? "Hide" : "Show"} ${row.symbol} chart`}><ChartCandlestick />5-min chart{expanded ? <ChevronUp /> : <ChevronDown />}</Button>
          {expanded && <div className="relative mt-3 border-t border-border pt-3"><CandleChart candles={row.candles} /><p className="mt-2 text-xs text-muted-foreground">Today's 5-min chart · 09:15–15:30 IST</p></div>}
        </article>;
      })}
      {!rows.length && <p className="py-8 text-sm text-muted-foreground">No stocks available.</p>}
    </div>
  </section>;
}