import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMarketOverview } from "./market.functions";

export type OverviewRow = Awaited<ReturnType<typeof getMarketOverview>>["rows"][number];

export function useOverview() {
  const fn = useServerFn(getMarketOverview);
  return useQuery({ queryKey: ["overview"], queryFn: () => fn(), staleTime: 5 * 60 * 1000, refetchInterval: 10 * 60 * 1000 });
}
