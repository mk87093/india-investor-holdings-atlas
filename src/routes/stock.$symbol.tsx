import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { resultDate, findStock, change, pctChange, type Fundamentals } from "@/lib/stocks";
import { Delta } from "@/components/Delta";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLiveSummary } from "@/lib/yahoo.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stock/$symbol")({
  loader: ({ params }) => {
    const s = findStock(params.symbol);
    if (!s) throw notFound();
    return s;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.symbol} fundamentals & FII/DII` : "Stock unavailable" },
      { name: "description", content: loaderData ? `${loaderData.name} fundamentals vs previous period with FII and DII holdings.` : "Stock not found" },
      { property: "og:title", content: loaderData ? `${loaderData.symbol} fundamentals` : "Stock unavailable" },
      { property: "og:description", content: "Fundamentals comparison and institutional holdings." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StockPage,
});

// higherIsBetter: false means a decrease is good (e.g. debt)
const METRICS: { key: keyof Fundamentals; label: string; unit: string; higherIsBetter: boolean }[] = [
  { key: "revenue", label: "Revenue (₹ Cr)", unit: "", higherIsBetter: true },
  { key: "netProfit", label: "Net Profit (₹ Cr)", unit: "", higherIsBetter: true },
  { key: "eps", label: "EPS (₹)", unit: "", higherIsBetter: true },
  { key: "roe", label: "ROE", unit: "%", higherIsBetter: true },
  { key: "opm", label: "Operating Margin", unit: "%", higherIsBetter: true },
  { key: "bookValue", label: "Book Value (₹)", unit: "", higherIsBetter: true },
  { key: "debtToEquity", label: "Debt / Equity", unit: "", higherIsBetter: false },
  { key: "pe", label: "P/E", unit: "", higherIsBetter: false },
];

function StockPage() {
  const s = Route.useLoaderData();
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← All stocks</Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">{s.exchange} · {s.sector}</p>
          <h1 className="text-3xl font-bold">{s.name}</h1>
          <p className="font-mono text-muted-foreground">{s.symbol}</p>
        </div>
      </div>
      <LivePanel symbol={s.symbol} fallbackDate={resultDate(s.symbol)} />

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {[["FII Holding", s.fii, s.fiiPrev], ["DII Holding", s.dii, s.diiPrev]].map(([l, c, p]) => (
          <div key={l as string} className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{l}</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="font-mono text-3xl font-bold">{(c as number).toFixed(2)}%</span>
              <Delta value={change(c as number, p as number)} suffix="%" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Previous quarter: {(p as number).toFixed(2)}%</p>
          </div>
        ))}
      </section>

      <h2 className="mb-3 mt-10 text-xl font-semibold">Fundamentals — current vs previous year (sample)</h2>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m) => {
          const cur = s.current[m.key], prev = s.previous[m.key];
          const pct = pctChange(cur, prev);
          const good = m.higherIsBetter ? cur > prev : cur < prev;
          const flat = cur === prev;
          return (
            <div
              key={m.key}
              className={cn(
                "rounded-xl border p-4",
                flat ? "border-border bg-card" : good ? "border-gain/50 bg-gain/10" : "border-loss/50 bg-loss/10",
              )}
            >
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="mt-1 font-mono text-xl font-bold">{cur.toLocaleString("en-IN")}{m.unit}</p>
              <p className="text-xs text-muted-foreground">Prev: {prev.toLocaleString("en-IN")}{m.unit}</p>
              <p className={cn("mt-2 font-mono text-sm font-semibold", flat ? "text-muted-foreground" : good ? "text-gain" : "text-loss")}>
                {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
              </p>
            </div>
          );
        })}
      </section>
      <p className="mt-4 text-xs text-muted-foreground">Green = improved, red = worsened (for Debt/Equity and P/E, lower is better).</p>
    </main>
  );
}

function LivePanel({ symbol, fallbackDate }: { symbol: string; fallbackDate: string }) {
  const fetchLive = useServerFn(getLiveSummary);
  const { data, isLoading } = useQuery({
    queryKey: ["live", symbol],
    queryFn: () => fetchLive({ data: { symbol } }),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
  const L = data?.summary;
  if (isLoading) return <p className="mt-6 text-sm text-muted-foreground">Loading live data from Yahoo Finance…</p>;
  if (!L) return <p className="mt-6 text-sm text-muted-foreground">Live data unavailable. Next result (estimate): {fallbackDate}</p>;
  const tiles: [string, number | null, string, boolean | null][] = [
    ["Revenue growth YoY", L.revenueGrowth, "%", true],
    ["Profit growth YoY", L.earningsGrowth, "%", true],
    ["Net margin", L.profitMargin, "%", null],
    ["Operating margin", L.operatingMargin, "%", null],
    ["ROE", L.roe, "%", null],
    ["Debt / Equity", L.debtToEquity, "", null],
    ["EPS (TTM, ₹)", L.eps, "", null],
    ["P/E", L.pe, "", null],
    ["Book value (₹)", L.bookValue, "", null],
    ["Institutions hold", L.institutionsPct, "%", null],
    ["Promoters hold", L.promotersPct, "%", null],
    ["Revenue TTM (₹ Cr)", L.revenueCr, "", null],
  ];
  return (
    <section className="mt-6 rounded-xl border border-primary/40 bg-card p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Live · Yahoo Finance</p>
          <p className="mt-1 font-mono text-3xl font-bold">₹{L.price?.toLocaleString("en-IN") ?? "—"}</p>
          {L.changePct != null && <Delta value={L.changePct} suffix="%" className="mt-1" />}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Next result date{L.resultEstimated ? " (estimated)" : ""}</p>
          <p className="font-mono text-xl font-semibold text-primary">{L.resultDate ?? fallbackDate}</p>
          {L.marketCapCr && <p className="text-xs text-muted-foreground">M.Cap ₹{L.marketCapCr.toLocaleString("en-IN")} Cr</p>}
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map(([label, v, u, signed]) => {
          const tone = v == null ? "" : (signed || label.includes("margin") || label === "ROE") ? (v >= 0 ? "border-gain/50 bg-gain/10" : "border-loss/50 bg-loss/10") : "border-border";
          return (
            <div key={label} className={cn("rounded-lg border p-3", tone || "border-border")}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn("font-mono text-lg font-semibold", v != null && signed && (v >= 0 ? "text-gain" : "text-loss"))}>
                {v == null ? "—" : `${signed && v > 0 ? "+" : ""}${v.toLocaleString("en-IN")}${u}`}
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Updates automatically every 5 minutes. FII/DII split below is sample data — Yahoo doesn't publish it.</p>
    </section>
  );
}
