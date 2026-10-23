<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Market data is fetched server-side: shareholding/quarterly results scraped from screener.in public pages (`src/lib/screener.server.ts`, low concurrency + 429 retry, in-memory cache), price/result dates from Yahoo Finance's unofficial API (`src/lib/yahoo.server.ts`). Why: no keyed provider available; both are free but rate-limited and may block.
- All NSE symbols live in the `stocks` table (public read). A managed HTTP schedule calls `/api/public/jobs/refresh-stocks` every minute to refresh the stalest few rows (`src/lib/refresh.server.ts`); pages read from the table, only the stock detail page scrapes live. Why: scraping 2600 pages per request is impossible under rate limits.
- All scanner pages render breadth through ScannerNav; cash screening and breadth share a cached, in-flight-coalesced quote snapshot, with breadth computed before momentum filters and missing quote coverage explicit. Why: consistent counts without duplicate full-universe provider requests.
- Dashboard navigation is mounted once in the root layout above Outlet, with all section links visible and exact active states. Why: every selected section keeps the same navigation above its data.
- Market news uses an allowlisted RSS/Atom source registry and server-side fetch with a six-connection pool, five-minute coalesced cache and explicit source failures; official central-bank feeds stay in separate categories. Why: public publisher feeds need no private keys, avoid browser CORS, and must not silently imply complete coverage.
