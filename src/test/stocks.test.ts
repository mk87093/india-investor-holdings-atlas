import { describe, it, expect } from "vitest";
import { ranked, pctChange } from "@/lib/stocks";

describe("ranking", () => {
  it("ranks by highest FII holding first", () => {
    const r = ranked();
    for (let i = 1; i < r.length; i++) expect(r[i - 1].fii).toBeGreaterThanOrEqual(r[i].fii);
    expect(r[0].symbol).toBe("AXISBANK");
  });
  it("computes percent change sign", () => {
    expect(pctChange(90, 100)).toBe(-10);
    expect(pctChange(110, 100)).toBeCloseTo(10);
  });
});
