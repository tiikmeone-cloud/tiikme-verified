import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SYSTEM_PROMPT = `You are a professional profile parser for Tiikme, an Indian professional networking platform.
Extract structured profile data from the raw text the user provides (pasted resume, LinkedIn summary, or freeform work history).

Return ONLY valid JSON with this exact shape (no markdown, no explanation):
{
  "headline": "Short professional headline, max 12 words, present tense (e.g. 'Senior Software Engineer at Infosys | 5 yrs | Hyderabad')",
  "bio": "2-3 sentence professional summary, first person, honest, no buzzwords",
  "experiences": [
    {
      "job_title": "string",
      "company_name": "string",
      "employment_type": "Full-time|Part-time|Contract|Internship|Freelance",
      "start_month": "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec or null",
      "start_year": number or null,
      "end_month": "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec or null",
      "end_year": number or null,
      "is_current": boolean,
      "description": "2-3 sentences about the role, achievements, responsibilities",
      "work_location": "Remote|Hybrid|Onsite or null",
      "skills_used": ["skill1", "skill2"]
    }
  ],
  "education": [
    {
      "institution_name_edu": "string",
      "degree_type": "B.Tech|B.E.|B.Sc|B.Com|BBA|MBA|M.Tech|M.Sc|MBBS|MD|Diploma|12th|10th|PhD|Other",
      "field_of_study": "string or null",
      "start_year": number or null,
      "end_year": number or null,
      "grade_score": "CGPA/percentage string or null"
    }
  ],
  "skills": ["skill1", "skill2", "skill3"]
}

Rules:
- experiences: most recent first, max 8
- education: most recent first, max 4
- skills: unique strings, max 20, extract from experience + any explicit skills section
- If a field cannot be determined, use null
- employment_type: default to "Full-time" if not specified for non-internships
- Keep descriptions honest and factual — do not embellish
- Output ONLY the JSON object, nothing else`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const openAiKey = Deno.env.get("OPENAI_API_KEY");

  if (!openAiKey) return json({ error: "AI service not configured" }, 503);

  const supabase = createClient(supabaseUrl, supabaseKey);
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  let body: { raw_text?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }

  const rawText = (body.raw_text || "").trim();
  if (!rawText || rawText.length < 30) return json({ error: "Please provide more text (at least a few sentences)" }, 400);
  if (rawText.length > 8000) return json({ error: "Text too long — please trim to under 8000 characters" }, 400);

  try {
    const oaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openAiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 2000,
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Parse this into a structured profile:\n\n${rawText}` },
        ],
      }),
    });

    if (!oaiRes.ok) {
      const errText = await oaiRes.text();
      console.error("[structure-profile] OpenAI error:", errText);
      return json({ error: "AI service error — try again" }, 502);
    }

    const payload = await oaiRes.json();
    const content = payload.choices?.[0]?.message?.content || "";

    let structured: unknown;
    try {
      // Strip any accidental markdown fences
      const cleaned = content.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
      structured = JSON.parse(cleaned);
    } catch {
      console.error("[structure-profile] JSON parse error:", content);
      return json({ error: "AI returned unexpected format — try again" }, 502);
    }

    return json({ ok: true, data: structured });
  } catch (e) {
    console.error("[structure-profile] error:", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
