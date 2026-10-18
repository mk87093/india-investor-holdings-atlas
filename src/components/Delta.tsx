import { cn } from "@/lib/utils";

export function Delta({ value, suffix = "", className }: { value: number; suffix?: string; className?: string }) {
  const pos = value > 0, neg = value < 0;
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-0.5 font-mono text-xs font-semibold tabular-nums",
        pos && "border-gain/40 bg-gain/15 text-gain",
        neg && "border-loss/40 bg-loss/15 text-loss",
        !pos && !neg && "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      {pos ? "▲ +" : neg ? "▼ " : ""}
      {value.toFixed(2)}
      {suffix}
    </span>
  );
}
