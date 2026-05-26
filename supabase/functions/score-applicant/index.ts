import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { application_id } = await req.json();
    if (!application_id) return new Response(JSON.stringify({ error: "missing_application_id" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch application with related profile and opportunity
    const { data: app, error: appErr } = await supabase
      .from("opportunity_applications")
      .select(`
        *,
        applicant:profiles!opportunity_applications_applicant_id_fkey(
          full_name, headline, bio, skills, designation, currently_working_at, sector
        ),
        opportunity:opportunities!opportunity_applications_opportunity_id_fkey(
          title, description, skills_required, screening_questions, type, org_id
        )
      `)
      .eq("id", application_id)
      .maybeSingle();

    if (appErr || !app) {
      return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    // Verify the caller is an org admin for this opportunity's org
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });

    const { data: adminCheck } = await supabase
      .from("org_admins")
      .select("id")
      .eq("org_id", app.opportunity?.org_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminCheck) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...CORS, "Content-Type": "application/json" } });

    // Build prompt
    const profile = app.applicant || {};
    const opp = app.opportunity || {};
    const questions = (opp.screening_questions || []) as any[];
    const customAnswers = app.custom_answers || {};

    const answersText = questions.length > 0
      ? questions.map((q: any, i: number) => `Q: ${q.question || q.text || q}\nA: ${customAnswers[i] || "(no answer)"}`).join("\n")
      : "No screening questions";

    const prompt = `You are an expert recruiter AI. Score this job applicant objectively on 4 dimensions (0–25 each).

ROLE: ${opp.title || "Unknown Role"}
JOB DESCRIPTION: ${(opp.description || "").slice(0, 600)}
REQUIRED SKILLS: ${(opp.skills_required || []).join(", ") || "Not specified"}

APPLICANT:
Name: ${profile.full_name || "Unknown"}
Headline: ${profile.headline || "None"}
Skills: ${(profile.skills || []).join(", ") || "None listed"}
Currently at: ${profile.currently_working_at || "Not specified"}
Sector: ${profile.sector || "Unknown"}

WHY GOOD FIT: ${app.why_good_fit || "(not provided)"}
COVER LETTER: ${(app.cover_letter || "(not provided)").slice(0, 400)}
SCREENING ANSWERS:
${answersText}

Score on:
1. skills_match (0–25): How well their listed skills overlap with required skills
2. experience_match (0–25): Does their background suggest they can do this job?
3. answer_quality (0–25): Are their screening/cover answers relevant, specific, and substantive?
4. overall_fit (0–25): Holistic gut check — would you put them through to interview?

Return ONLY valid JSON in this exact format:
{"score": <total 0-100>, "breakdown": {"skills_match": <0-25>, "experience_match": <0-25>, "answer_quality": <0-25>, "overall_fit": <0-25>}, "summary": "<2-3 sentence recruiter summary>"}`;

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "ai_not_configured" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("Anthropic error:", errText);
      return new Response(JSON.stringify({ error: "scoring_failed" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const aiData = await aiRes.json();
    const rawContent = aiData.content?.[0]?.text || "";

    let parsed: { score: number; breakdown: Record<string, number>; summary: string };
    try {
      // Extract JSON from response (may have surrounding text)
      const match = rawContent.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match?.[0] || rawContent);
    } catch {
      return new Response(JSON.stringify({ error: "parse_failed", raw: rawContent }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    // Validate and clamp scores
    const breakdown = {
      skills_match: Math.min(25, Math.max(0, Math.round(parsed.breakdown?.skills_match ?? 0))),
      experience_match: Math.min(25, Math.max(0, Math.round(parsed.breakdown?.experience_match ?? 0))),
      answer_quality: Math.min(25, Math.max(0, Math.round(parsed.breakdown?.answer_quality ?? 0))),
      overall_fit: Math.min(25, Math.max(0, Math.round(parsed.breakdown?.overall_fit ?? 0))),
    };
    const totalScore = breakdown.skills_match + breakdown.experience_match + breakdown.answer_quality + breakdown.overall_fit;

    // Persist to DB
    await supabase.from("opportunity_applications").update({
      ai_score: totalScore,
      ai_score_breakdown: breakdown,
      ai_summary: parsed.summary || "",
      ai_scored_at: new Date().toISOString(),
    }).eq("id", application_id);

    return new Response(JSON.stringify({
      score: totalScore,
      breakdown,
      summary: parsed.summary || "",
    }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (e: any) {
    console.error("score-applicant error:", e);
    return new Response(JSON.stringify({ error: "internal_error", message: e?.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
