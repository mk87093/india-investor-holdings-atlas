import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { runCashScan, getCandles, type ScanRow } from "@/lib/scanner.functions";
import { findSignals, lastDay, latestSignal, type Signal, type Candle } from "@/lib/breakout";

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

const fmt = (v: number, d = 2) => v.toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d });
const hhmm = (t: number) => { const d = new Date(t * 1000); return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")} ${d.toISOString().slice(11, 16)}`; };

function Chart({ symbol, side }: { symbol: string; side?: "BUY" | "SELL" | undefined }) {
  const ref = useRef<HTMLDivElement>(null);
  const candlesFn = useServerFn(getCandles);
  const [msg, setMsg] = useState("Loading 5-min chart...");
  useEffect(() => {
    let chart: any; let dead = false;
    (async () => {
      const [lw, data] = await Promise.all([import("lightweight-charts"), candlesFn({ data: { symbol } })]);
      if (dead || !ref.current) return;
      if (!data.length) return setMsg("No chart data");
      setMsg("");
      const grid = "rgba(128,128,128,0.12)";
      // lightweight-charts can't parse oklch theme colors, so use a plain neutral.
      chart = lw.createChart(ref.current, { height: 380, width: ref.current.clientWidth || 800, layout: { background: { color: "transparent" }, textColor: "#9ca3af" }, grid: { vertLines: { color: grid }, horzLines: { color: grid } }, timeScale: { timeVisible: true, secondsVisible: false } });
      const up = "#22c55e", dn = "#ef4444";
      const s = chart.addSeries(lw.CandlestickSeries, { upColor: up, downColor: dn, borderVisible: false, wickUpColor: up, wickDownColor: dn });
      s.setData(data as any);
      const sigs = findSignals(lastDay(data as Candle[])).filter((x) => !side || x.side === side);
      lw.createSeriesMarkers(s, sigs.map((x) => ({ time: x.signalTime as any, position: x.side === "BUY" ? "belowBar" : "aboveBar", color: x.side === "BUY" ? up : dn, shape: x.side === "BUY" ? "arrowUp" : "arrowDown", text: x.side })));
      sigs.forEach((x) => chart.addSeries(lw.LineSeries, { color: x.side === "BUY" ? up : dn, lineStyle: lw.LineStyle.Dotted, lineWidth: 1, lastValueVisible: false, priceLineVisible: false }).setData([{ time: x.setupTime, value: x.level }, { time: x.signalTime, value: x.level }]));
      const v = chart.addSeries(lw.HistogramSeries, { priceScaleId: "vol", priceFormat: { type: "volume" } });
      chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      v.setData(data.map((c) => ({ time: c.time, value: c.volume, color: c.close >= c.open ? "#22c55e55" : "#ef444455" })));
      chart.timeScale().fitContent();
    })().catch(() => setMsg("Chart load nahi hua"));
    return () => { dead = true; chart?.remove(); };
  }, [symbol, side]);
  return <div>{msg && <p className="p-6 text-sm text-muted-foreground">{msg}</p>}<div ref={ref} className="w-full" /></div>;
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
  const [open, setOpen] = useState<string | null>(null);
  const [sigs, setSigs] = useState<Record<string, Signal | null>>({});
  const [sigLoading, setSigLoading] = useState(false);

  const scan = async () => { setBusy(true); try { setRes(await scanFn({ data: { minUp, minTurnoverCr, minVolRatio } })); } finally { setBusy(false); } };
  useEffect(() => { scan(); }, []);
  useEffect(() => { if (!auto) return; const t = setInterval(scan, 60_000); return () => clearInterval(t); }, [auto, minUp, minTurnoverCr, minVolRatio]);
  useEffect(() => {
    const syms = (res?.rows ?? []).slice(0, 60).map((r) => r.symbol);
    if (!syms.length) { setSigs({}); return; }
    let dead = false; const acc: Record<string, Signal | null> = {}; let i = 0;
    setSigLoading(true);
    Promise.all(Array.from({ length: Math.min(6, syms.length) }, async () => {
      while (i < syms.length) {
        const s = syms[i++]!;
        try { acc[s] = latestSignal(await candlesFn({ data: { symbol: s } })); } catch { acc[s] = null; }
        if (!dead) setSigs({ ...acc });
      }
    })).finally(() => !dead && setSigLoading(false));
    return () => { dead = true; };
  }, [res]);

  const rows = res?.rows ?? [];
  const withSig = rows.filter((r) => sigs[r.symbol]).map((r) => ({ r, s: sigs[r.symbol]! })).sort((a, b) => a.s.signalTime - b.s.signalTime);
  const buys = withSig.filter((x) => x.s.side === "BUY");
  const sells = withSig.filter((x) => x.s.side === "SELL");
  const rest = rows.filter((r) => !sigs[r.symbol]);

  const Card = ({ r, s }: { r: ScanRow; s?: Signal | undefined }) => {
    const id = r.symbol + (s?.side ?? "");
    return (
      <div className="rounded-lg border border-border bg-card">
        <button onClick={() => setOpen(open === id ? null : id)} className="flex w-full items-start justify-between gap-3 p-3 text-left hover:bg-accent">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold">{r.symbol}</span>
              {s && <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${s.side === "BUY" ? "bg-gain/15 text-gain" : "bg-loss/15 text-loss"}`}>{s.side === "BUY" ? "▲ BUY" : "▼ SELL"}</span>}
            </div>
            <p className="truncate text-xs text-muted-foreground">{r.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{s ? `${hhmm(s.signalTime)} · lvl ${fmt(s.level)} · ` : ""}₹{fmt(r.turnoverCr, 1)} Cr · {fmt(r.volRatio, 1)}x</p>
          </div>
          <div className="text-right font-mono">
            <p className="font-semibold">{fmt(r.price)}</p>
            <p className="text-sm text-gain">+{fmt(r.changeFromOpen)}%</p>
            <p className={`text-xs ${r.changePct >= 0 ? "text-gain" : "text-loss"}`}>{fmt(r.changePct)}% day</p>
          </div>
        </button>
        {open === id && <div className="border-t border-border p-2"><Chart symbol={r.symbol} side={s?.side} /><Link to="/stock/$symbol" params={{ symbol: r.symbol }} className="mt-2 inline-block text-xs text-primary hover:underline">FII/DII & fundamentals →</Link></div>}
      </div>
    );
  };

  const Section = ({ title, items, tone }: { title: string; items: { r: ScanRow; s?: Signal | undefined }[]; tone: string }) => (
    <section>
      <h2 className={`mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${tone}`}>{title}<span className="rounded-full bg-muted px-2 text-xs text-muted-foreground">{items.length}</span></h2>
      <div className="space-y-2">{items.length ? items.map((x) => <Card key={x.r.symbol} r={x.r} s={x.s} />) : <p className="text-sm text-muted-foreground">Koi stock nahi.</p>}</div>
    </section>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/" className="text-sm text-primary hover:underline">← Institutional Holdings</Link>
      <header className="mb-6 mt-2">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">NSE · Cash only · No F&O</p>
        <h1 className="text-3xl font-bold tracking-tight">Cash Momentum Scanner</h1>
        <p className="text-sm text-muted-foreground">Open se {minUp}%+ up, turnover ₹{minTurnoverCr} Cr+, volume {minVolRatio}x average. Breakout = 3-candle setup ka breakout (5-min chart). Stock par tap karke chart dekhein. Source: Yahoo Finance (thoda delay ho sakta hai).</p>
      </header>
      <section className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-border bg-card p-4">
        <Num label="Min % up (from open)" value={minUp} set={setMinUp} />
        <Num label="Min turnover (₹ Cr)" value={minTurnoverCr} set={setMinT} />
        <Num label="Min volume (x avg)" value={minVolRatio} set={setMinV} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Auto refresh 1 min</label>
        <button onClick={scan} disabled={busy} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Scanning..." : "Scan now"}</button>
      </section>
      {res?.error && <p className="mb-4 rounded-md border border-loss/50 bg-loss/10 p-3 text-sm">{res.error}</p>}
      {res && <p className="mb-4 font-mono text-xs text-muted-foreground">{rows.length} matches · {withSig.length} breakout{sigLoading ? " (loading...)" : ""} · {res.scanned} cash stocks scanned · {res.fnoExcluded} F&O excluded · {new Date(res.at).toLocaleTimeString("en-IN")}</p>}
      {!res && <p className="text-sm text-muted-foreground">Scanning ~2,300 stocks...</p>}
      {res && (
        <div className="grid gap-6 md:grid-cols-2">
          <Section title="▲ Buy breakouts" items={buys} tone="text-gain" />
          <Section title="▼ Sell breakouts" items={sells} tone="text-loss" />
          <div className="md:col-span-2"><Section title="Momentum (no breakout yet)" items={rest.map((r) => ({ r }))} tone="text-foreground" /></div>
        </div>
      )}
    </main>
  );
}
