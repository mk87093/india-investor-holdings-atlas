import { createFileRoute, Link } from "@tanstack/react-router";
import { resultsCalendar } from "@/lib/stocks";
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

const TODAY = new Date().toISOString().slice(0, 10);
const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function Results() {
  const rows = resultsCalendar();
  const upcoming = rows.filter((r) => r.date >= TODAY);
  const declared = rows.filter((r) => r.date < TODAY).reverse();
  const Table = ({ title, list, done }: { title: string; list: typeof rows; done: boolean }) => (
    <section className="mb-10">
      <h2 className="mb-3 text-xl font-semibold">{title} · {list.length}</h2>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left font-mono text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Date</th><th className="p-3">Stock</th><th className="p-3">Sector</th>
              <th className="p-3 text-right">Revenue (₹ Cr)</th><th className="p-3 text-right">Net Profit (₹ Cr)</th>
              <th className="p-3 text-right">{done ? "Profit YoY" : "Last Profit YoY"}</th><th className="p-3 text-right">Revenue YoY</th></tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.symbol} className="border-b border-border/50 last:border-0 hover:bg-accent">
                <td className="p-3 font-mono">{fmt(r.date)}</td>
                <td className="p-3"><Link to="/stock/$symbol" params={{ symbol: r.symbol }} className="font-semibold text-primary">{r.symbol}</Link>
                  <span className="block text-xs text-muted-foreground">{r.name}</span></td>
                <td className="p-3 text-muted-foreground">{r.sector}</td>
                <td className="p-3 text-right font-mono">{r.current.revenue.toLocaleString("en-IN")}</td>
                <td className="p-3 text-right font-mono">{r.current.netProfit.toLocaleString("en-IN")}</td>
                <td className="p-3 text-right"><Delta value={r.profitGrowth} suffix="%" /></td>
                <td className="p-3 text-right"><Delta value={r.revenueGrowth} suffix="%" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Holdings</Link>
      <h1 className="mb-1 mt-3 text-3xl font-bold">Results Calendar</h1>
      <p className="mb-8 text-sm text-muted-foreground">Q2 FY27 (Jul–Sep 2026) result dates. Sample data.</p>
      <Table title="Upcoming results" list={upcoming} done={false} />
      <Table title="Already declared" list={declared} done />
    </main>
  );
}
