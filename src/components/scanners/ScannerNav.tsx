import { Link } from "@tanstack/react-router";

const tabs = [
  { to: "/", label: "Institutional Holdings", exact: true },
  { to: "/reversal", label: "Reversal Screener", exact: false },
  { to: "/three-candle", label: "3 Candle Scanner", exact: false },
  { to: "/scanner", label: "Cash Scanner", exact: false },
] as const;

export function ScannerNav() {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-2">
      {tabs.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent"
          activeProps={{ className: "bg-primary text-primary-foreground border-primary" }}
          activeOptions={t.exact ? { exact: true } : undefined}
        >{t.label}</Link>
      ))}
    </nav>
  );
}

export const istTime = (t: number) => new Date(t * 1000).toISOString().slice(11, 16);
