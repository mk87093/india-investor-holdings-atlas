import { Link } from "@tanstack/react-router";
import { BarChart3, CalendarDays, ChartCandlestick, Landmark, ScanLine, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const tabs = [
  { to: "/", label: "Institutional Holdings", icon: Landmark },
  { to: "/results", label: "Results Calendar", icon: CalendarDays },
  { to: "/monthly", label: "Monthly FII/DII Flows", icon: BarChart3 },
  { to: "/reversal", label: "Reversal Screener", icon: TrendingUp },
  { to: "/three-candle", label: "3 Candle Scanner", icon: ChartCandlestick },
  { to: "/scanner", label: "Cash Scanner", icon: ScanLine },
] as const;

export function DashboardNav() {
  return (
    <header className="border-b border-border bg-background">
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