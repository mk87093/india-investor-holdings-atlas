import { describe, expect, it } from "vitest";
import { marketBreadth } from "@/lib/breadth";

describe("market breadth", () => {
  it("counts advances, declines and unchanged against previous close", () => {
    expect(marketBreadth(["UP", "DOWN", "FLAT"], [
      { symbol: "UP.NS", regularMarketPrice: 105, regularMarketPreviousClose: 100 },
      { symbol: "DOWN.NS", regularMarketPrice: 95, regularMarketPreviousClose: 100 },
      { symbol: "FLAT.NS", regularMarketPrice: 100, regularMarketPreviousClose: 100 },
    ])).toMatchObject({ advances: 1, declines: 1, unchanged: 1, covered: 3, missing: 0 });
  });
  it("keeps F&O and cash counts separate across the unfiltered universe", () => {
    const quotes = [{ symbol: "FNO.NS", regularMarketPrice: 105, regularMarketChange: 5 }, { symbol: "CASH.NS", regularMarketPrice: 95, regularMarketChange: -5 }];
    expect(marketBreadth(["FNO"], quotes)).toMatchObject({ total: 1, advances: 1, declines: 0 });
    expect(marketBreadth(["CASH"], quotes)).toMatchObject({ total: 1, advances: 0, declines: 1 });
  });
  it("reports invalid and missing quotes as missing, never unchanged, and deduplicates", () => {
    expect(marketBreadth(["A", "A", "B", "C"], [
      { symbol: "A.NS", regularMarketPrice: 10, regularMarketChange: 0 },
      { symbol: "A.NS", regularMarketPrice: 10, regularMarketChange: 0 },
      { symbol: "B.NS", regularMarketPrice: 10 },
      { symbol: "C.NS", regularMarketPrice: NaN, regularMarketChange: 0 },
    ])).toMatchObject({ total: 3, covered: 1, unchanged: 1, missing: 2 });
  });
});