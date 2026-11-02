import { describe, expect, it } from "vitest";
import { rankReversals, REVERSAL_COLUMNS, REVERSAL_ROWS } from "@/lib/reversal-layout";

describe("Reversal box layout", () => {
  const stocks = Array.from({ length: 40 }, (_, i) => ({ symbol: `S${i}`, fromLowPct: i, fromHighPct: 40 - i }));
  it("shows six rows of five boxes per side", () => {
    expect(REVERSAL_COLUMNS).toBe(5);
    expect(REVERSAL_ROWS).toBe(6);
    expect(rankReversals(stocks, true)).toHaveLength(30);
    expect(rankReversals(stocks, false)).toHaveLength(30);
  });
  it("preserves descending reversal ranking without changing input stocks", () => {
    expect(rankReversals(stocks, true)[0]?.symbol).toBe("S39");
    expect(rankReversals(stocks, false)[0]?.symbol).toBe("S0");
    expect(stocks[0]?.symbol).toBe("S0");
  });
});