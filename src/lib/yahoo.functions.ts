import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchQuotes, fetchSummary } from "./yahoo.server";

const SYM = z.string().regex(/^[A-Z0-9&-]{1,20}$/);

export const getLiveQuotes = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ symbols: z.array(SYM).max(100) }).parse(d))
  .handler(async ({ data }) => {
    try {
      return { quotes: await fetchQuotes(data.symbols), error: null as string | null };
    } catch (e) {
      console.error(e);
      return { quotes: {}, error: "Live data unavailable right now" };
    }
  });

export const getLiveSummary = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ symbol: SYM }).parse(d))
  .handler(async ({ data }) => {
    try {
      return { summary: await fetchSummary(data.symbol), error: null as string | null };
    } catch (e) {
      console.error(e);
      return { summary: null, error: "Live data unavailable right now" };
    }
  });
