import { createServerFn } from "@tanstack/react-start";

export const getMarketBreadth = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { quoteSnapshot } = await import("./breadth.server");
    const { fno, cash, at, error } = await quoteSnapshot();
    return { fno, cash, at, error };
  } catch (error) {
    console.error("Market breadth unavailable", error);
    return { fno: null, cash: null, at: new Date().toISOString(), error: "Market breadth unavailable. Please try again shortly." };
  }
});