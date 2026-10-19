import { describe, it, expect } from "vitest";
import { monthlyTotals } from "@/lib/flows.functions";
const d = (date: string, fii: number, dii: number) => ({ date, fii, dii, fiiBuy: 0, fiiSell: 0, diiBuy: 0, diiSell: 0 });
describe("monthlyTotals", () => {
  it("sums daily net flows per month, newest first", () => {
    const m = monthlyTotals([d("2026-09-30", 100, -50), d("2026-10-01", -200, 300), d("2026-10-02", 50, 10)]);
    expect(m.map((x) => [x.month, x.fii, x.dii, x.days])).toEqual([["2026-10", -150, 310, 2], ["2026-09", 100, -50, 1]]);
  });
});
