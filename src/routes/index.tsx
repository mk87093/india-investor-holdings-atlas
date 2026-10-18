import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ranked, change, STOCKS, CAP_BUCKETS, capBucket } from "@/lib/stocks";
import { Delta } from "@/components/Delta";
import { SectorChart } from "@/components/SectorChart";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FII & DII Holdings Tracker — NSE & BSE" },
      { name: "description", content: "Indian stocks ranked by FII holding with DII stake and quarterly position changes." },
      { property: "og:title", content: "FII & DII Holdings Tracker — NSE & BSE" },
      { property: "og:description", content: "Stocks ranked by FII holding with DII stake and position changes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("all");
  const [cap, setCap] = useState("all");
  const sectors = [...new Set(STOCKS.map((s) => s.sector))].sort();
  const rows = ranked().filter(
    (s) =>
      (s.symbol + s.name).toLowerCase().includes(q.toLowerCase()) &&
      (sector === "all" || s.sector === sector) &&
      (cap === "all" || capBucket(s.marketCap) === cap),
  );
  const sel = "rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary";
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">NSE · BSE</p>
          <h1 className="text-3xl font-bold tracking-tight">Institutional Holdings</h1>
          <p className="text-sm text-muted-foreground">Ranked by FII holding %. Change vs previous quarter. Sample data.</p>
        </div>
        <div className="flex flex-wrap gap-2">
        <select value={sector} onChange={(e) => setSector(e.target.value)} className={sel} aria-label="Sector">
          <option value="all">All sectors</option>
          {sectors.map((x) => <option key={x}>{x}</option>)}
        </select>
        <select value={cap} onChange={(e) => setCap(e.target.value)} className={sel} aria-label="Market cap">
          {CAP_BUCKETS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search stock…"
          className={sel + " w-56"}
        />
        </div>
      </header>
      <SectorChart active={sector} onSelect={(x) => { setSector(x); setTimeout(() => document.getElementById("list")?.scrollIntoView({ behavior: "smooth" }), 50); }} />
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
                <td className="p-3 text-right font-mono text-muted-foreground">{s.marketCap.toLocaleString("en-IN")}</td>
                <td className="p-3 text-right font-mono font-semibold">{s.fii.toFixed(2)}%</td>
                <td className="p-3 text-right"><Delta value={change(s.fii, s.fiiPrev)} suffix="%" /></td>
                <td className="p-3 text-right font-mono">{s.dii.toFixed(2)}%</td>
                <td className="p-3 text-right"><Delta value={change(s.dii, s.diiPrev)} suffix="%" /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No stocks match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
