import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { findRef, pctChange } from "@/lib/stocks";
import { getCompanyDetail } from "@/lib/market.functions";
import { getLiveSummary } from "@/lib/yahoo.functions";
import { Delta } from "@/components/Delta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stock/$symbol")({
  loader: ({ params }) => {
    const s = findRef(params.symbol);
    if (!s) throw notFound();
    return s;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.symbol} — FII/DII holding & fundamentals` : "Stock unavailable" },
      { name: "description", content: loaderData ? `${loaderData.name} shareholding pattern, quarterly results and fundamentals.` : "Stock not found" },
      { property: "og:title", content: loaderData ? `${loaderData.symbol} fundamentals` : "Stock unavailable" },
      { property: "og:description", content: "Real shareholding pattern and quarterly results comparison." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StockPage,
});

// Lower is better for these rows
const LOWER_BETTER = new Set(["Expenses", "Interest", "Depreciation", "Tax %"]);

function tone(cur: number | null, prev: number | null, lowerBetter = false) {
  if (cur == null || prev == null || cur === prev) return "border-border bg-card";
  const good = lowerBetter ? cur < prev : cur > prev;
  return good ? "border-gain/50 bg-gain/10" : "border-loss/50 bg-loss/10";
}

function StockPage() {
  const s = Route.useLoaderData();
  const fn = useServerFn(getCompanyDetail);
  const { data, isLoading } = useQuery({
    queryKey: ["company", s.symbol],
    queryFn: () => fn({ data: { symbol: s.symbol } }),
    staleTime: 30 * 60 * 1000,
  });
  const c = data?.company;
  const sh = c?.shareholding, qt = c?.quarters;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← All stocks</Link>
      <div className="mt-4">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">NSE · BSE · {s.sector}</p>
        <h1 className="text-3xl font-bold">{s.name}</h1>
        <p className="font-mono text-muted-foreground">{s.symbol}</p>
      </div>
      <LivePanel symbol={s.symbol} />

      {isLoading && <p className="mt-8 text-muted-foreground">Loading shareholding and results…</p>}
      {!isLoading && !c && <p className="mt-8 text-muted-foreground">Shareholding data unavailable for this stock right now.</p>}

      {sh && sh.headers.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 text-xl font-semibold">Shareholding pattern — {sh.headers.at(-1)} vs {sh.headers.at(-2)}</h2>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["FIIs", "DIIs", "Promoters", "Public"].filter((k) => sh.rows[k]).map((k) => {
              const a = sh.rows[k]!, cur = a.at(-1) ?? null, prev = a.at(-2) ?? null;
              return (
                <div key={k} className={cn("rounded-xl border p-4", tone(cur, prev))}>
                  <p className="text-sm text-muted-foreground">{k}</p>
                  <p className="font-mono text-2xl font-bold">{cur?.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground">Prev: {prev?.toFixed(2)}%</p>
                  {cur != null && prev != null && <Delta value={cur - prev} suffix="%" className="mt-2" />}
                </div>
              );
            })}
          </section>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border font-mono text-xs uppercase text-muted-foreground">
                <tr><th className="p-2 text-left">Holder</th>{sh.headers.slice(-8).map((h) => <th key={h} className="p-2 text-right">{h}</th>)}</tr>
              </thead>
              <tbody>
                {Object.entries(sh.rows).filter(([k]) => k !== "No. of Shareholders").map(([k, v]) => (
                  <tr key={k} className="border-b border-border/50 last:border-0">
                    <td className="p-2">{k}</td>
                    {v.slice(-8).map((x, i) => <td key={i} className="p-2 text-right font-mono">{x == null ? "—" : `${x.toFixed(2)}%`}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {qt && qt.headers.length >= 2 && (
        <>
          <h2 className="mb-1 mt-10 text-xl font-semibold">Quarterly results — {qt.headers.at(-1)}</h2>
          <p className="mb-3 text-sm text-muted-foreground">Compared with previous quarter ({qt.headers.at(-2)}){qt.headers.length >= 5 ? ` and same quarter last year (${qt.headers.at(-5)})` : ""}. ₹ Cr unless noted.</p>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(qt.rows).filter(([k]) => k !== "Raw PDF").map(([k, v]) => {
              const cur = v.at(-1) ?? null, prevQ = v.at(-2) ?? null, ly = v.length >= 5 ? v.at(-5) ?? null : null;
              const base = ly ?? prevQ;
              const isPct = k.includes("%");
              const lb = LOWER_BETTER.has(k);
              const d = (p: number | null) => (cur == null || p == null ? null : isPct ? cur - p : pctChange(cur, p));
              const dq = d(prevQ), dy = d(ly);
              const signedTone = (x: number | null) => (x == null ? "" : (lb ? x < 0 : x > 0) ? "text-gain" : x === 0 ? "" : "text-loss");
              return (
                <div key={k} className={cn("rounded-xl border p-4", cur != null && cur < 0 && !isPct ? "border-loss/50 bg-loss/10" : tone(cur, base, lb))}>
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className="mt-1 font-mono text-xl font-bold">{cur?.toLocaleString("en-IN") ?? "—"}{isPct ? "%" : ""}</p>
                  <p className="text-xs text-muted-foreground">Prev Q: {prevQ?.toLocaleString("en-IN") ?? "—"}{ly != null ? ` · Last yr: ${ly.toLocaleString("en-IN")}` : ""}</p>
                  <p className="mt-2 flex gap-3 font-mono text-xs font-semibold">
                    {dq != null && <span className={signedTone(dq)}>QoQ {dq > 0 ? "+" : ""}{dq.toFixed(1)}{isPct ? " pts" : "%"}</span>}
                    {dy != null && <span className={signedTone(dy)}>YoY {dy > 0 ? "+" : ""}{dy.toFixed(1)}{isPct ? " pts" : "%"}</span>}
                  </p>
                </div>
              );
            })}
          </section>
          <p className="mt-4 text-xs text-muted-foreground">Green = improved, red = worsened or negative (for expenses, interest, depreciation and tax, lower is better). Source: screener.in.</p>
        </>
      )}
    </main>
  );
}

function LivePanel({ symbol }: { symbol: string }) {
  const fetchLive = useServerFn(getLiveSummary);
  const { data, isLoading } = useQuery({
    queryKey: ["live", symbol],
    queryFn: () => fetchLive({ data: { symbol } }),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
  const L = data?.summary;
  if (isLoading) return <p className="mt-6 text-sm text-muted-foreground">Loading live price…</p>;
  if (!L) return <p className="mt-6 text-sm text-muted-foreground">Live price unavailable right now.</p>;
  const tiles: [string, number | null, string, boolean][] = [
    ["Revenue growth YoY", L.revenueGrowth, "%", true],
    ["Profit growth YoY", L.earningsGrowth, "%", true],
    ["Net margin", L.profitMargin, "%", true],
    ["Operating margin", L.operatingMargin, "%", true],
    ["ROE", L.roe, "%", true],
    ["Debt / Equity", L.debtToEquity, "", false],
    ["EPS (TTM, ₹)", L.eps, "", true],
    ["P/E", L.pe, "", false],
    ["Book value (₹)", L.bookValue, "", false],
    ["Promoters hold", L.promotersPct, "%", false],
    ["Revenue TTM (₹ Cr)", L.revenueCr, "", false],
    ["M.Cap (₹ Cr)", L.marketCapCr, "", false],
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
          <p className="text-xs text-muted-foreground">Next result date{L.resultEstimated ? " (expected)" : ""}</p>
          <p className="font-mono text-xl font-semibold text-primary">{L.resultDate ?? "Not announced"}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map(([label, v, u, signed]) => (
          <div key={label} className={cn("rounded-lg border p-3", v != null && signed ? (v >= 0 ? "border-gain/50 bg-gain/10" : "border-loss/50 bg-loss/10") : "border-border")}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn("font-mono text-lg font-semibold", v != null && signed && (v >= 0 ? "text-gain" : "text-loss"))}>
              {v == null ? "—" : `${v.toLocaleString("en-IN")}${u}`}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
