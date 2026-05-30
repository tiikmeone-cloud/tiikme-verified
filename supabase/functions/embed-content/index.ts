/**
 * embed-content — generate OpenAI text-embedding-3-small embeddings for posts and flicks.
 *
 * Call via Supabase DB webhook (on insert to posts / flicks) OR directly:
 *   POST /functions/v1/embed-content
 *   { "type": "post" | "flick", "id": "<uuid>", "text": "<content to embed>" }
 *
 * Requires env vars:
 *   OPENAI_API_KEY     - your OpenAI secret key
 *   SUPABASE_URL       - auto-injected by Supabase
 *   SUPABASE_SERVICE_ROLE_KEY - auto-injected by Supabase
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API = "https://api.openai.com/v1/embeddings";
const MODEL = "text-embedding-3-small";
const DIMENSIONS = 1536;

async function embed(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch(OPENAI_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL, input: text.slice(0, 8000), dimensions: DIMENSIONS }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${err}`);
  }
  const json = await res.json();
  return json.data[0].embedding as number[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let body: { type?: string; id?: string; text?: string; record?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Support Supabase DB webhook payload (record.* + table name in header) or direct call
  const table = req.headers.get("x-table-name") || body.type;
  const record = body.record || {};
  const id = (record.id as string) || body.id;
  const rawText = (record.content as string) || (record.alt_text as string) || body.text || "";

  if (!id || !rawText) {
    return new Response(JSON.stringify({ error: "id and text/content required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const embedding = await embed(rawText, openaiKey);
    const targetTable = table === "flick" || table === "flicks" ? "flicks" : "posts";
    const { error } = await sb.from(targetTable).update({ embedding } as any).eq("id", id);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, id, table: targetTable, dims: embedding.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
