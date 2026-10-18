import { describe, it, expect } from "vitest";
import { rankByFii, pctChange, capBucket } from "@/lib/stocks";
import { parseSectionTable } from "@/lib/screener.server";

describe("ranking", () => {
  it("ranks by highest FII holding first, missing data last", () => {
    const r = rankByFii([{ s: "A", fii: 10 }, { s: "B", fii: null }, { s: "C", fii: 40 }]);
    expect(r.map((x) => x.s)).toEqual(["C", "A", "B"]);
  });
  it("computes percent change sign", () => {
    expect(pctChange(90, 100)).toBe(-10);
  });
  it("buckets market cap by ₹ Cr thresholds", () => {
    expect(capBucket(600000)).toBe("mega");
    expect(capBucket(100000)).toBe("large");
    expect(capBucket(10000)).toBe("mid");
  });
});

describe("shareholding parser", () => {
  it("reads FII/DII rows per quarter", () => {
    const html = `<section id="shareholding"><table><tr><th></th><th>Mar 2026</th><th>Jun 2026</th></tr>
      <tr><td class="text"><button>FIIs&nbsp;+</button></td><td>18.67%</td><td>17.19%</td></tr>
      <tr><td class="text">DIIs +</td><td>20.46%</td><td>21.10%</td></tr></table></section>`;
    const t = parseSectionTable(html, "shareholding");
    expect(t.headers).toEqual(["Mar 2026", "Jun 2026"]);
    expect(t.rows["FIIs"]).toEqual([18.67, 17.19]);
    expect(t.rows["DIIs"]).toEqual([20.46, 21.1]);
  });
});

import { syncStatus } from "@/lib/market.functions";
describe("sync status", () => {
  it("estimates completion at 5 stocks per minute", () => {
    const s = syncStatus(2605, 2500, 10);
    expect(s.synced).toBe(95);
    expect(s.etaMinutes).toBe(500);
  });
});
