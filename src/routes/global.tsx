import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Globe2, Landmark, Fuel, Coins, ArrowLeftRight, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getGlobalMarkets } from "@/lib/global-markets.functions";
import { marketCategories, type GlobalQuote } from "@/lib/global-markets";

const globalQuery = queryOptions({ queryKey: ["global-markets"], queryFn: () => getGlobalMarkets(), staleTime: 30_000, refetchInterval: 30_000 });
const icons = { indices: Globe2, bonds: Landmark, commodities: Fuel, crypto: Coins, forex: ArrowLeftRight };
const format = (n: number | null, digits = 2) => n === null ? "—" : n.toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const time = (value: string) => new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

export const Route = createFileRoute("/global")({
  head: () => ({ meta: [
    { title: "Global Indices, Bonds, Commodities & Crypto — MITHUN" },
    { name: "description", content: "Global market quotes for Dow Jones, S&P 500, Nasdaq, Asian and European indices, US Treasury yields, commodities, crypto and USD/INR with quote timestamps." },
    { property: "og:title", content: "Global Markets — MITHUN Market Screener" },
    { property: "og:description", content: "Track world indices, bond yields, energy, metals, Bitcoin, Ethereum and forex in one market dashboard." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(globalQuery),
  pendingComponent: () => <main className="mx-auto max-w-7xl px-4 py-10"><p role="status" className="text-muted-foreground">Loading global market quotes…</p></main>,
  component: GlobalMarkets,
});

function GlobalMarkets() {
  const { data, refetch, isFetching, isRefetchError } = useSuspenseQuery(globalQuery);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const rows = data.rows.filter((r) => `${r.name} ${r.region} ${r.symbol}`.toLowerCase().includes(search.toLowerCase()));
  const available = data.rows.filter((r) => r.price !== null && !r.stale).length;
  return <main className="mx-auto max-w-7xl px-4 py-8">
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-start gap-3"><Globe2 className="mt-1 size-8 shrink-0 text-primary" /><div><h1 className="text-3xl font-bold">Global Markets</h1><p className="mt-2 text-xs text-muted-foreground">Yahoo Finance · {available}/{data.rows.length} quotes available · Checked {time(data.fetchedAt)} IST</p></div></div>
      <Button variant="outline" disabled={isFetching} onClick={() => refetch()}><RefreshCw className={isFetching ? "animate-spin motion-reduce:animate-none" : ""} />{isFetching ? "Refreshing…" : "Refresh"}</Button>
    </header>
    <p className="mb-5 border-l-2 border-primary pl-3 text-sm text-muted-foreground">Auto-refresh 30s · Quotes may be delayed; not tick-by-tick. Each quote shows its market timestamp in IST.</p>
    <Tabs value={category} onValueChange={setCategory}>
      <TabsList aria-label="Global market categories" className="mb-5 grid h-auto w-full grid-cols-2 gap-1 rounded-md sm:grid-cols-3 lg:grid-cols-6">
        <TabsTrigger value="all" className="min-h-11">All Markets</TabsTrigger>
        {marketCategories.map((c) => { const Icon = icons[c.id]; return <TabsTrigger key={c.id} value={c.id} className="min-h-11 gap-2 whitespace-normal"><Icon className="size-4 shrink-0" />{c.label}</TabsTrigger>; })}
      </TabsList>
    </Tabs>
    <div className="relative mb-6 max-w-md"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Search global markets" placeholder="Search market, country or symbol…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
    {(data.error || isRefetchError) && <p role="alert" className="mb-5 text-sm text-loss">{data.error ?? "Refresh failed. Previously loaded quotes are shown."}</p>}
    {marketCategories.filter((c) => category === "all" || category === c.id).map((c) => {
      const sectionRows = rows.filter((r) => r.category === c.id);
      const Icon = icons[c.id];
      return <section key={c.id} aria-label={c.label} className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 border-b border-border pb-3 text-lg font-semibold"><Icon className="size-5 text-primary" />{c.label}<span className="ml-auto font-mono text-xs text-muted-foreground">{sectionRows.length} instruments</span></h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{sectionRows.map((r) => <QuoteTile key={r.symbol} quote={r} />)}</div>
        {!sectionRows.length && <p className="py-5 text-sm text-muted-foreground">No matching markets.</p>}
      </section>;
    })}
    <footer className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">Bonds include US Treasury yields (%) and bond futures prices. Commodity quotes are futures, not Indian spot/MCX prices; contracts roll over. Crypto change follows the provider’s reference period. Market closures retain the last quote. GIFT Nifty is not included: a verified feed is not yet connected.</footer>
  </main>;
}

function QuoteTile({ quote: r }: { quote: GlobalQuote }) {
  const tone = r.change === null ? "text-muted-foreground" : r.change > 0 ? "text-gain" : r.change < 0 ? "text-loss" : "text-muted-foreground";
  const digits = r.category === "forex" && r.unit.startsWith("USD per") ? 4 : r.symbol === "NG=F" || r.symbol === "XRP-USD" ? 3 : 2;
  const sign = r.change !== null && r.change > 0 ? "+" : "";
  return <article aria-label={r.name} className="min-w-0 rounded-md border border-border bg-card p-4">
    <div className="flex items-start justify-between gap-2"><h3 className="min-h-10 break-words text-sm font-semibold leading-5">{r.name}</h3><span className="shrink-0 text-[10px] text-muted-foreground">{r.region}</span></div>
    <div className="mt-2 break-all font-mono text-2xl font-bold tabular-nums">{format(r.price, digits)}{r.kind === "yield" && r.price !== null ? "%" : ""}</div>
    <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1"><span className={`font-mono text-xs tabular-nums ${tone}`}>{sign}{format(r.change, digits)}{r.kind === "yield" ? " pp" : ""}{r.changePct !== null ? ` (${r.changePct > 0 ? "+" : ""}${format(r.changePct)}%)` : ""}</span><span className="text-[10px] text-muted-foreground">{r.unit}</span></div>
    <div className="mt-4 border-t border-border pt-2 text-[10px] leading-5 text-muted-foreground">
      <p className={r.stale || r.price === null ? "text-loss" : ""}>{r.price === null ? "Quote unavailable" : r.stale ? "Cached · refresh unavailable" : r.marketState === "CLOSED" ? "Market closed" : r.delayMinutes !== null && r.delayMinutes > 0 ? `Delayed ${r.delayMinutes} min` : "Latest available · delay unverified"}{r.kind === "futures" ? " · Futures" : ""}</p>
      <p>{r.quoteAt ? `${time(r.quoteAt)} IST` : "Quote time unavailable"}</p>
    </div>
  </article>;
}