import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getMarketNews = createServerFn({ method: "GET" })
  .inputValidator(z.object({ category: z.enum(["india", "global", "commodity", "crypto", "rbi", "fed"]) }))
  .handler(async ({ data }) => {
    const { fetchMarketNews } = await import("./news.server");
    return fetchMarketNews(data.category);
  });