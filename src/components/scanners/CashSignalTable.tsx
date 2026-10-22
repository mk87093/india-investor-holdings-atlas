import { Fragment, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScanRow } from "@/lib/scanner.functions";
import type { Signal } from "@/lib/breakout";
import { istTime } from "./ScannerNav";
import type { ReactNode } from "react";

export type CashSignal = Signal & { price: number };
export type CashItem = { r: ScanRow; s?: CashSignal };

export function CashSignalTable({ title, items, side, chart, loading }: {
  title: string; items: CashItem[]; side?: "BUY" | "SELL"; loading?: boolean;
  chart: (symbol: string, side?: "BUY" | "SELL") => ReactNode;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const tone = side === "BUY" ? "text-gain" : side === "SELL" ? "text-loss" : "text-foreground";
  const fmt = (n: number) => n.toFixed(2);
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card">
      <header className="border-b border-border px-4 py-3">
        <h2 className={`font-semibold ${tone}`}>{title} ({items.length})</h2>
        {loading && <p className="text-xs text-muted-foreground">Checking breakout signals…</p>}
      </header>
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full whitespace-nowrap text-left text-sm tabular-nums">
          <thead className="sticky top-0 z-10 bg-card text-xs text-muted-foreground">
            <tr><th className="p-2">#</th><th className="p-2">Symbol</th>{side ? <><th className="p-2">Signal</th><th className="p-2">Level</th><th className="p-2">Signal Close</th><th className="p-2">Time (IST)</th></> : <><th className="p-2">From Open</th><th className="p-2">Turnover (₹ Cr)</th><th className="p-2">Volume</th></>}<th className="p-2">LTP</th><th className="p-2">Chart</th></tr>
          </thead>
          <tbody>
            {items.map(({ r, s }, i) => <Fragment key={r.symbol}>
              <tr className="border-t border-border hover:bg-muted/50">
                <td className="p-2 text-muted-foreground">{i + 1}</td>
                <td className="p-2 font-semibold" title={r.name}>{r.symbol}</td>
                {side ? <><td className={`p-2 font-bold ${tone}`}>{side}</td><td className="p-2 font-mono">{s ? fmt(s.level) : "—"}</td><td className="p-2 font-mono">{s ? fmt(s.price) : "—"}</td><td className="p-2 font-mono">{s ? istTime(s.signalTime) : "—"}</td></> : <><td className="p-2 font-mono text-gain">+{fmt(r.changeFromOpen)}%</td><td className="p-2 font-mono">{fmt(r.turnoverCr)}</td><td className="p-2 font-mono">{fmt(r.volRatio)}×</td></>}
                <td className="p-2 font-mono">{fmt(r.price)}</td>
                <td className="p-2"><Button variant="outline" size="sm" className="hover:text-foreground" aria-label={`${open === r.symbol ? "Hide" : "Show"} chart for ${r.symbol}`} aria-expanded={open === r.symbol} onClick={() => setOpen(open === r.symbol ? null : r.symbol)}>{open === r.symbol ? <ChevronUp /> : <ChevronDown />}{open === r.symbol ? "Hide" : "Chart"}</Button></td>
              </tr>
              {open === r.symbol && <tr><td colSpan={side ? 8 : 7} className="border-t border-border bg-muted/30 p-2">{chart(r.symbol, side)}<Link to="/stock/$symbol" params={{ symbol: r.symbol }} className="mt-2 inline-block text-xs text-primary hover:underline">FII/DII & fundamentals →</Link></td></tr>}
            </Fragment>)}
            {!items.length && <tr><td colSpan={side ? 8 : 7} className="p-6 text-center text-muted-foreground">{loading ? "Checking signals…" : side ? "No signals yet" : "No stocks match these filters"}</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}