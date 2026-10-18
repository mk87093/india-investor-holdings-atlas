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
