import { createFileRoute, Link } from "@tanstack/react-router";
import { pctChange } from "@/lib/stocks";
import { useOverview, type OverviewRow } from "@/lib/use-overview";
import { Delta } from "@/components/Delta";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Quarterly Results Calendar — NSE & BSE" },
      { name: "description", content: "Upcoming and declared quarterly result dates with revenue and profit growth." },
      { property: "og:title", content: "Quarterly Results Calendar — NSE & BSE" },
      { property: "og:description", content: "When each stock declares results, and how the last results looked." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Results,
});

const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const yoy = (a: number | null, b: number | null) => (a == null || b == null ? null : pctChange(a, b));

function Table({ title, list }: { title: string; list: OverviewRow[] }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-xl font-semibold">{title} · {list.length}</h2>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left font-mono text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Result date</th><th className="p-3">Stock</th><th className="p-3">Last result</th>
              <th className="p-3 text-right">Revenue (₹ Cr)</th><th className="p-3 text-right">Revenue YoY</th>
              <th className="p-3 text-right">Net Profit (₹ Cr)</th><th className="p-3 text-right">Profit YoY</th></tr>
          </thead>
          <tbody>
            {list.map((r) => {
              const ry = yoy(r.sales, r.salesYoY), py = yoy(r.profit, r.profitYoY);
              return (
                <tr key={r.symbol} className="border-b border-border/50 last:border-0 hover:bg-accent">
                  <td className="p-3 font-mono">{r.resultDate ? fmt(r.resultDate) : "Not announced"}</td>
                  <td className="p-3"><Link to="/stock/$symbol" params={{ symbol: r.symbol }} className="font-semibold text-primary">{r.symbol}</Link>
                    <span className="block text-xs text-muted-foreground">{r.name}</span></td>
                  <td className="p-3 text-muted-foreground">{r.resultQuarter ?? "—"}</td>
                  <td className="p-3 text-right font-mono">{r.sales?.toLocaleString("en-IN") ?? "—"}</td>
                  <td className="p-3 text-right">{ry != null && <Delta value={ry} suffix="%" />}</td>
                  <td className="p-3 text-right font-mono">{r.profit?.toLocaleString("en-IN") ?? "—"}</td>
                  <td className="p-3 text-right">{py != null && <Delta value={py} suffix="%" />}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Results() {
  const { data, isLoading } = useOverview();
  const today = new Date().toISOString().slice(0, 10);
  const rows = [...(data ?? [])].sort((a, b) => (a.resultDate ?? "9999").localeCompare(b.resultDate ?? "9999"));
  const upcoming = rows.filter((r) => !r.resultDate || r.resultDate >= today);
  const declared = rows.filter((r) => r.resultDate && r.resultDate < today).reverse();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Holdings</Link>
      <h1 className="mb-1 mt-3 text-3xl font-bold">Results Calendar</h1>
      <p className="mb-8 text-sm text-muted-foreground">Result dates from Yahoo Finance; last quarterly result vs same quarter last year from screener.in. Updates automatically.</p>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {data && <><Table title="Upcoming results" list={upcoming} /><Table title="Recently declared" list={declared} /></>}
    </main>
  );
}
