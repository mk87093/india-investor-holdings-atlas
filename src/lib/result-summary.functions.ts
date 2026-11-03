import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const cache = new Map<string, { at: number; text: string }>();
const TTL = 6 * 60 * 60 * 1000;

const Input = z.object({
  symbol: z.string().regex(/^[A-Z0-9&-]{1,20}$/),
  name: z.string().max(120),
  quarter: z.string().max(40).nullable(),
  resultDate: z.string().max(20).nullable(),
  sales: z.number().nullable(), salesYoY: z.number().nullable(),
  profit: z.number().nullable(), profitYoY: z.number().nullable(),
  fii: z.number().nullable(), fiiPrev: z.number().nullable(),
  dii: z.number().nullable(), diiPrev: z.number().nullable(),
  upcoming: z.boolean(),
});

export const getResultSummary = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof Input>) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = JSON.stringify(data);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL) return { summary: hit.text, error: null as string | null };
    try {
      const { generateResponse } = await import("@lovable.dev/ai-gateway");
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: "You are an Indian equity analyst. Write a short result summary in simple Hinglish (Hindi in Roman script mixed with English), 3-4 bullet points starting with '• '. Use only the given numbers, mention revenue/profit growth YoY, FII/DII holding change, and one neutral takeaway. If upcoming, describe what the last quarter showed and what to watch. No investment advice, no markdown headings.",
        input: `Data (₹ Crore, holdings %): ${key}`,
      });
      const text = (res as { output?: { type: string; content?: { type: string; text?: string }[] }[] }).output
        ?.flatMap((o) => (o.type === "message" ? o.content ?? [] : []))
        .filter((c) => c.type === "output_text").map((c) => c.text ?? "").join("").trim();
      if (!text) return { summary: null, error: "Summary abhi available nahi hai." };
      cache.set(key, { at: Date.now(), text });
      return { summary: text, error: null as string | null };
    } catch (e) {
      console.error("AI summary failed", e);
      return { summary: null, error: "AI summary abhi nahi ban paya, thodi der baad try karein." };
    }
  });
