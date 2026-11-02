import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReversalBoard } from "@/components/scanners/ReversalBoard";
import { ReversalScene } from "@/components/scanners/ReversalScene";
import { supabase } from "@/integrations/supabase/client";
import { ScannerNav } from "@/components/scanners/ScannerNav";
import { useFnoScan } from "@/components/scanners/useFnoScan";
import { useMemo } from "react";
import { rankReversals } from "@/lib/reversal-layout";

export const Route = createFileRoute("/reversal")({
  head: () => ({
    meta: [
      { title: "F&O Reversal Screener — Day Low/High Reversals" },
      { name: "description", content: "NSE F&O stocks ranked by % up from day low and % down from day high, with volume confirmation and 5-min charts." },
      { property: "og:title", content: "F&O Reversal Screener" },
      { property: "og:description", content: "F&O stocks sequenced by reversal from day low/high with volume signals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { data, busy, scan } = useFnoScan();
  const { data: sectors = {} } = useQuery({
    queryKey: ["reversal-sectors"],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const result: Record<string, string> = {};
      for (let from = 0; ; from += 1000) {
        const { data: rows, error } = await supabase.from("stocks").select("symbol,sector").order("symbol").range(from, from + 999);
        if (error) throw error;
        for (const row of rows ?? []) if (row.sector) result[row.symbol] = row.sector;
        if (!rows || rows.length < 1000) break;
      }
      return result;
    },
  });
  const s = data?.stocks ?? [];
  const up = useMemo(() => rankReversals(data?.stocks ?? [], true), [data]);
  const dn = useMemo(() => rankReversals(data?.stocks ?? [], false), [data]);
  return (
    <main className="reversal-terminal min-h-screen"><div className="mx-auto max-w-7xl space-y-5 px-4 py-6">
      <ScannerNav />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div><div className="mb-2 flex items-center gap-2 font-mono text-xs text-muted-foreground"><Activity className="size-4 text-gain" />NSE / F&O</div><h1 className="text-2xl font-bold">F&O Reversal Screener</h1></div>
        <Button onClick={scan} disabled={busy} variant="outline"><RefreshCw className={busy ? "animate-spin motion-reduce:animate-none" : ""} />{busy ? "Scanning..." : "Scan now"}</Button>
      </div>
      <p className="text-xs text-muted-foreground">Highlighted = 1%+ reversal with volume above trend</p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {data && <span>Scanned {data.scanned}/{data.total} · {new Date(data.at).toLocaleTimeString("en-IN")}</span>}

      </div>
      {data?.error && <p className="rounded-md border border-loss/50 bg-loss/10 p-3 text-sm">{data.error}</p>}
      {s.length > 0 && <ReversalScene up={up} down={dn} sectors={sectors} />}
      {!data ? <p className="text-sm text-muted-foreground">Scanning ~200 F&O stocks...</p> : (
        <div className="grid items-start gap-6 md:grid-cols-2"><ReversalBoard rows={up} buy sectors={sectors} /><ReversalBoard rows={dn} buy={false} sectors={sectors} /></div>
      )}
    </div></main>
  );
}
