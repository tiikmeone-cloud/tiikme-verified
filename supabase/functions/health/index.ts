/**
 * Public health endpoint.
 * Returns 200 + DB ping when both the function and Supabase REST are reachable.
 * Used by uptime monitors and load-balancer probes.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startedAt = Date.now();
  let dbOk = false;
  let dbLatencyMs: number | null = null;

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const t = Date.now();
    // Cheapest possible read: head count on a tiny table.
    const { error } = await sb.from("circles").select("id", { head: true, count: "exact" }).limit(1);
    dbLatencyMs = Date.now() - t;
    dbOk = !error;
  } catch {
    dbOk = false;
  }

  const body = {
    status: dbOk ? "ok" : "degraded",
    db: dbOk,
    dbLatencyMs,
    uptimeMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body), {
    status: dbOk ? 200 : 503,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
});
