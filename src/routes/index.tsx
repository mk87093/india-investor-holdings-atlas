import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { pumpSync } from "@/lib/market.functions";
import { CAP_BUCKETS, capBucket, rankByFii } from "@/lib/stocks";
import { useOverview } from "@/lib/use-overview";
import { Delta } from "@/components/Delta";
import { SectorChart } from "@/components/SectorChart";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FII & DII Holdings Tracker — NSE & BSE" },
      { name: "description", content: "Indian stocks ranked by real FII holding with DII stake and quarterly position changes." },
      { property: "og:title", content: "FII & DII Holdings Tracker — NSE & BSE" },
      { property: "og:description", content: "Stocks ranked by FII holding with DII stake and position changes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const fmtPct = (v: number | null) => (v == null ? "—" : `${v.toFixed(2)}%`);

function Index() {
  const { data, isLoading, isError } = useOverview();
  const pump = useServerFn(pumpSync);
  const qc = useQueryClient();
  const pending = data?.sync.pending ?? 0;
  useEffect(() => {
    if (!pending) return;
    let n = 0;
    const id = setInterval(async () => {
      const r = await pump().catch(() => null);
      if (r?.updated && ++n % 4 === 0) qc.invalidateQueries({ queryKey: ["overview"] });
    }, 12_000);
    return () => clearInterval(id);
  }, [pending > 0]);
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("all");
  const [cap, setCap] = useState("all");
  const [limit, setLimit] = useState(100);
  const all = data?.rows ?? [];
  const sectors = [...new Set(all.map((s) => s.sector))].sort();
  const rows = rankByFii(all).filter(
    (s) =>
      (s.symbol + s.name).toLowerCase().includes(q.toLowerCase()) &&
      (sector === "all" || s.sector === sector) &&
      (cap === "all" || (s.marketCapCr != null && capBucket(s.marketCapCr) === cap)),
  );
  const shown = rows.slice(0, limit);
  const quarter = all.find((s) => s.quarter)?.quarter;
  const sel = "rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">NSE · BSE · Live</p>
          <h1 className="text-3xl font-bold tracking-tight">Institutional Holdings</h1>
          <Link to="/results" className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">Results calendar →</Link>
          <p className="text-sm text-muted-foreground">
            Ranked by FII holding %. Change vs previous quarter{quarter ? ` · latest: ${quarter}` : ""}. Source: screener.in, Yahoo Finance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={sector} onChange={(e) => setSector(e.target.value)} className={sel} aria-label="Sector">
            <option value="all">All sectors</option>
            {sectors.map((x) => <option key={x}>{x}</option>)}
          </select>
          <select value={cap} onChange={(e) => setCap(e.target.value)} className={sel} aria-label="Market cap">
            {CAP_BUCKETS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search stock…" className={sel + " w-56"} />
        </div>
      </header>

      {isLoading && <p className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Loading shareholding data…</p>}
      {isError && <p className="rounded-xl border border-loss/50 bg-loss/10 p-8 text-center">Couldn't load live data. Please refresh in a minute.</p>}

      {data && (
        <>
          <SyncPanel s={data.sync} />
          <SectorChart rows={all} active={sector} onSelect={(x) => { setSector(x); setLimit(100); setTimeout(() => document.getElementById("list")?.scrollIntoView({ behavior: "smooth" }), 50); }} />
          <div id="list" className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">{sector === "all" ? "All stocks" : sector} · {rows.length} stocks</h2>
            {sector !== "all" && <button onClick={() => setSector("all")} className="text-sm text-primary hover:underline">Show all sectors</button>}
          </div>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left font-mono text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">#</th><th className="p-3">Stock</th><th className="p-3">Sector</th><th className="p-3 text-right">M.Cap (₹ Cr)</th>
                  <th className="p-3 text-right">FII %</th><th className="p-3 text-right">FII Δ</th>
                  <th className="p-3 text-right">DII %</th><th className="p-3 text-right">DII Δ</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((s, i) => (
                  <tr key={s.symbol} className="border-b border-border/50 last:border-0 hover:bg-accent">
                    <td className="p-3 font-mono text-muted-foreground">{i + 1}</td>
                    <td className="p-3">
                      <Link to="/stock/$symbol" params={{ symbol: s.symbol }} className="block">
                        <span className="font-semibold text-primary">{s.symbol}</span>
                        <span className="block text-xs text-muted-foreground">{s.name}</span>
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground">{s.sector}</td>
                    <td className="p-3 text-right font-mono text-muted-foreground">{s.marketCapCr?.toLocaleString("en-IN") ?? "—"}</td>
                    <td className="p-3 text-right font-mono font-semibold">{fmtPct(s.fii)}</td>
                    <td className="p-3 text-right">{s.fii != null && s.fiiPrev != null && <Delta value={s.fii - s.fiiPrev} suffix="%" />}</td>
                    <td className="p-3 text-right font-mono">{fmtPct(s.dii)}</td>
                    <td className="p-3 text-right">{s.dii != null && s.diiPrev != null && <Delta value={s.dii - s.diiPrev} suffix="%" />}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No stocks match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
          {rows.length > limit && (
            <button onClick={() => setLimit(limit + 200)} className="mx-auto mt-4 block rounded-md border border-border bg-card px-4 py-2 text-sm hover:bg-accent">
              Show more ({rows.length - limit} remaining)
            </button>
          )}
        </>
      )}
    </main>
  );
}

function SyncPanel({ s }: { s: { total: number; pending: number; synced: number; failed: number; etaMinutes: number } }) {
  const pct = s.total ? Math.round(((s.synced + s.failed) / s.total) * 100) : 0;
  const eta = s.pending === 0 ? "Complete" : s.etaMinutes < 60 ? `~${s.etaMinutes} min` : `~${Math.floor(s.etaMinutes / 60)}h ${s.etaMinutes % 60}m`;
  const done = s.pending === 0 ? null : new Date(Date.now() + s.etaMinutes * 60000).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });
  const box = "rounded-lg border p-3";
  return (
    <section className="mb-6 rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Data sync · {s.total.toLocaleString("en-IN")} NSE stocks</h2>
        <p className="text-sm text-muted-foreground">Estimated completion: <span className="font-mono font-semibold text-primary">{eta}</span>{done ? ` (${done})` : ""}</p>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className={box + " border-border"}><p className="text-xs text-muted-foreground">Pending</p><p className="font-mono text-xl font-bold">{s.pending.toLocaleString("en-IN")}</p></div>
        <div className={box + " border-gain/50 bg-gain/10"}><p className="text-xs text-muted-foreground">Synced</p><p className="font-mono text-xl font-bold text-gain">{s.synced.toLocaleString("en-IN")}</p></div>
        <div className={box + " border-loss/50 bg-loss/10"}><p className="text-xs text-muted-foreground">Failed</p><p className="font-mono text-xl font-bold text-loss">{s.failed.toLocaleString("en-IN")}</p></div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Syncs about 5 stocks per minute in the background, and faster while this page is open. Failed = stock not found or data unavailable; retried in the next cycle.</p>
    </section>
  );
}
