import { describe, expect, it } from "vitest";
import { newsCategories, newsSources, safeNewsUrl, sortNews } from "@/lib/news";
import { parseNewsFeed } from "@/lib/news-parser";

const source = newsSources[0];
if (!source) throw new Error("Missing source");
describe("Market news", () => {
  it.each(["india", "global", "commodity", "crypto", "rbi", "fed"])("covers the requested %s category", (category) => {
    expect(newsCategories.some((c) => c.id === category)).toBe(true);
    expect(newsSources.filter((s) => s.category === category).length).toBeGreaterThan(0);
  });
  it("keeps RBI releases separate from Fed releases", () => {
    expect(newsSources.filter((s) => s.category === "rbi").every((s) => new URL(s.feed).hostname.endsWith("rbi.org.in"))).toBe(true);
    expect(newsSources.filter((s) => s.category === "fed").every((s) => new URL(s.feed).hostname.endsWith("federalreserve.gov"))).toBe(true);
  });
  it("reads RSS headlines, dates and summaries without rendering HTML", () => {
    const rows = parseNewsFeed('<rss><channel><item><title>Markets rally</title><link>https://example.com/news</link><pubDate>Thu, 22 Oct 2026 10:00:00 GMT</pubDate><description><![CDATA[<p>Stocks rise</p>]]></description></item></channel></rss>', source);
    expect(rows[0]?.publishedAt).toBe("2026-10-22T10:00:00.000Z");
    expect(rows[0]?.summary).toBe("Stocks rise");
  });
  it("reads Atom alternate links and tolerates absent publication dates", () => {
    const rows = parseNewsFeed('<feed><entry><title>Policy decision</title><link rel="alternate" href="https://example.com/policy" /></entry></feed>', source);
    expect(rows[0]?.url).toBe("https://example.com/policy");
    expect(rows[0]?.publishedAt).toBeNull();
  });
  it("decodes publisher character entities", () => {
    const rows = parseNewsFeed('<rss><channel><item><title>Board&amp;#39;s decision</title><link>https://example.com/release</link><description><![CDATA[Board&#39;s decision &amp; policy]]></description></item></channel></rss>', source);
    expect(rows[0]?.summary).toBe("Board's decision & policy");
  });
  it("rejects unsafe links and HTML masquerading as feeds", () => {
    expect(safeNewsUrl("javascript:alert(1)")).toBeNull();
    expect(parseNewsFeed('<rss><channel><item><title>Unsafe</title><link>javascript:alert(1)</link></item></channel></rss>', source)).toEqual([]);
    expect(() => parseNewsFeed("<html>Access denied</html>", source)).toThrow();
  });
  it("sorts newest first and removes repeated headlines", () => {
    const rows = parseNewsFeed('<rss><channel><item><title>Older</title><link>https://example.com/old</link><pubDate>21 Oct 2026 10:00:00 GMT</pubDate></item><item><title>Newer</title><link>https://example.com/new</link><pubDate>22 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>', source);
    expect(sortNews([...rows, ...rows]).map((a) => a.title)).toEqual(["Newer", "Older"]);
  });
});