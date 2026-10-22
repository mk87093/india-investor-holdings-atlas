import { MarketBreadth } from "./MarketBreadth";

export function ScannerNav() {
  return <MarketBreadth />;
}

export const istTime = (t: number) => new Date(t * 1000).toISOString().slice(11, 16);
