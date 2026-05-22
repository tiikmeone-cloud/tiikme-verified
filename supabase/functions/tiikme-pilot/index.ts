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

const MAX_THREADS = 10;
const MAX_DAILY_REQUESTS = 20;

type PilotMode = "discover" | "jobs" | "profile" | "hiring" | "verification";

interface ModeLimit {
  maxOutputTokens: number;
  maxWords: number;
}

const MODE_LIMITS: Record<PilotMode, ModeLimit> = {
  discover:     { maxOutputTokens: 600,  maxWords: 180 },
  jobs:         { maxOutputTokens: 800,  maxWords: 220 },
  profile:      { maxOutputTokens: 600,  maxWords: 160 },
  hiring:       { maxOutputTokens: 1000, maxWords: 280 },
  verification: { maxOutputTokens: 500,  maxWords: 140 },
};

function chooseModel(mode: PilotMode): string {
  return mode === "hiring" ? "gpt-4o" : "gpt-4o-mini";
}

function normalizePilotQuery(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

type PilotIntent =
  | "find_org" | "find_person" | "find_job" | "find_circle"
  | "hiring_search" | "verification_query" | "own_applications" | "general_external";

function classifyPilotIntent(query: string, mode: PilotMode): PilotIntent {
  const q = normalizePilotQuery(query);
  if (/\b(my applications?|where.*applied|application status)\b/.test(q)) return "own_applications";
  if (mode === "hiring" || /\b(candidate|applicant|hire|recruit|shortlist|talent)\b/.test(q)) return "hiring_search";
  if (mode === "verification" || /\b(verify|verification|verified|badge|credential|document)\b/.test(q)) return "verification_query";
  if (/\b(job|jobs|hiring|opportunity|role|position|vacancy|internship|opening|career)\b/.test(q)) return "find_job";
  if (/\b(company|organization|startup|college|hospital|school|ngo|agency|institute)\b/.test(q)) return "find_org";
  if (/\b(circle|community|group|club|network)\b/.test(q)) return "find_circle";
  if (/\b(person|people|connect|developer|designer|engineer|doctor|manager|founder|profile)\b/.test(q)) return "find_person";
  if (mode === "jobs") return "find_job";
  if (mode === "profile") return "find_person";
  return "general_external";
}

function extractSearchText(query: string): string {
  return normalizePilotQuery(query)
    .replace(/\b(find|show|get|list|search|who|what|where|tell me about|looking for|i want|i need|can you|please|help me|how do i|what are)\b/g, "")
    .replace(/\s+/g, " ").trim() || query.toLowerCase().trim();
}

interface SourceCard {
  type: "organization" | "opportunity" | "post" | "circle" | "profile";
  id: string;
  title: string;
  subtitle?: string | null;
  href?: string | null;
  meta?: string | null;
}

function buildDeterministicAnswer(opts: {
  message: string;
  intent: PilotIntent;
  sourceCards: SourceCard[];
  ownApplications: any[];
}): string | null {
  const { message, intent, ownApplications } = opts;
  const q = normalizePilotQuery(message);

  if (/\b(what is tiikme|what.?s tiikme|how does tiikme work|about tiikme)\b/.test(q)) {
    return "Tiikme is a verified professional platform connecting students, professionals, and organisations across India. You can build a verified profile, discover opportunities, join community circles, and grow your professional network — all with verified identity.";
  }

  if (intent === "own_applications") {
    if (ownApplications.length === 0) return "You have not applied to any opportunities on Tiikme yet. Browse opportunities at /app/opportunities.";
    const list = ownApplications.slice(0, 5).map((a: any) =>
      `• ${a.opportunity?.title || "Opportunity"} at ${a.opportunity?.org?.name || "an organization"} — ${(a.status || "applied").replace(/_/g, " ")}`
    ).join("\n");
    return `You have ${ownApplications.length} application${ownApplications.length > 1 ? "s" : ""}:\n\n${list}`;
  }

  return null;
}

function estimateCostUsd(model: string, usage: any): number {
  if (!usage) return 0;
  const inputTokens = usage.input_tokens || usage.prompt_tokens || 0;
  const outputTokens = usage.output_tokens || usage.completion_tokens || 0;
  const rates: Record<string, [number, number]> = {
    "gpt-4o":      [0.0000025, 0.00001],
    "gpt-4o-mini": [0.00000015, 0.0000006],
  };
  const [inRate, outRate] = rates[model] || [0.000002, 0.000008];
  return +(inputTokens * inRate + outputTokens * outRate).toFixed(6);
}

function getModeSystemPrompt(mode: PilotMode, maxWords: number): string {
  const base: Record<PilotMode, string> = {
    discover:     "You are Tiikme Pilot in Discovery mode. Help the user find people, organisations, circles, and opportunities across the platform.",
    jobs:         "You are Tiikme Pilot in Jobs mode. Match the user with relevant opportunities based on their profile, location, and skills.",
    profile:      "You are Tiikme Pilot in Profile mode. Help the user understand and improve their professional presence on Tiikme.",
    hiring:       "You are Tiikme Pilot in Hiring mode. Help org admins and hiring managers find and evaluate visible candidates on the platform.",
    verification: "You are Tiikme Pilot in Verification mode. Answer questions about Tiikme's verification process and visible verification status.",
  };
  return `${base[mode]}\nAnswer only from the provided Tiikme retrieval context. Do not invent data. Do not use emojis. Keep the answer under ${maxWords} words. If data is missing from retrieved records, say so plainly. Never reveal private emails, phone numbers, or hidden analytics.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openAiKey = Deno.env.get("OPENAI_API_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const message: string = (body.message || "").trim().slice(0, 1000);
    const mode: PilotMode = (["discover", "jobs", "profile", "hiring", "verification"].includes(body.mode)
      ? body.mode : "discover") as PilotMode;
    let threadId: string = body.threadId || "";

    if (!message) return json({ error: "Message is required" }, 400);

    // Load user profile + org context
    const { data: profile } = await adminClient
      .from("profiles")
      .select("id, full_name, role, designation, sector, org_id, location_city, location_state, skills")
      .eq("id", user.id)
      .maybeSingle();

    const orgId = (profile as any)?.org_id || null;
    let canHire = false;
    let canVerify = false;
    let orgInfo: any = null;

    if (orgId) {
      const [adminRes, orgRes] = await Promise.all([
        adminClient.from("org_admins").select("role").eq("org_id", orgId).eq("user_id", user.id).maybeSingle(),
        adminClient.from("organizations").select("id, name, type, about, city, state").eq("id", orgId).maybeSingle(),
      ]);
      const orgRole = (adminRes.data as any)?.role;
      canHire = orgRole === "owner" || orgRole === "admin" || orgRole === "hiring_manager";
      canVerify = orgRole === "owner" || orgRole === "admin" || orgRole === "verifier";
      orgInfo = orgRes.data;
    }

    // Daily rate limit
    const today = new Date().toISOString().split("T")[0];
    const { count: dailyCount } = await adminClient
      .from("ai_audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("actor_user_id", user.id)
      .gte("created_at", `${today}T00:00:00Z`);

    if ((dailyCount || 0) >= MAX_DAILY_REQUESTS) {
      return json({ error: "Daily request limit reached. Try again tomorrow." }, 429);
    }

    // Get or create thread
    if (!threadId) {
      const titlePreview = message.split(" ").slice(0, 7).join(" ");
      const { data: newThread } = await adminClient
        .from("ai_threads")
        .insert({ user_id: user.id, title: titlePreview, mode, last_mode: mode })
        .select("id").single();
      threadId = (newThread as any)?.id;
      if (!threadId) return json({ error: "Could not create thread" }, 500);
    } else {
      const { data: thread } = await adminClient
        .from("ai_threads").select("id").eq("id", threadId).eq("user_id", user.id).maybeSingle();
      if (!thread) return json({ error: "Thread not found" }, 404);
    }

    // Save user message
    await adminClient.from("ai_messages").insert({
      thread_id: threadId, user_id: user.id, role: "user", content: message, metadata: { mode },
    });

    const normalizedMessage = normalizePilotQuery(message);
    const intent = classifyPilotIntent(message, mode);
    const searchText = extractSearchText(message);

    // Parallel retrieval
    const [orgsRes, oppsRes, profilesRes, circlesRes, appsRes] = await Promise.allSettled([
      adminClient.from("organizations")
        .select("id, name, type, tagline, about, city, state, website_url, is_verified, followers_count, slug")
        .or(`name.ilike.%${searchText}%,about.ilike.%${searchText}%,tagline.ilike.%${searchText}%`)
        .eq("status", "active").limit(5),

      (mode === "jobs" || intent === "find_job")
        ? adminClient.from("opportunities")
            .select("id, title, type, location, is_remote, compensation, org:organizations!opportunities_org_id_fkey(name, slug)")
            .ilike("title", `%${searchText}%`).eq("is_open", true).limit(5)
        : Promise.resolve({ data: [] }),

      (mode === "discover" || mode === "hiring" || intent === "find_person")
        ? adminClient.from("profiles")
            .select("id, full_name, username, designation, sector, location_city, is_verified, skills")
            .eq("is_public", true)
            .or(`full_name.ilike.%${searchText}%,designation.ilike.%${searchText}%,sector.ilike.%${searchText}%`)
            .limit(4)
        : Promise.resolve({ data: [] }),

      (mode === "discover" || intent === "find_circle")
        ? adminClient.from("circles")
            .select("id, name, slug, description, member_count")
            .or(`name.ilike.%${searchText}%,description.ilike.%${searchText}%`)
            .eq("visibility", "public").limit(3)
        : Promise.resolve({ data: [] }),

      adminClient.from("opportunity_applications")
        .select("id, status, created_at, opportunity:opportunities!opportunity_applications_opportunity_id_fkey(title, org:organizations!opportunities_org_id_fkey(name))")
        .eq("applicant_id", user.id).order("created_at", { ascending: false }).limit(5),
    ]);

    const orgs = orgsRes.status === "fulfilled" ? (orgsRes.value as any).data || [] : [];
    const opps = oppsRes.status === "fulfilled" ? (oppsRes.value as any).data || [] : [];
    const profiles = profilesRes.status === "fulfilled" ? (profilesRes.value as any).data || [] : [];
    const circles = circlesRes.status === "fulfilled" ? (circlesRes.value as any).data || [] : [];
    const ownApps = appsRes.status === "fulfilled" ? (appsRes.value as any).data || [] : [];

    // Build source cards
    const sourceCards: SourceCard[] = [];
    for (const org of orgs.slice(0, 3)) {
      sourceCards.push({
        type: "organization", id: org.id, title: org.name,
        subtitle: [org.type, org.city, org.state].filter(Boolean).join(" · "),
        href: `/org/${org.slug}`,
        meta: org.followers_count ? `${org.followers_count} followers` : null,
      });
    }
    for (const opp of opps.slice(0, 3)) {
      sourceCards.push({
        type: "opportunity", id: opp.id, title: opp.title,
        subtitle: [opp.org?.name, opp.location, opp.type].filter(Boolean).join(" · "),
        href: `/app/opportunities`,
        meta: opp.compensation || null,
      });
    }
    for (const p of profiles.slice(0, 2)) {
      sourceCards.push({
        type: "profile", id: p.id, title: p.full_name || "Member",
        subtitle: [p.designation, p.location_city].filter(Boolean).join(" · "),
        href: `/app/profile/${p.id}`,
        meta: p.sector || null,
      });
    }
    for (const c of circles.slice(0, 2)) {
      sourceCards.push({
        type: "circle", id: c.id, title: c.name,
        subtitle: c.description?.slice(0, 80) || null,
        href: `/app/circles/${c.slug}`,
        meta: c.member_count ? `${c.member_count} members` : null,
      });
    }

    const compactSources = sourceCards.slice(0, 6);

    let answer = "";
    let usedFallback = false;
    let usage: any = null;
    let answerPath: "deterministic" | "llm" | "fallback" = "fallback";

    // 1. Try deterministic
    const det = buildDeterministicAnswer({ message: normalizedMessage, intent, sourceCards, ownApplications: ownApps });
    if (det) { answer = det; answerPath = "deterministic"; }

    const isGeneralExternal = !answer && intent === "general_external" && sourceCards.length <= 1;

    // 2. Try OpenAI
    if (!answer && openAiKey) {
      try {
        const limits = MODE_LIMITS[mode];
        const model = chooseModel(mode);
        const retrievalCtx = {
          user: { role: (profile as any)?.role, designation: (profile as any)?.designation, sector: (profile as any)?.sector, location: [(profile as any)?.location_city, (profile as any)?.location_state].filter(Boolean).join(", ") },
          organization: orgInfo,
          permissions: { canHire, canVerify },
          sources: compactSources,
        };

        const oaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openAiKey}` },
          body: JSON.stringify({
            model,
            max_tokens: limits.maxOutputTokens,
            messages: [
              {
                role: "system",
                content: isGeneralExternal
                  ? `You are Tiikme Pilot. Answer in plain text, no emojis. Provide concise general professional context. Do not claim to access Tiikme records. Under ${limits.maxWords} words.`
                  : getModeSystemPrompt(mode, limits.maxWords),
              },
              {
                role: "user",
                content: isGeneralExternal
                  ? `Professional question: ${message}`
                  : `Question: ${message}\n\nTiikme context:\n${JSON.stringify(retrievalCtx)}`,
              },
            ],
          }),
        });

        if (oaiRes.ok) {
          const payload = await oaiRes.json();
          usage = payload.usage || null;
          answer = payload.choices?.[0]?.message?.content || "";
          if (answer) answerPath = "llm";
        }
      } catch (e) {
        console.error("[tiikme-pilot] OpenAI error:", e);
      }
    }

    // 3. Fallback
    if (!answer) {
      usedFallback = true;
      answerPath = "fallback";
      if (compactSources.length === 0) {
        answer = "I could not find matching Tiikme records for that. Try naming a specific role, organisation, city, or topic and I will search the platform.";
      } else if (mode === "hiring" && !canHire) {
        answer = "Hiring search is restricted to owner, admin, and hiring manager roles for your organisation.";
      } else {
        const summary = compactSources.slice(0, 3).map(s => `${s.title}${s.subtitle ? ` — ${s.subtitle}` : ""}`).join("\n");
        answer = `Found ${compactSources.length} relevant Tiikme result${compactSources.length > 1 ? "s" : ""}.\n\n${summary}\n\nOpen the cards below to explore further.`;
      }
    }

    // Persist assistant message
    const { data: assistantRow } = await adminClient.from("ai_messages").insert({
      thread_id: threadId, user_id: user.id, role: "assistant", content: answer,
      metadata: { mode, model: chooseModel(mode), source_count: compactSources.length, used_fallback: usedFallback, answer_path: answerPath, usage, estimated_cost_usd: estimateCostUsd(chooseModel(mode), usage), sources: compactSources },
    }).select("id").single();

    await adminClient.from("ai_threads").update({
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_mode: mode,
    }).eq("id", threadId);

    await adminClient.from("ai_audit_logs").insert({
      actor_user_id: user.id, org_id: orgId, thread_id: threadId, mode, action: "send", query_text: message,
      result_summary: { source_count: compactSources.length, answer_path: answerPath, usage, estimated_cost_usd: estimateCostUsd(chooseModel(mode), usage), daily_request_count: (dailyCount || 0) + 1, remaining_daily_requests: Math.max(0, MAX_DAILY_REQUESTS - ((dailyCount || 0) + 1)) },
      decision: "allowed",
    });

    const { count: threadCount } = await adminClient.from("ai_threads")
      .select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_archived", false);

    return json({
      threadId,
      assistantMessageId: (assistantRow as any)?.id || null,
      answer,
      sourceCards: compactSources,
      remainingChats: Math.max(0, MAX_THREADS - (threadCount || 0)),
      remainingDailyRequests: Math.max(0, MAX_DAILY_REQUESTS - ((dailyCount || 0) + 1)),
      mode,
      usedFallback,
      answerPath,
    });
  } catch (error) {
    console.error("[tiikme-pilot]", error);
    return json({ error: "Tiikme Pilot failed to process the request." }, 500);
  }
});
