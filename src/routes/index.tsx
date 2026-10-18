import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { UNIVERSE, CAP_BUCKETS, capBucket, rankByFii } from "@/lib/stocks";
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
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("all");
  const [cap, setCap] = useState("all");
  const all = (data ?? []).filter((s) => s.available);
  const sectors = [...new Set(UNIVERSE.map((s) => s.sector))].sort();
  const rows = rankByFii(all).filter(
    (s) =>
      (s.symbol + s.name).toLowerCase().includes(q.toLowerCase()) &&
      (sector === "all" || s.sector === sector) &&
      (cap === "all" || (s.marketCapCr != null && capBucket(s.marketCapCr) === cap)),
  );
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

      {isLoading && <p className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Loading real shareholding data for {UNIVERSE.length} stocks… (first load takes a few seconds)</p>}
      {isError && <p className="rounded-xl border border-loss/50 bg-loss/10 p-8 text-center">Couldn't load live data. Please refresh in a minute.</p>}

      {data && (
        <>
          <SectorChart rows={all} active={sector} onSelect={(x) => { setSector(x); setTimeout(() => document.getElementById("list")?.scrollIntoView({ behavior: "smooth" }), 50); }} />
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
                {rows.map((s, i) => (
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
        </>
      )}
    </main>
  );
}
