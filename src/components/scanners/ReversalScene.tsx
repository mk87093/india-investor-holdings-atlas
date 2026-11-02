import { useState } from "react";
import type { FnoRow } from "@/lib/fno.functions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CandleChart } from "./CandleChart";
import { REVERSAL_BOX_COUNT, sectorFlow } from "@/lib/reversal-layout";

const W = 1200, ROW = 28, TOP = 40, BOX_W = 230, SEC_W = 170;

export function ReversalScene({ up, down, sectors }: { up: FnoRow[]; down: FnoRow[]; sectors: Record<string, string> }) {
  const [selected, setSelected] = useState<{ row: FnoRow; buy: boolean } | null>(null);
  const stocks = [...up.slice(0, REVERSAL_BOX_COUNT).map(row => ({ row, buy: true })), ...down.slice(0, REVERSAL_BOX_COUNT).map(row => ({ row, buy: false }))];
  const flows = sectorFlow(up.slice(0, REVERSAL_BOX_COUNT), down.slice(0, REVERSAL_BOX_COUNT), sectors);
  const H = TOP + stocks.length * ROW + 20;
  const cx = W / 2, cy = TOP + (stocks.length * ROW) / 2;
  const secGap = flows.length > 1 ? (stocks.length * ROW - ROW) / (flows.length - 1) : 0;
  const secY = (i: number) => flows.length > 1 ? TOP + ROW / 2 + i * secGap : cy;
  const curve = (x1: number, y1: number, x2: number, y2: number) => `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`;
  return <>
    <div className="w-full overflow-x-auto rounded-md border border-border bg-terminal">
      <div className="reversal-scene relative" data-scene-ready="true">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Sector orderflow to buy and sell stocks">
          <defs><filter id="neon"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
          <text x={12} y={22} className="fill-muted-foreground font-mono" fontSize={11}>SECTOR ORDERFLOW · STRONGEST → WEAKEST</text>
          <text x={W - 12} y={22} textAnchor="end" className="fill-muted-foreground font-mono" fontSize={11}>CLICK A STOCK FOR 5M CHART</text>
          <line x1={cx} x2={cx} y1={TOP - 10} y2={H - 10} className="stroke-foreground" strokeOpacity={.5} filter="url(#neon)" />
          {flows.map((f, i) => { const pos = f.pct >= 0; const d = curve(12 + SEC_W, secY(i), cx, cy); return <g key={f.name} className={pos ? "text-gain" : "text-loss"}>
            <path d={d} fill="none" stroke="currentColor" strokeOpacity={.35} strokeWidth={1.2} />
            <path d={d} fill="none" stroke="currentColor" strokeWidth={2.5} className="neon-flow" filter="url(#neon)" style={{ animationDelay: `${-i * .4}s` }} />
            <rect x={12} y={secY(i) - 11} width={SEC_W} height={22} className="fill-background" fillOpacity={.6} /><rect x={12} y={secY(i) - 11} width={3} height={22} fill="currentColor" />
            <text x={22} y={secY(i) + 4} fontSize={11} className="fill-foreground font-mono">{f.name.slice(0, 16)}</text>
            <text x={12 + SEC_W - 6} y={secY(i) + 4} fontSize={11} textAnchor="end" fill="currentColor" className="font-mono">{pos ? "+" : ""}{f.pct.toFixed(2)}%</text>
          </g>; })}
          {stocks.map(({ row, buy }, i) => { const y = TOP + i * ROW + ROW / 2, x = W - 12 - BOX_W; const d = curve(cx, cy, x, y); const pct = buy ? row.fromLowPct : -row.fromHighPct;
            return <g key={`${buy}-${row.symbol}`} className={`${buy ? "text-gain" : "text-loss"} cursor-pointer`} role="button" tabIndex={0} aria-label={`Open ${row.symbol} 5-min chart`} onClick={() => setSelected({ row, buy })} onKeyDown={e => { if (e.key === "Enter") setSelected({ row, buy }); }}>
              <path d={d} fill="none" stroke="currentColor" strokeOpacity={.3} />
              <path d={d} fill="none" stroke="currentColor" strokeWidth={2.5} className="neon-flow" filter="url(#neon)" style={{ animationDelay: `${-i * .2}s` }} />
              <rect x={x} y={y - 11} width={BOX_W} height={22} rx={2} className="fill-background" stroke="currentColor" strokeOpacity={.6} />
              <text x={x + 6} y={y + 4} fontSize={10} fill="currentColor" className="font-mono">{String(i % REVERSAL_BOX_COUNT + 1).padStart(2, "0")}</text>
              <rect x={x + 24} y={y - 7} width={34} height={14} fill="currentColor" /><text x={x + 41} y={y + 4} fontSize={9} textAnchor="middle" className="fill-background font-mono font-bold">{buy ? "BULL" : "BEAR"}</text>
              <text x={x + 64} y={y + 4} fontSize={11} className="fill-foreground font-mono font-bold">{row.symbol}</text>
              <text x={x + BOX_W - 6} y={y + 4} fontSize={11} textAnchor="end" fill="currentColor" className="font-mono">{pct >= 0 ? "+" : ""}{pct.toFixed(2)}%</text>
            </g>; })}
          <circle cx={cx} cy={cy} r={4} className="fill-foreground" filter="url(#neon)" />
        </svg>
      </div>
    </div>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto bg-terminal text-foreground">
        {selected && <><DialogHeader><DialogTitle className="pr-6 font-mono tracking-normal">{selected.row.symbol} · 5-min chart</DialogTitle><DialogDescription>{sectors[selected.row.symbol] || "Sector unavailable"} · LTP ₹{selected.row.ltp.toFixed(2)} · {selected.buy ? `${selected.row.fromLowPct.toFixed(2)}% up from low` : `${selected.row.fromHighPct.toFixed(2)}% down from high`}</DialogDescription></DialogHeader><CandleChart candles={selected.row.candles} /></>}
      </DialogContent>
    </Dialog>
  </>;
}
