import type { Candle } from "@/lib/breakout";

export type Marker = { t: number; side: "BUY" | "SELL"; level?: number; label?: string };
const START = 555, END = 930, SPAN = END - START; // 09:15–15:30 IST in minutes
const mins = (t: number) => Math.floor(t / 60) % 1440; // candle times are already IST-shifted
const lbl = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const UP = "hsl(142 71% 45%)", DN = "hsl(0 72% 51%)";

export function CandleChart({ candles, markers = [] }: { candles: Candle[]; markers?: Marker[] }) {
  if (!candles.length) return <p className="p-4 text-xs text-muted-foreground">No chart data</p>;
  const hi = Math.max(...candles.map((c) => c.high)), lo = Math.min(...candles.map((c) => c.low)), rng = hi - lo || 1;
  const y = (p: number) => 8 + ((hi - p) / rng) * 244;
  const vmax = Math.max(...candles.map((c) => c.volume), 1);
  const vy = (v: number) => 318 - (v / vmax) * 50;
  const w = Math.max(1, (708 / (SPAN / 5)) * 0.65);
  const x = (t: number) => 8 + ((Math.min(END, Math.max(START, mins(t))) - START) / SPAN) * 708;
  return (
    <svg viewBox="0 0 760 340" className="h-auto w-full">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => { const p = lo + rng * f; return (
        <g key={f}><line x1={8} x2={716} y1={y(p)} y2={y(p)} className="stroke-border" strokeDasharray="2 4" /><text x={720} y={y(p) + 4} className="fill-muted-foreground" fontSize={10}>{p.toFixed(1)}</text></g>
      ); })}
      {candles.map((c) => { const col = c.close >= c.open ? UP : DN; return (
        <g key={c.time}>
          <line x1={x(c.time)} x2={x(c.time)} y1={y(c.high)} y2={y(c.low)} stroke={col} />
          <rect x={x(c.time) - w / 2} width={w} y={y(Math.max(c.open, c.close))} height={Math.max(1, Math.abs(y(c.open) - y(c.close)))} fill={col} />
          <rect x={x(c.time) - w / 2} width={w} y={vy(c.volume)} height={Math.max(1, 318 - vy(c.volume))} fill={col} opacity={0.5} />
        </g>
      ); })}
      {markers.map((m) => {
        const c = candles.find((k) => k.time === m.t); if (!c) return null;
        const buy = m.side === "BUY", col = buy ? UP : DN, cx = x(c.time);
        const tip = buy ? y(c.low) + 3 : y(c.high) - 3, base = buy ? tip + 9 : tip - 9, ty = buy ? base + 20 : base - 14;
        return (
          <g key={`${m.side}-${m.t}`}>
            {m.level !== undefined && <line x1={8} x2={716} y1={y(m.level)} y2={y(m.level)} stroke={col} strokeDasharray="4 3" opacity={0.6} />}
            <polygon points={`${cx},${tip} ${cx - 5},${base} ${cx + 5},${base}`} fill={col} />
            <line x1={cx} x2={cx} y1={base} y2={buy ? base + 8 : base - 8} stroke={col} strokeWidth={2} />
            <text x={cx} y={ty} textAnchor="middle" fontSize={11} fontWeight={700} fill={col}>{m.label ?? m.side}</text>
          </g>
        );
      })}
      <text x={2} y={278} className="fill-muted-foreground" fontSize={9}>Vol</text>
      {[555, 630, 705, 780, 855, 930].map((m) => <text key={m} x={8 + ((m - START) / SPAN) * 708} y={334} textAnchor="middle" className="fill-muted-foreground" fontSize={10}>{lbl(m)}</text>)}
    </svg>
  );
}
