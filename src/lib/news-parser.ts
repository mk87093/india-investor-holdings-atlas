import { XMLParser, XMLValidator } from "fast-xml-parser";
import { safeNewsUrl, type NewsArticle, type NewsSource } from "./news";

const plainText = (v: unknown): string => {
  if (typeof v !== "string") return typeof v === "number" ? String(v) : "";
  const entities: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—" };
  return v.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (!entity.startsWith("#")) return entities[entity] ?? match;
    const n = entity.startsWith("#x") ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
  }).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};
const array = (v: unknown): unknown[] => v == null ? [] : Array.isArray(v) ? v : [v];
const record = (v: unknown): Record<string, unknown> => typeof v === "object" && v !== null ? v as Record<string, unknown> : {};

export function parseNewsFeed(xml: string, source: NewsSource): NewsArticle[] {
  if (!/<(?:rss|feed|rdf:RDF)\b/i.test(xml) || XMLValidator.validate(xml) !== true) throw new Error("Invalid news feed");
  const parser = new XMLParser({ ignoreAttributes: false, processEntities: false, parseTagValue: false, trimValues: true });
  const root = record(parser.parse(xml));
  const channel = record(record(root["rss"])["channel"]);
  const items = array(channel["item"] ?? record(root["feed"])["entry"] ?? record(root["rdf:RDF"])["item"]);
  return items.slice(0, 60).flatMap((entry) => {
    const item = record(entry);
    const atomLink = array(item["link"]).map(record).find((link) => link["@_rel"] === "alternate" || !link["@_rel"]);
    const url = safeNewsUrl(typeof item["link"] === "string" ? item["link"] : atomLink?.["@_href"]);
    const title = plainText(item["title"]);
    if (!url || !title) return [];
    const date = Date.parse(plainText(item["pubDate"] ?? item["published"] ?? item["updated"] ?? item["dc:date"]));
    return [{ id: `${source.id}:${url}`, title, url, summary: plainText(item["description"] ?? item["summary"] ?? item["content:encoded"]).slice(0, 320), publishedAt: Number.isFinite(date) ? new Date(date).toISOString() : null, sourceId: source.id, sourceName: source.name, category: source.category }];
  });
}