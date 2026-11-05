import { useEffect, useState } from "react";
import { getIndices, type IndexQuote } from "@/lib/indices.functions";

export function IndexTicker() {
  const [rows, setRows] = useState<IndexQuote[] | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => getIndices().then((d) => alive && setRows(d)).catch(() => {});
    load();
    const t = setInterval(load, 15_000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  const list = rows ?? ["NIFTY 50", "BANK NIFTY", "SENSEX", "INDIA VIX"].map((name) => ({ name, price: null, change: null, changePct: null }));
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 pt-3 md:grid-cols-4" aria-label="Live indices">
      {list.map((r) => {
        const up = (r.change ?? 0) >= 0;
        const tone = r.change == null ? "text-muted-foreground" : up ? "text-gain" : "text-loss";
        return (
          <div key={r.name} className="rounded-lg border border-border bg-card px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{r.name}</div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-base font-bold tabular-nums text-foreground">
                {r.price == null ? "—" : r.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </span>
              <span className={`font-mono text-xs tabular-nums ${tone}`}>
                {r.change == null ? "" : `${up ? "▲" : "▼"} ${r.change.toFixed(2)} (${(r.changePct ?? 0).toFixed(2)}%)`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
