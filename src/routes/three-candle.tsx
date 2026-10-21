import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { CandleChart } from "@/components/scanners/CandleChart";
import { ScannerNav, istTime } from "@/components/scanners/ScannerNav";
import { useFnoScan } from "@/components/scanners/useFnoScan";
import type { FnoRow } from "@/lib/fno.functions";
import type { MSignal } from "@/lib/breakout";

export const Route = createFileRoute("/three-candle")({
  head: () => ({
    meta: [
      { title: "3 Candle Scanner — F&O 5-min Breakouts" },
      { name: "description", content: "NSE F&O 3-candle scanner: candle body breakout after 3+ (or 2 big) opposite candles, up to 2 signals per side per day." },
      { property: "og:title", content: "3 Candle Scanner — F&O" },
      { property: "og:description", content: "Buy/Sell signals from the 3-candle body breakout setup on 5-min charts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

type Item = { r: FnoRow; s: MSignal; n: number };

function Table({ items, buy }: { items: Item[]; buy: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const side = buy ? "BUY" : "SELL";
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card">
      <div className={`border-b border-border px-4 py-3 font-semibold ${buy ? "text-gain" : "text-loss"}`}>
        {buy ? "Buy" : "Sell"} signals ({items.length})
        <div className="text-xs font-normal text-muted-foreground">{buy ? "Close above body high of green candle before 3+ reds (or 2 big reds)" : "Close below body low of red candle before 3+ greens (or 2 big greens)"}</div>
      </div>
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card text-muted-foreground"><tr className="text-left">
            <th className="p-2">#</th><th className="p-2">Symbol</th><th className="p-2">Signal</th><th className="p-2">Level</th><th className="p-2">Signal Close</th><th className="p-2">Time</th><th className="p-2">LTP</th><th className="p-2" />
          </tr></thead>
          <tbody>
            {items.map(({ r, s, n }, i) => {
              const id = `${r.symbol}-${s.t}`;
              const all = buy ? r.threeBuy : r.threeSell;
              return (
                <Fragment key={id}>
                  <tr onClick={() => setOpen(open === id ? null : id)} className="cursor-pointer border-t border-border hover:bg-muted/50">
                    <td className="p-2 text-muted-foreground">{i + 1}</td>
                    <td className="p-2 font-semibold">{r.symbol}</td>
                    <td className={`p-2 font-bold ${buy ? "text-gain" : "text-loss"}`}>{side}{n === 1 ? "2" : ""}</td>
                    <td className="p-2">{s.level.toFixed(2)}</td>
                    <td className="p-2">{s.price.toFixed(2)}</td>
                    <td className="p-2">{istTime(s.t)}</td>
                    <td className="p-2">{r.ltp.toFixed(2)}</td>
                    <td className="p-2 text-primary">{open === id ? "Hide" : "Chart"}</td>
                  </tr>
                  {open === id && <tr><td colSpan={8} className="bg-muted/30 p-2"><CandleChart candles={r.candles} markers={all.map((x, k) => ({ t: x.t, side, level: x.level, label: k === 1 ? `${side}2` : side }))} /></td></tr>}
                </Fragment>
              );
            })}
            {!items.length && <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">No signals yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Page() {
  const { data, busy, scan } = useFnoScan();
  const s = data?.stocks ?? [];
  const flat = (buy: boolean) => s.flatMap((r) => (buy ? r.threeBuy : r.threeSell).map((x, n) => ({ r, s: x, n })))
    .sort((a, b) => a.s.t - b.s.t || a.r.symbol.localeCompare(b.r.symbol));
  return (
    <main className="mx-auto max-w-7xl space-y-4 px-4 py-8">
      <ScannerNav />
      <h1 className="text-2xl font-bold">3 Candle Scanner</h1>
      <p className="text-sm text-muted-foreground">Buy/Sell signals in listing order — up to 2 signals per side per stock per day (2nd BUY setup below the 1st, 2nd SELL setup above the 1st). Big candle = body at least 1.5× the day's average. Row par click karke chart dekhein.</p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {data && <span>Scanned {data.scanned}/{data.total} · {new Date(data.at).toLocaleTimeString("en-IN")}</span>}
        <button onClick={scan} disabled={busy} className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Scanning..." : "Scan now"}</button>
      </div>
      {data?.error && <p className="rounded-md border border-loss/50 bg-loss/10 p-3 text-sm">{data.error}</p>}
      {!data ? <p className="text-sm text-muted-foreground">Scanning ~200 F&O stocks...</p> : (
        <div className="grid gap-4 lg:grid-cols-2"><Table items={flat(true)} buy /><Table items={flat(false)} buy={false} /></div>
      )}
    </main>
  );
}
