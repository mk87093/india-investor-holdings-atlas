export const newsCategories = [
  { id: "india", label: "Indian Market" },
  { id: "global", label: "Global Market" },
  { id: "commodity", label: "Commodity Market" },
  { id: "crypto", label: "Crypto Market" },
  { id: "rbi", label: "RBI" },
  { id: "fed", label: "Fed" },
] as const;

export type NewsCategory = (typeof newsCategories)[number]["id"];
export type NewsSource = { id: string; name: string; category: NewsCategory; feed: string; website: string; official?: boolean };
export const newsSources: NewsSource[] = [
  { id: "et", name: "Economic Times", category: "india", feed: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", website: "https://economictimes.indiatimes.com/markets" },
  { id: "cnbctv18", name: "CNBC TV18", category: "india", feed: "https://www.cnbctv18.com/commonfeeds/v1/cne/rss/market.xml", website: "https://www.cnbctv18.com/market/" },
  { id: "bs", name: "Business Standard", category: "india", feed: "https://www.business-standard.com/rss/markets-106.rss", website: "https://www.business-standard.com/markets" },
  { id: "mint", name: "Mint", category: "india", feed: "https://www.livemint.com/rss/markets", website: "https://www.livemint.com/market" },
  { id: "businessline", name: "Hindu BusinessLine", category: "india", feed: "https://www.thehindubusinessline.com/markets/feeder/default.rss", website: "https://www.thehindubusinessline.com/markets/" },
  { id: "tv18economy", name: "CNBC TV18 Economy", category: "india", feed: "https://www.cnbctv18.com/commonfeeds/v1/cne/rss/economy.xml", website: "https://www.cnbctv18.com/economy/" },
  { id: "cnbc", name: "CNBC", category: "global", feed: "https://www.cnbc.com/id/100003114/device/rss/rss.html", website: "https://www.cnbc.com/world/" },
  { id: "bbc", name: "BBC Business", category: "global", feed: "https://feeds.bbci.co.uk/news/business/rss.xml", website: "https://www.bbc.com/business" },
  { id: "guardian", name: "The Guardian", category: "global", feed: "https://www.theguardian.com/uk/business/rss", website: "https://www.theguardian.com/business" },
  { id: "ft", name: "Financial Times", category: "global", feed: "https://www.ft.com/markets?format=rss", website: "https://www.ft.com/markets" },
  { id: "oilprice", name: "Oilprice.com", category: "commodity", feed: "https://oilprice.com/rss/main", website: "https://oilprice.com/" },
  { id: "investing", name: "Investing.com Commodities", category: "commodity", feed: "https://www.investing.com/rss/news_25.rss", website: "https://www.investing.com/news/commodities-news" },
  { id: "coindesk", name: "CoinDesk", category: "crypto", feed: "https://www.coindesk.com/arc/outboundfeeds/rss/", website: "https://www.coindesk.com/" },
  { id: "cointelegraph", name: "Cointelegraph", category: "crypto", feed: "https://cointelegraph.com/rss", website: "https://cointelegraph.com/" },
  { id: "decrypt", name: "Decrypt", category: "crypto", feed: "https://decrypt.co/feed", website: "https://decrypt.co/" },
  { id: "rbi", name: "Reserve Bank of India", category: "rbi", feed: "https://rbi.org.in/pressreleases_rss.xml", website: "https://www.rbi.org.in/", official: true },
  { id: "fed", name: "Federal Reserve", category: "fed", feed: "https://www.federalreserve.gov/feeds/press_all.xml", website: "https://www.federalreserve.gov/newsevents.htm", official: true },
];

export type NewsArticle = { id: string; title: string; url: string; summary: string; publishedAt: string | null; sourceId: string; sourceName: string; category: NewsCategory };
export type NewsFeedResult = { articles: NewsArticle[]; sources: { id: string; name: string; status: "ok" | "unavailable" | "stale"; count: number }[]; fetchedAt: string };

export function safeNewsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:" ? url.href : null; } catch { return null; }
}

export function sortNews(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  return [...articles].sort((a, b) => (Date.parse(b.publishedAt ?? "") || 0) - (Date.parse(a.publishedAt ?? "") || 0)).filter((a) => {
    const key = `${a.category}:${a.title.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}