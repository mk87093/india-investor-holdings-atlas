import { describe, expect, it } from "vitest";
import { marketInstruments, normalizeGlobalQuote } from "@/lib/global-markets";

describe("Global market quotes", () => {
  it("covers all five requested asset categories", () => {
    expect(new Set(marketInstruments.map((r) => r.category))).toEqual(new Set(["indices", "bonds", "commodities", "crypto", "forex"]));
  });
  it("quotes USD/INR as rupees per dollar", () => {
    const pair = marketInstruments.find((r) => r.symbol === "INR=X");
    expect(pair?.unit).toBe("INR per USD");
  });
  it("preserves US Treasury yields in percent without multiplying by ten", () => {
    const instrument = marketInstruments.find((r) => r.symbol === "^TNX");
    if (!instrument) throw new Error("Missing US 10-year yield");
    expect(normalizeGlobalQuote(instrument, { regularMarketPrice: 4.25 }).price).toBe(4.25);
    expect(instrument.unit).toBe("% yield");
  });
  it("does not replace missing prices with invented zeroes", () => {
    const instrument = marketInstruments[0];
    if (!instrument) throw new Error("Missing instruments");
    expect(normalizeGlobalQuote(instrument).price).toBeNull();
  });
  it("preserves provider quote time and delay instead of the refresh time", () => {
    const instrument = marketInstruments[0];
    if (!instrument) throw new Error("Missing instruments");
    const quote = normalizeGlobalQuote(instrument, { regularMarketTime: 1_700_000_000, exchangeDataDelayedBy: 15 });
    expect(quote.quoteAt).toBe("2023-11-14T22:13:20.000Z");
    expect(quote.delayMinutes).toBe(15);
  });
});