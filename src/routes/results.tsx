import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { pctChange } from "@/lib/stocks";
import { useOverview, type OverviewRow } from "@/lib/use-overview";
import { getResultSummary } from "@/lib/result-summary.functions";
import { Delta } from "@/components/Delta";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Quarterly Results Calendar — NSE & BSE" },
      { name: "description", content: "Upcoming and declared quarterly result dates with revenue, profit growth and AI summaries." },
      { property: "og:title", content: "Quarterly Results Calendar — NSE & BSE" },
      { property: "og:description", content: "When each stock declares results, how the last results looked, with AI summaries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Results,
});

const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const yoy = (a: number | null, b: number | null) => (a == null || b == null ? null : pctChange(a, b));

function AiSummary({ r, upcoming }: { r: OverviewRow; upcoming: boolean }) {
  const fn = useServerFn(getResultSummary);
  const q = useQuery({
    queryKey: ["ai-summary", r.symbol, r.resultQuarter, r.sales, r.profit, upcoming],
    queryFn: () => fn({ data: { symbol: r.symbol, name: r.name, quarter: r.resultQuarter, resultDate: r.resultDate, sales: r.sales, salesYoY: r.salesYoY, profit: r.profit, profitYoY: r.profitYoY, fii: r.fii, fiiPrev: r.fiiPrev, dii: r.dii, diiPrev: r.diiPrev, upcoming } }),
    staleTime: Infinity,
  });
  if (q.isLoading) return <p className="text-sm text-muted-foreground">AI summary ban raha hai…</p>;
  if (q.data?.error || !q.data?.summary) return <p className="text-sm text-loss">{q.data?.error ?? "Summary unavailable."}</p>;
  return <p className="whitespace-pre-line text-sm leading-relaxed">{q.data.summary}</p>;
}

function Table({ list, upcoming }: { list: OverviewRow[]; upcoming: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-left font-mono text-xs uppercase text-muted-foreground">
          <tr><th className="p-3">Result date</th><th className="p-3">Stock</th><th className="p-3">Last result</th>
            <th className="p-3 text-right">Revenue (₹ Cr)</th><th className="p-3 text-right">Revenue YoY</th>
            <th className="p-3 text-right">Net Profit (₹ Cr)</th><th className="p-3 text-right">Profit YoY</th><th className="p-3">AI</th></tr>
        </thead>
        <tbody>
          {list.map((r) => {
            const ry = yoy(r.sales, r.salesYoY), py = yoy(r.profit, r.profitYoY);
            const isOpen = open === r.symbol;
            return (
              <>
                <tr key={r.symbol} className="border-b border-border/50 hover:bg-accent">
                  <td className="p-3 font-mono">{r.resultDate ? fmt(r.resultDate) : "—"}</td>
                  <td className="p-3"><Link to="/stock/$symbol" params={{ symbol: r.symbol }} className="font-semibold text-primary">{r.symbol}</Link>
                    <span className="block text-xs text-muted-foreground">{r.name}</span></td>
                  <td className="p-3 text-muted-foreground">{r.resultQuarter ?? "—"}</td>
                  <td className="p-3 text-right font-mono">{r.sales?.toLocaleString("en-IN") ?? "—"}</td>
                  <td className="p-3 text-right">{ry != null && <Delta value={ry} suffix="%" />}</td>
                  <td className="p-3 text-right font-mono">{r.profit?.toLocaleString("en-IN") ?? "—"}</td>
                  <td className="p-3 text-right">{py != null && <Delta value={py} suffix="%" />}</td>
                  <td className="p-3"><button type="button" onClick={() => setOpen(isOpen ? null : r.symbol)} aria-expanded={isOpen}
                    className="inline-flex items-center gap-1 rounded-md border border-primary/50 px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10">
                    <Sparkles className="size-3" />{isOpen ? "Hide" : "AI Summary"}</button></td>
                </tr>
                {isOpen && <tr key={r.symbol + "-ai"} className="border-b border-border/50 bg-primary/5"><td colSpan={8} className="p-4"><AiSummary r={r} upcoming={upcoming} /></td></tr>}
              </>
            );
          })}
        </tbody>
      </table>
      {!list.length && <p className="p-6 text-center text-muted-foreground">Koi stock nahi mila.</p>}
    </div>
  );
}

function Results() {
  const { data, isLoading } = useOverview();
  const [tab, setTab] = useState<"upcoming" | "declared">("upcoming");
  const today = new Date().toISOString().slice(0, 10);
  const rows = [...(data?.rows ?? [])].sort((a, b) => (a.resultDate ?? "9999").localeCompare(b.resultDate ?? "9999"));
  const upcoming = rows.filter((r) => r.resultDate && r.resultDate >= today);
  const declared = rows.filter((r) => r.resultDate && r.resultDate < today).reverse();
  const tabs = [{ id: "upcoming" as const, label: "Upcoming", n: upcoming.length }, { id: "declared" as const, label: "Declared", n: declared.length }];
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-1 text-3xl font-bold">Results Calendar</h1>
      <p className="mb-5 text-sm text-muted-foreground">Result dates from Yahoo Finance; last quarterly result vs same quarter last year from screener.in. AI summary har stock ke liye button par click karke dekhein.</p>
      <div role="tablist" className="mb-6 flex gap-2 border-b border-border">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label} · {t.n}
          </button>
        ))}
      </div>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {data && <Table list={tab === "upcoming" ? upcoming : declared} upcoming={tab === "upcoming"} />}
    </main>
  );
}
