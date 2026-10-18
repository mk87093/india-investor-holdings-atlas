import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { sectorStats } from "@/lib/stocks";

type Row = { sector: string; fii: number | null; dii: number | null };

export function SectorChart({ rows, active, onSelect }: { rows: Row[]; active: string; onSelect: (s: string) => void }) {
  const data = sectorStats(rows);
  const click = (d: unknown) => {
    const s = d as { sector?: string; payload?: { sector?: string } };
    const sec = s.sector ?? s.payload?.sector;
    if (sec) onSelect(sec === active ? "all" : sec);
  };
  return (
    <div className="mb-8 rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">Average FII vs DII holding by sector</h2>
        <p className="text-xs text-muted-foreground">Click a bar to see that sector's stocks</p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="sector" angle={-40} textAnchor="end" interval={0} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
            <YAxis unit="%" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
            <Tooltip
              cursor={{ fill: "var(--accent)" }}
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" }}
              formatter={(v: number, n: string) => [`${v}%`, n]}
            />
            <Legend verticalAlign="top" />
            <Bar dataKey="fii" name="FII %" fill="var(--primary)" radius={[4, 4, 0, 0]} onClick={click} className="cursor-pointer" />
            <Bar dataKey="dii" name="DII %" fill="var(--chart-2)" radius={[4, 4, 0, 0]} onClick={click} className="cursor-pointer" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
