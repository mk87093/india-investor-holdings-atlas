import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { runCashScan, getCandles } from "@/lib/scanner.functions";
import { lastDay, latestSignal, mithunSignals, type Candle } from "@/lib/breakout";
import { CandleChart } from "@/components/scanners/CandleChart";
import { ScannerNav } from "@/components/scanners/ScannerNav";
import { CashSignalTable, type CashSignal } from "@/components/scanners/CashSignalTable";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "Cash Momentum Scanner — NSE Non-F&O Breakouts" },
      { name: "description", content: "NSE cash-only stocks up 3%+ from open with high turnover, volume spike and 3-candle 5-min breakouts." },
      { property: "og:title", content: "Cash Momentum Scanner" },
      { property: "og:description", content: "Non-F&O NSE stocks with momentum, volume spike and 5-min breakout signals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ScannerPage,
});


function Chart({ symbol, side }: { symbol: string; side?: "BUY" | "SELL" | undefined }) {
  const candlesFn = useServerFn(getCandles);
  const [data, setData] = useState<Candle[] | null>(null);
  useEffect(() => { candlesFn({ data: { symbol } }).then((d) => setData(lastDay(d))).catch(() => setData([])); }, [symbol]);
  if (!data) return <p className="p-4 text-xs text-muted-foreground">Loading chart…</p>;
  const sides = side ? [side] : (["BUY", "SELL"] as const);
  const markers = sides.flatMap((sd) => mithunSignals(data, sd).map((x, k) => ({ t: x.t, side: sd, level: x.level, label: k ? `${sd}2` : sd })));
  return <div><CandleChart candles={data} markers={markers} /><p className="px-2 text-xs text-muted-foreground">Today's 5-min chart · 09:15–15:30 IST</p></div>;
}

function Num({ label, value, set }: { label: string; value: number; set: (n: number) => void }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">{label}
      <input type="number" step="0.5" value={value} onChange={(e) => set(Number(e.target.value))} className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
    </label>
  );
}

function ScannerPage() {
  const scanFn = useServerFn(runCashScan);
  const candlesFn = useServerFn(getCandles);
  const [minUp, setMinUp] = useState(3);
  const [minTurnoverCr, setMinT] = useState(5);
  const [minVolRatio, setMinV] = useState(2);
  const [auto, setAuto] = useState(true);
  const [res, setRes] = useState<Awaited<ReturnType<typeof runCashScan>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [sigs, setSigs] = useState<Record<string, CashSignal | null>>({});
  const [sigLoading, setSigLoading] = useState(false);

  const scan = async () => { setBusy(true); try { setRes(await scanFn({ data: { minUp, minTurnoverCr, minVolRatio } })); } finally { setBusy(false); } };
  useEffect(() => { scan(); }, []);
  useEffect(() => { if (!auto) return; const t = setInterval(scan, 60_000); return () => clearInterval(t); }, [auto, minUp, minTurnoverCr, minVolRatio]);
  useEffect(() => {
    const syms = (res?.rows ?? []).slice(0, 60).map((r) => r.symbol);
    if (!syms.length) { setSigs({}); return; }
    let dead = false; const acc: Record<string, CashSignal | null> = {}; let i = 0;
    setSigs({});
    setSigLoading(true);
    Promise.all(Array.from({ length: Math.min(6, syms.length) }, async () => {
      while (i < syms.length) {
        const s = syms[i++];
        if (!s) continue;
        try {
          const candles = await candlesFn({ data: { symbol: s } });
          const signal = latestSignal(candles);
          const close = signal ? candles.find((c) => c.time === signal.signalTime)?.close : undefined;
          acc[s] = signal && close !== undefined ? { ...signal, price: close } : null;
        } catch { acc[s] = null; }
        if (!dead) setSigs({ ...acc });
      }
    })).finally(() => !dead && setSigLoading(false));
    return () => { dead = true; };
  }, [res]);

  const rows = res?.rows ?? [];
  const withSig = rows.flatMap((r) => { const s = sigs[r.symbol]; return s ? [{ r, s }] : []; }).sort((a, b) => a.s.signalTime - b.s.signalTime);
  const buys = withSig.filter((x) => x.s.side === "BUY");
  const sells = withSig.filter((x) => x.s.side === "SELL");
  const rest = rows.filter((r) => !sigs[r.symbol]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <ScannerNav />
      <header className="mb-6 mt-2">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">NSE · Cash only · No F&O</p>
        <h1 className="text-3xl font-bold tracking-tight">Cash Momentum Scanner</h1>
        <p className="text-sm text-muted-foreground">Open se {minUp}%+ up, turnover ₹{minTurnoverCr} Cr+, volume {minVolRatio}x average. Breakout = 3-candle setup ka breakout (5-min chart). Stock par tap karke chart dekhein. Source: Yahoo Finance (thoda delay ho sakta hai).</p>
      </header>
      <section className="mb-6 flex flex-wrap items-end gap-4 border-y border-border py-4">
        <Num label="Min % up (from open)" value={minUp} set={setMinUp} />
        <Num label="Min turnover (₹ Cr)" value={minTurnoverCr} set={setMinT} />
        <Num label="Min volume (x avg)" value={minVolRatio} set={setMinV} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Auto refresh 1 min</label>
        <Button onClick={scan} disabled={busy}><RefreshCw className={busy ? "animate-spin motion-reduce:animate-none" : ""} />{busy ? "Scanning..." : "Scan now"}</Button>
      </section>
      {res?.error && <p className="mb-4 rounded-md border border-loss/50 bg-loss/10 p-3 text-sm">{res.error}</p>}
      {res && <p className="mb-4 font-mono text-xs text-muted-foreground">{rows.length} matches · {withSig.length} breakout{sigLoading ? " (loading...)" : ""} · {res.scanned} cash stocks scanned · {res.fnoExcluded} F&O excluded · {new Date(res.at).toLocaleTimeString("en-IN")}</p>}
      {!res && <p className="text-sm text-muted-foreground">Scanning ~2,300 stocks...</p>}
      {res && (
        <div className="grid gap-6 md:grid-cols-2">
          <CashSignalTable title="Buy signals" items={buys} side="BUY" loading={sigLoading} chart={(symbol, side) => <Chart symbol={symbol} side={side} />} />
          <CashSignalTable title="Sell signals" items={sells} side="SELL" loading={sigLoading} chart={(symbol, side) => <Chart symbol={symbol} side={side} />} />
          <div className="md:col-span-2"><CashSignalTable title="Momentum (no breakout yet)" items={rest.map((r) => ({ r }))} chart={(symbol, side) => <Chart symbol={symbol} side={side} />} /></div>
        </div>
      )}
    </main>
  );
}
