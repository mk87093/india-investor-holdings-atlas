import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BarChart3, CalendarDays, ChartCandlestick, Globe2, Landmark, Newspaper, ScanLine, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IndexTicker } from "@/components/IndexTicker";
import bullImg from "@/assets/bull-3d.png";
import bearImg from "@/assets/bear-3d.png";

const tabs = [
  { to: "/", label: "Institutional Holdings", icon: Landmark },
  { to: "/results", label: "Results Calendar", icon: CalendarDays },
  { to: "/monthly", label: "Monthly FII/DII Flows", icon: BarChart3 },
  { to: "/reversal", label: "Reversal Screener", icon: TrendingUp },
  { to: "/three-candle", label: "3 Candle Scanner", icon: ChartCandlestick },
  { to: "/scanner", label: "Cash Scanner", icon: ScanLine },
  { to: "/news", label: "Market News", icon: Newspaper },
  { to: "/global", label: "Global Indices", icon: Globe2 },
] as const;

function MarketClock() {
  const [now, setNow] = useState<{ time: string; date: string } | null>(null);
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow({
        time: d.toLocaleTimeString("en-IN", { hour12: false, timeZone: "Asia/Kolkata" }),
        date: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }),
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs">
      <span className="relative flex size-2" aria-hidden="true">
        <span className="absolute inline-flex size-full animate-ping motion-reduce:animate-none rounded-full bg-gain opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-gain" />
      </span>
      <span className="tabular-nums text-sm font-semibold text-foreground">{now ? now.time : "--:--:--"}</span>
      <span className="text-muted-foreground">IST</span>
      <span className="hidden text-muted-foreground sm:inline">· {now?.date ?? ""}</span>
    </div>
  );
}

export function DashboardNav() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 pt-4">
        <Link to="/" className="mithun-brand group">
          <span className="flex flex-col items-center">
            <img
              src={bullImg}
              alt=""
              aria-hidden="true"
              loading="eager"
              width={816}
              height={816}
              className="mithun-beast mithun-beast-bull"
            />
            <span className="mithun-beast-label mithun-beast-label-bull">Bull</span>
          </span>

          <span className="flex min-w-0 flex-col items-center px-1">
            <span className="mithun-wordmark text-2xl font-black leading-none tracking-[0.2em] sm:text-3xl">
              MITHUN
            </span>
            <span className="mithun-rule mt-2 w-40 max-w-full" aria-hidden="true" />
            <span className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.34em] text-muted-foreground">
              Market Screener
            </span>
          </span>

          <span className="flex flex-col items-center">
            <img
              src={bearImg}
              alt=""
              aria-hidden="true"
              loading="eager"
              width={816}
              height={816}
              className="mithun-beast mithun-beast-bear"
            />
            <span className="mithun-beast-label mithun-beast-label-bear">Bear</span>
          </span>
        </Link>
        <MarketClock />
      </div>
      <IndexTicker />
      <nav aria-label="Dashboard navigation" className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-4 sm:grid-cols-3 lg:flex lg:flex-wrap">
        {tabs.map(({ to, label, icon: Icon }) => (
          <Button key={to} asChild variant="outline" className="h-auto min-h-10 justify-start whitespace-normal text-left hover:text-foreground">
            <Link to={to} activeOptions={{ exact: true }} activeProps={{ className: "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" }}>
              <Icon /><span>{label}</span>
            </Link>
          </Button>
        ))}
      </nav>
    </header>
  );
}
