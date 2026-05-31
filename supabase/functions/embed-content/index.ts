/**
 * embed-content — generate text-embedding-3-small embeddings.
 *
 * Supports: posts, flicks, profiles, opportunities
 *
 * Direct call:
 *   POST /functions/v1/embed-content
 *   { "type": "post"|"flick"|"profile"|"opportunity", "id": "<uuid>", "text": "<text>" }
 *
 * DB webhook (x-table-name header set by Supabase):
 *   body.record contains the inserted/updated row
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
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.data[0].embedding as number[];
}

function resolveTable(type: string | undefined | null): string {
  if (!type) return "posts";
  if (type === "flick" || type === "flicks") return "flicks";
  if (type === "profile" || type === "profiles") return "profiles";
  if (type === "opportunity" || type === "opportunities") return "opportunities";
  return "posts";
}

function extractText(record: Record<string, unknown>, type: string): string {
  if (type === "profiles" || type === "profile") {
    const parts = [
      record.full_name, record.headline, record.designation,
      record.sector, record.bio, record.location_city, record.location_state,
      Array.isArray(record.skills) ? (record.skills as string[]).join(", ") : "",
    ];
    return parts.filter(Boolean).join(" ");
  }
  if (type === "opportunities" || type === "opportunity") {
    return [record.title, record.description, record.location, record.type].filter(Boolean).join(" ");
  }
  return (record.content as string) || (record.alt_text as string) || "";
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

  const webhookTable = req.headers.get("x-table-name");
  const typeHint = webhookTable || body.type;
  const record = body.record || {};
  const id = (record.id as string) || body.id;

  const rawText = body.text || extractText(record, typeHint || "");

  if (!id || !rawText.trim()) {
    return new Response(JSON.stringify({ error: "id and text required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const targetTable = resolveTable(typeHint);

  try {
    const embedding = await embed(rawText, openaiKey);
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
