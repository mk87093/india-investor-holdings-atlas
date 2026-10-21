import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { CandleChart } from "@/components/scanners/CandleChart";
import { ScannerNav, istTime } from "@/components/scanners/ScannerNav";
import { useFnoScan } from "@/components/scanners/useFnoScan";
import type { FnoRow } from "@/lib/fno.functions";

export const Route = createFileRoute("/reversal")({
  head: () => ({
    meta: [
      { title: "F&O Reversal Screener — Day Low/High Reversals" },
      { name: "description", content: "NSE F&O stocks ranked by % up from day low and % down from day high, with volume confirmation and 5-min charts." },
      { property: "og:title", content: "F&O Reversal Screener" },
      { property: "og:description", content: "F&O stocks sequenced by reversal from day low/high with volume signals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Table({ rows, buy }: { rows: FnoRow[]; buy: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card">
      <div className={`border-b border-border px-4 py-3 font-semibold ${buy ? "text-gain" : "text-loss"}`}>
        {buy ? "Top gainers from day low" : "Top losers from day high"} ({rows.length})
        <div className="text-xs font-normal text-muted-foreground">Highlighted = 1%+ reversal with volume above trend</div>
      </div>
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card text-muted-foreground"><tr className="text-left">
            <th className="p-2">#</th><th className="p-2">Symbol</th><th className="p-2">LTP</th><th className="p-2">{buy ? "% Up from Low" : "% Down from High"}</th><th className="p-2">Vol vs Trend</th><th className="p-2">Updated</th><th className="p-2" />
          </tr></thead>
          <tbody>{rows.map((r, i) => {
            const pct = buy ? r.fromLowPct : r.fromHighPct;
            const hit = pct >= 1 && (r.volRatio ?? 0) >= 1;
            return (
              <Fragment key={r.symbol}>
                <tr onClick={() => setOpen(open === r.symbol ? null : r.symbol)} className={`cursor-pointer border-t border-border hover:bg-muted/50 ${hit ? (buy ? "bg-gain/10" : "bg-loss/10") : "opacity-60"}`}>
                  <td className="p-2 text-muted-foreground">{i + 1}</td>
                  <td className="p-2 font-semibold">{r.symbol}</td>
                  <td className="p-2">{r.ltp.toFixed(2)}</td>
                  <td className={`p-2 font-medium ${hit ? (buy ? "text-gain" : "text-loss") : ""}`}>{pct.toFixed(2)}%</td>
                  <td className="p-2">{r.volRatio === null ? "—" : `${r.volRatio.toFixed(2)}×`}</td>
                  <td className="p-2">{istTime(r.updated)}</td>
                  <td className="p-2 text-primary">{open === r.symbol ? "Hide" : "Chart"}</td>
                </tr>
                {open === r.symbol && <tr><td colSpan={7} className="bg-muted/30 p-2"><CandleChart candles={r.candles} /><p className="px-2 text-xs text-muted-foreground">Today's 5-min chart · 09:15–15:30 IST</p></td></tr>}
              </Fragment>
            );
          })}</tbody>
        </table>
      </div>
    </div>
  );
}

function Page() {
  const { data, busy, scan } = useFnoScan();
  const s = data?.stocks ?? [];
  const up = [...s].sort((a, b) => b.fromLowPct - a.fromLowPct).slice(0, 20);
  const dn = [...s].sort((a, b) => b.fromHighPct - a.fromHighPct).slice(0, 20);
  return (
    <main className="mx-auto max-w-7xl space-y-4 px-4 py-8">
      <ScannerNav />
      <h1 className="text-2xl font-bold">F&O Reversal Screener</h1>
      <p className="text-sm text-muted-foreground">All F&O stocks sequenced by % gain from day low / % fall from day high, with volume confirmation. Row par click karke 5-min chart dekhein.</p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {data && <span>Scanned {data.scanned}/{data.total} · {new Date(data.at).toLocaleTimeString("en-IN")}</span>}
        <button onClick={scan} disabled={busy} className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Scanning..." : "Scan now"}</button>
      </div>
      {data?.error && <p className="rounded-md border border-loss/50 bg-loss/10 p-3 text-sm">{data.error}</p>}
      {!data ? <p className="text-sm text-muted-foreground">Scanning ~200 F&O stocks...</p> : (
        <div className="grid gap-4 lg:grid-cols-2"><Table rows={up} buy /><Table rows={dn} buy={false} /></div>
      )}
    </main>
  );
}
