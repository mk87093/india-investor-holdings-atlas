import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { ExternalLink, Newspaper, RefreshCw, Search, Landmark, Globe2, Coins, Fuel, TrendingUp } from "lucide-react";
import { getMarketNews } from "@/lib/news.functions";
import { newsCategories, newsSources, type NewsCategory } from "@/lib/news";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const newsQuery = (category: NewsCategory) => queryOptions({ queryKey: ["market-news", category], queryFn: () => getMarketNews({ data: { category } }), staleTime: 5 * 60_000, refetchInterval: 5 * 60_000 });
const icons = { india: TrendingUp, global: Globe2, commodity: Fuel, crypto: Coins, rbi: Landmark, fed: Landmark };
const dateLabel = (value: string) => new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const Route = createFileRoute("/news")({
  head: () => ({ meta: [
    { title: "Market News — India, Global, Commodities, Crypto, RBI & Fed" },
    { name: "description", content: "Financial headlines from leading Indian and global publishers, commodities and crypto specialists, and official RBI and Federal Reserve releases." },
    { property: "og:title", content: "Market News — FII & DII Holdings Tracker" },
    { property: "og:description", content: "Indian, global, commodity, crypto, RBI and Fed news with publisher links and publication times." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(newsQuery("india")),
  pendingComponent: () => <main className="mx-auto max-w-7xl px-4 py-10"><p className="text-muted-foreground">Loading market news…</p></main>,
  component: NewsPage,
});

function NewsPage() {
  const [category, setCategory] = useState<NewsCategory>("india");
  return <main className="mx-auto max-w-7xl px-4 py-8">
    <header className="mb-6 flex items-start gap-3">
      <Newspaper className="mt-1 h-8 w-8 shrink-0 text-primary" />
      <div><p className="font-mono text-xs uppercase text-primary">Markets · Policy · Economy</p><h1 className="text-3xl font-bold">Market News</h1><p className="mt-1 text-sm text-muted-foreground">{newsSources.length} news feeds · Publisher headlines · Official central-bank releases</p></div>
    </header>
    <Tabs value={category} onValueChange={(v) => setCategory(v as NewsCategory)}>
      <TabsList aria-label="News categories" className="mb-6 grid h-auto w-full grid-cols-2 gap-1 rounded-md sm:grid-cols-3 lg:grid-cols-6">
        {newsCategories.map((c) => { const Icon = icons[c.id]; return <TabsTrigger key={c.id} value={c.id} className="min-h-11 gap-2 whitespace-normal text-center"><Icon className="h-4 w-4 shrink-0" />{c.label}</TabsTrigger>; })}
      </TabsList>
      {newsCategories.map((c) => <TabsContent key={c.id} value={c.id}><Suspense fallback={<p className="py-12 text-muted-foreground">Loading {c.label.toLowerCase()} news…</p>}><NewsSection category={c.id} /></Suspense></TabsContent>)}
    </Tabs>
    <p className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">Publication times in IST. News is not investment advice. Publisher updates may be delayed; some full articles require a subscription.</p>
  </main>;
}

function NewsSection({ category }: { category: NewsCategory }) {
  const { data, refetch, isFetching, isRefetchError } = useSuspenseQuery(newsQuery(category));
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("all");
  const [limit, setLimit] = useState(30);
  const selectedSources = newsSources.filter((s) => s.category === category);
  const articles = data.articles.filter((a) => (source === "all" || a.sourceId === source) && `${a.title} ${a.summary} ${a.sourceName}`.toLowerCase().includes(search.toLowerCase()));
  const issues = data.sources.filter((s) => s.status !== "ok");
  return <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
      <div><h2 className="text-xl font-semibold">{newsCategories.find((c) => c.id === category)?.label}</h2><p className="mt-1 text-xs text-muted-foreground">{data.articles.length} headlines · {data.sources.filter((s) => s.status === "ok").length}/{selectedSources.length} feeds available · Checked {dateLabel(data.fetchedAt)} IST</p></div>
      <Button variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={isFetching ? "animate-spin motion-reduce:animate-none" : ""} />{isFetching ? "Checking…" : "Refresh news"}</Button>
    </div>
    <div className="mb-5 flex flex-wrap gap-3">
      <div className="relative min-w-0 flex-1 basis-60"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input aria-label="Search news" placeholder="Search headlines…" value={search} onChange={(e) => { setSearch(e.target.value); setLimit(30); }} className="pl-9" /></div>
      <Select value={source} onValueChange={(v) => { setSource(v); setLimit(30); }}><SelectTrigger aria-label="Filter news source" className="w-full sm:w-64"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All sources</SelectItem>{selectedSources.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
    </div>
    {isRefetchError && <p role="alert" className="mb-4 text-sm text-loss">News could not refresh. Previously loaded headlines are shown.</p>}
    {issues.length > 0 && <p role="status" className="mb-4 border-l-2 border-primary pl-3 text-sm text-muted-foreground">{issues.map((s) => `${s.name}: ${s.status === "stale" ? "previously fetched headlines" : "temporarily unavailable"}`).join(" · ")}</p>}
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
      <section aria-label="News headlines" className="min-w-0">
        {articles.slice(0, limit).map((a) => <article key={a.id} className="border-b border-border py-5 first:pt-0">
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"><span className="font-semibold text-primary">{a.sourceName}</span>{selectedSources.find((s) => s.id === a.sourceId)?.official && <span className="text-gain">Official release</span>}{a.publishedAt ? <time dateTime={a.publishedAt} className="text-muted-foreground">{dateLabel(a.publishedAt)} IST</time> : <span className="text-muted-foreground">Publication time unavailable</span>}</div>
          <a href={a.url} target="_blank" rel="noopener noreferrer" className="group flex items-start justify-between gap-3 text-lg font-semibold leading-snug hover:text-primary"><span className="min-w-0 break-words">{a.title}</span><ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" /></a>
          {a.summary && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{a.summary}</p>}
        </article>)}
        {!articles.length && <div className="py-12 text-center"><Newspaper className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><h3 className="font-semibold">{data.articles.length ? "No matching headlines" : "Headlines temporarily unavailable"}</h3><p className="mt-2 text-sm text-muted-foreground">{data.articles.length ? "Try another source or search." : "Visit the publisher links or check again later."}</p></div>}
        {articles.length > limit && <Button variant="outline" className="mt-5" onClick={() => setLimit((n) => n + 30)}>More headlines ({articles.length - limit})</Button>}
      </section>
      <aside aria-label="News sources" className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"><h3 className="mb-4 font-semibold">Sources</h3><ul className="space-y-4">{selectedSources.map((s) => { const status = data.sources.find((row) => row.id === s.id); return <li key={s.id}><a href={s.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 text-sm font-semibold hover:text-primary">{s.name}<ExternalLink className="h-3 w-3 shrink-0" /></a><p className="mt-1 text-xs text-muted-foreground">{s.official ? "Official · " : ""}{status?.status === "ok" ? `${status.count} headlines` : status?.status === "stale" ? "Cached headlines" : "Unavailable"}</p></li>; })}</ul></aside>
    </div>
  </>;
}