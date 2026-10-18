import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { syncUniverse, refreshBatch } from "@/lib/refresh.server";

export const Route = createFileRoute("/api/public/jobs/refresh-stocks")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        try {
          const sync = await syncUniverse();
          const res = await refreshBatch();
          return Response.json({ ok: true, ...sync, ...res });
        } catch (e) {
          console.error(e);
          return Response.json({ ok: false, error: e instanceof Error ? e.message : "failed" }, { status: 500 });
        }
      },
    },
  },
});
