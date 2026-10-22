import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { getMarketBreadth } from "@/lib/breadth.functions";
import type { MarketBreadth as Breadth } from "@/lib/breadth";
import { Button } from "@/components/ui/button";

function BreadthPanel({ title, data }: { title: string; data: Breadth | null | undefined }) {
  const values = data ? [data.advances, data.declines, data.unchanged] : null;
  return (
    <section className="min-w-0 border-l-2 border-border pl-4" aria-label={title}>
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <div className="grid grid-cols-3 gap-3 font-mono tabular-nums">
        {["Advances", "Declines", "Unchanged"].map((label, i) => (
          <div key={label} className={i === 0 ? "text-gain" : i === 1 ? "text-loss" : "text-muted-foreground"}>
            <p className="text-xs font-sans">{label}</p>
            <p className="text-2xl font-semibold">{values && data?.covered ? values[i]?.toLocaleString("en-IN") : "—"}</p>
          </div>
        ))}
      </div>
      {data && <p className="mt-2 text-xs text-muted-foreground">Coverage {data.covered}/{data.total} · Missing {data.missing}{data.latestQuoteAt ? ` · Quotes ${new Date(data.latestQuoteAt * 1000).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} IST` : ""}</p>}
    </section>
  );
}

export function MarketBreadth() {
  const fetchBreadth = useServerFn(getMarketBreadth);
  const { data, isFetching, isError, refetch } = useQuery({ queryKey: ["market-breadth"], queryFn: () => fetchBreadth(), staleTime: 50_000, refetchInterval: 60_000 });
  return (
    <div className="mb-5 border-y border-border py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">NSE · vs previous close · Yahoo Finance (may be delayed)</p>
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh market breadth"><RefreshCw className={isFetching ? "animate-spin motion-reduce:animate-none" : ""} />{isFetching ? "Updating" : "Refresh"}</Button>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <BreadthPanel title="F&O Market Breadth" data={data?.fno} />
        <BreadthPanel title="Cash Market Breadth · Non-F&O" data={data?.cash} />
      </div>
      {(data?.error || isError) && <p role="status" className="mt-3 text-xs text-loss">{data?.error ?? "Market breadth unavailable. Please try again shortly."}</p>}
    </div>
  );
}