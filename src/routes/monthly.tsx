import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getFlows } from "@/lib/flows.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/monthly")({
  head: () => ({
    meta: [
      { title: "Monthly FII & DII Flows — NSE" },
      { name: "description", content: "Month-wise FII/FPI and DII net buying and selling in Indian markets." },
      { property: "og:title", content: "Monthly FII & DII Flows — NSE" },
      { property: "og:description", content: "Month-wise foreign and domestic institutional net investment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Monthly,
});

const cr = (v: number | null) => (v == null ? "—" : `${v > 0 ? "+" : ""}${Math.round(v).toLocaleString("en-IN")}`);
const tone = (v: number | null) => (v == null ? "" : v >= 0 ? "text-gain" : "text-loss");
const box = (v: number) => (v >= 0 ? "border-gain/50 bg-gain/10" : "border-loss/50 bg-loss/10");
const monthName = (m: string) => new Date(m + "-01T00:00:00Z").toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });

function Monthly() {
  const fn = useServerFn(getFlows);
  const { data, isLoading, isError } = useQuery({ queryKey: ["flows"], queryFn: () => fn(), staleTime: 10 * 60 * 1000 });
  const th = "p-3 text-right";
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Institutional Holdings</Link>
      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-primary">FII/FPI · DII · Monthly</p>
      <h1 className="text-3xl font-bold tracking-tight">Monthly institutional flows</h1>
      <p className="text-sm text-muted-foreground">Net buying (+) or selling (−) in the cash market, ₹ Crore. Source: NSE daily FII/DII activity, added up month-wise. Data is collected daily from when this section was added, so older months fill in over time.</p>

      {isLoading && <p className="mt-8 text-muted-foreground">Loading flows…</p>}
      {isError && <p className="mt-8 rounded-xl border border-loss/50 bg-loss/10 p-6">Couldn't load data. Please refresh in a minute.</p>}

      {data && (
        <>
          <section className="mt-8 grid gap-3 sm:grid-cols-2">
            {data.months.slice(0, 1).flatMap((m) => [
              <div key="f" className={cn("rounded-xl border p-4", box(m.fii))}><p className="text-sm text-muted-foreground">FII/FPI net · {monthName(m.month)}</p><p className={cn("font-mono text-2xl font-bold", tone(m.fii))}>₹{cr(m.fii)} Cr</p><p className="text-xs text-muted-foreground">{m.days} trading days</p></div>,
              <div key="d" className={cn("rounded-xl border p-4", box(m.dii))}><p className="text-sm text-muted-foreground">DII net · {monthName(m.month)}</p><p className={cn("font-mono text-2xl font-bold", tone(m.dii))}>₹{cr(m.dii)} Cr</p><p className="text-xs text-muted-foreground">{m.days} trading days</p></div>,
            ])}
          </section>

          <h2 className="mb-3 mt-10 text-xl font-semibold">Month-wise</h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left font-mono text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">Month</th><th className={th}>Days</th><th className={th}>FII buy</th><th className={th}>FII sell</th><th className={th}>FII net</th><th className={th}>DII buy</th><th className={th}>DII sell</th><th className={th}>DII net</th></tr>
              </thead>
              <tbody>
                {data.months.map((m) => (
                  <tr key={m.month} className="border-b border-border/50 last:border-0">
                    <td className="p-3 font-semibold">{monthName(m.month)}</td>
                    <td className="p-3 text-right font-mono">{m.days}</td>
                    <td className="p-3 text-right font-mono">{Math.round(m.fiiBuy).toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right font-mono">{Math.round(m.fiiSell).toLocaleString("en-IN")}</td>
                    <td className={cn("p-3 text-right font-mono font-semibold", tone(m.fii))}>{cr(m.fii)}</td>
                    <td className="p-3 text-right font-mono">{Math.round(m.diiBuy).toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right font-mono">{Math.round(m.diiSell).toLocaleString("en-IN")}</td>
                    <td className={cn("p-3 text-right font-mono font-semibold", tone(m.dii))}>{cr(m.dii)}</td>
                  </tr>
                ))}
                {data.months.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No data yet.</td></tr>}
              </tbody>
            </table>
          </div>

          <h2 className="mb-3 mt-10 text-xl font-semibold">Daily</h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left font-mono text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">Date</th><th className={th}>FII net</th><th className={th}>DII net</th></tr>
              </thead>
              <tbody>
                {data.days.slice(0, 60).map((d) => (
                  <tr key={d.date} className="border-b border-border/50 last:border-0">
                    <td className="p-3 font-mono">{new Date(d.date + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</td>
                    <td className={cn("p-3 text-right font-mono", tone(d.fii))}>{cr(d.fii)}</td>
                    <td className={cn("p-3 text-right font-mono", tone(d.dii))}>{cr(d.dii)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
