import { createServerFn } from "@tanstack/react-start";

export const getGlobalMarkets = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchGlobalMarkets } = await import("./global-markets.server");
  return fetchGlobalMarkets();
});