import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMarketOverview } from "./market.functions";

export type OverviewRow = Awaited<ReturnType<typeof getMarketOverview>>[number];

export function useOverview() {
  const fn = useServerFn(getMarketOverview);
  return useQuery({
    queryKey: ["overview"],
    queryFn: () => fn(),
    staleTime: 30 * 60 * 1000,
    refetchInterval: 6 * 60 * 60 * 1000,
  });
}
