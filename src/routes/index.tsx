import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ranked, change } from "@/lib/stocks";
import { Delta } from "@/components/Delta";

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
  const rows = ranked().filter((s) => (s.symbol + s.name).toLowerCase().includes(q.toLowerCase()));
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">NSE · BSE</p>
          <h1 className="text-3xl font-bold tracking-tight">Institutional Holdings</h1>
          <p className="text-sm text-muted-foreground">Ranked by FII holding %. Change vs previous quarter. Sample data.</p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search stock…"
          className="w-64 rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </header>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left font-mono text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">#</th><th className="p-3">Stock</th><th className="p-3">Sector</th>
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
                <td className="p-3 text-right font-mono font-semibold">{s.fii.toFixed(2)}%</td>
                <td className="p-3 text-right"><Delta value={change(s.fii, s.fiiPrev)} suffix="%" /></td>
                <td className="p-3 text-right font-mono">{s.dii.toFixed(2)}%</td>
                <td className="p-3 text-right"><Delta value={change(s.dii, s.diiPrev)} suffix="%" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
