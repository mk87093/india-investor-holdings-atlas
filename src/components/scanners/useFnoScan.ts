import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { runFnoScan } from "@/lib/fno.functions";

export function useFnoScan() {
  const fn = useServerFn(runFnoScan);
  const [data, setData] = useState<Awaited<ReturnType<typeof runFnoScan>> | null>(null);
  const [busy, setBusy] = useState(false);
  const scan = useCallback(async () => { setBusy(true); try { setData(await fn()); } finally { setBusy(false); } }, [fn]);
  useEffect(() => { scan(); const t = setInterval(scan, 60_000); return () => clearInterval(t); }, [scan]);
  return { data, busy, scan };
}
