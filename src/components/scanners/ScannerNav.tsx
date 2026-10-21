import { Link } from "@tanstack/react-router";

const tabs = [
  { to: "/reversal", label: "Reversal Screener" },
  { to: "/three-candle", label: "3 Candle Scanner" },
  { to: "/scanner", label: "Cash Scanner" },
] as const;

export function ScannerNav() {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-2">
      <Link to="/" className="mr-2 text-sm text-primary hover:underline">← Holdings</Link>
      {tabs.map((t) => (
        <Link key={t.to} to={t.to} className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent" activeProps={{ className: "bg-primary text-primary-foreground border-primary" }}>{t.label}</Link>
      ))}
    </nav>
  );
}

export const istTime = (t: number) => new Date(t * 1000).toISOString().slice(11, 16);
