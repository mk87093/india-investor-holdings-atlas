import { newsSources, sortNews, type NewsCategory, type NewsArticle, type NewsFeedResult } from "./news";
import { parseNewsFeed } from "./news-parser";

const cache = new Map<string, { articles: NewsArticle[]; at: number }>();
const pending = new Map<NewsCategory, Promise<NewsFeedResult>>();
const categoryCache = new Map<NewsCategory, { result: NewsFeedResult; at: number }>();
const TTL = 5 * 60_000;

export async function fetchMarketNews(category: NewsCategory): Promise<NewsFeedResult> {
  const cached = categoryCache.get(category);
  if (cached && Date.now() - cached.at < TTL) return cached.result;
  const inflight = pending.get(category);
  if (inflight) return inflight;
  const task = (async () => {
    const selected = newsSources.filter((s) => s.category === category);
    const articles: NewsArticle[] = [];
    const statuses: NewsFeedResult["sources"] = [];
    for (let i = 0; i < selected.length; i += 6) {
      await Promise.all(selected.slice(i, i + 6).map(async (source) => {
        try {
          const response = await fetch(source.feed, { signal: AbortSignal.timeout(12_000), headers: { "User-Agent": "MarketNewsReader/1.0", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" } });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const xml = await response.text();
          if (xml.length > 3_000_000) throw new Error("Feed too large");
          const rows = parseNewsFeed(xml, source);
          if (!rows.length) throw new Error("Empty feed");
          cache.set(source.id, { articles: rows, at: Date.now() });
          articles.push(...rows);
          statuses.push({ id: source.id, name: source.name, status: "ok", count: rows.length });
        } catch (e) {
          console.warn(`News source ${source.id} unavailable`, e instanceof Error ? e.message : "Fetch failed");
          const old = cache.get(source.id);
          const rows = old && Date.now() - old.at < 24 * 3600_000 ? old.articles : [];
          articles.push(...rows);
          statuses.push({ id: source.id, name: source.name, status: rows.length ? "stale" : "unavailable", count: rows.length });
        }
      }));
    }
    const result = { articles: sortNews(articles), sources: statuses.sort((a, b) => a.name.localeCompare(b.name)), fetchedAt: new Date().toISOString() };
    categoryCache.set(category, { result, at: Date.now() });
    return result;
  })();
  pending.set(category, task);
  try { return await task; } finally { pending.delete(category); }
}