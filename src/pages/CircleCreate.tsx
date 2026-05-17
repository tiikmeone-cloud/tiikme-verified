/**
 * Circle creation flow — sectioned layout with sticky footer CTA.
 * GUARDRAILS:
 *  - activity_score >= 50
 *  - is_verified = true
 *  - max 3 circles per user per 30 days
 */
import { PageSEO } from "@/hooks/usePageSEO";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Hash, MapPin, Users, Briefcase, Loader2, Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { moderateText, logModerationFlag } from "@/lib/moderation";
import { generateSlug } from "@/lib/utils";
import SoftWarnModal from "@/components/moderation/SoftWarnModal";

type CircleType = "city" | "role" | "sector" | "topic";

const TYPE_OPTIONS: { value: CircleType; label: string; icon: any; hint: string }[] = [
  { value: "city", label: "City", icon: MapPin, hint: "A community for a specific city" },
  { value: "role", label: "Role", icon: Users, hint: "People in the same job role" },
  { value: "sector", label: "Sector", icon: Briefcase, hint: "An industry or domain" },
  { value: "topic", label: "Topic", icon: Hash, hint: "A theme or interest" },
];

const RULES_TEMPLATE = `1. Be respectful — disagree with ideas, not people.
2. No self-promotion or recruiting outside designated threads.
3. Stay on topic — keep discussions relevant to this circle.
4. No spam, no harassment, no slurs.`;

const MAX_PER_30D = 3;
const MAX_PER_DAY_LOW_SCORE = 1;

function SectionCard({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-6 space-y-4">
      <header>
        <h2 className="text-[15px] font-semibold text-[#1A1A2E]">{title}</h2>
        {hint && <p className="text-[12px] text-neutral-500 mt-0.5">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

export default function CircleCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, loading } = useAuth();

  const linkedOrgId = searchParams.get("org");
  const [linkedOrgName, setLinkedOrgName] = useState<string | null>(null);

  useEffect(() => {
    if (!linkedOrgId) { setLinkedOrgName(null); return; }
    supabase.from("organizations").select("name").eq("id", linkedOrgId).maybeSingle()
      .then(({ data }) => setLinkedOrgName(data?.name || null));
  }, [linkedOrgId]);

  const [type, setType] = useState<CircleType>("topic");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("✨");
  const [rules, setRules] = useState(RULES_TEMPLATE);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [whoCanPost, setWhoCanPost] = useState<"members" | "verified" | "mods">("members");
  const [whoCanJoin, setWhoCanJoin] = useState<"anyone" | "invite" | "verified">("anyone");

  const [submitting, setSubmitting] = useState(false);
  const [softWarn, setSoftWarn] = useState<{ open: boolean; category?: string; matchedTerm?: string }>({ open: false });
  const [recentCount, setRecentCount] = useState<number | null>(null);
  const [todayCount, setTodayCount] = useState<number | null>(null);

  const slug = useMemo(() => generateSlug(name), [name]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const [res30d, resDay] = await Promise.all([
        supabase.from("circles").select("id", { count: "exact", head: true })
          .eq("created_by", user.id).gte("created_at", since30d),
        supabase.from("circles").select("id", { count: "exact", head: true })
          .eq("created_by", user.id).gte("created_at", todayStart.toISOString()),
      ]);
      setRecentCount(res30d.count ?? 0);
      setTodayCount(resDay.count ?? 0);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#FF5A1F" }} />
      </div>
    );
  }

  const score = profile?.activity_score ?? 0;
  const isVerified = !!profile?.is_verified;
  const onboardingComplete = !!(profile as any)?.onboarding_complete;
  const canCreate = isVerified || onboardingComplete;

  const blockedReasons: string[] = [];
  if (!canCreate) {
    blockedReasons.push("Complete onboarding or get verified to create circles");
  }
  if (canCreate && score < 50 && todayCount !== null && todayCount >= MAX_PER_DAY_LOW_SCORE) {
    blockedReasons.push(`You've already created a circle today (max ${MAX_PER_DAY_LOW_SCORE}/day until your Activity Score reaches 50)`);
  }
  if (recentCount !== null && recentCount >= MAX_PER_30D) {
    blockedReasons.push(`You've created ${recentCount} circles in the last 30 days (max ${MAX_PER_30D})`);
  }
  const blocked = blockedReasons.length > 0;

  const formValid = name.trim().length >= 3 && description.trim().length >= 20;
  const canSubmit = !blocked && formValid && !submitting;

  const proceedSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    const { data: existing } = await supabase
      .from("circles").select("id").eq("slug", slug).maybeSingle();
    if (existing) {
      setSubmitting(false);
      toast.error("That name is taken — try a different one");
      return;
    }

    const { data, error } = await supabase
      .from("circles")
      .insert({
        type, name: name.trim(), slug,
        description: description.trim(),
        icon_url: icon, rules, visibility,
        who_can_post: whoCanPost, who_can_join: whoCanJoin,
        created_by: user.id,
        ...(linkedOrgId ? { linked_org_id: linkedOrgId } : {}),
      } as any)
      .select().single();

    if (error || !data) {
      setSubmitting(false);
      toast.error(error?.message || "Couldn't create circle");
      return;
    }

    await supabase.from("circle_members").insert({ circle_id: data.id, user_id: user.id });

    setSubmitting(false);
    toast.success(`Circle "${name}" created`);
    navigate(`/app/circles/${data.slug}`);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (name.trim().length > 40) {
      toast.error("Name must be 3-40 characters");
      return;
    }
    if (description.trim().length > 300) {
      toast.error("Description must be 20-300 characters");
      return;
    }

    const mod = await moderateText(name + " " + description);
    if (!mod.allowed) {
      if (user) {
        await logModerationFlag({
          contentType: "circle_name",
          authorId: user.id,
          textPreview: name + " — " + description,
          result: mod,
        });
      }
      toast.error("This name or description appears to violate community guidelines.");
      return;
    }
    if (mod.severity >= 0.3) {
      setSoftWarn({ open: true, category: mod.category, matchedTerm: mod.matchedTerm });
      return;
    }
    proceedSubmit();
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg)" }}>
      <PageSEO title="Create a Circle | Tiikme" description="Start a new professional circle on Tiikme. Bring together verified experts around a shared mission." noIndex />
      <div className="max-w-[720px] mx-auto px-4 md:px-6 py-6 space-y-4">
        <button
          type="button"
          onClick={() => navigate("/app/circles")}
          className="inline-flex items-center gap-2 cursor-pointer text-[13px] text-neutral-500 hover:text-neutral-800"
          style={{ background: "none", border: "none" }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to circles
        </button>

        <div>
          <h1 className="text-[24px] md:text-[28px] font-semibold tracking-tight" style={{ color: "#1A1A2E" }}>
            Create a circle
          </h1>
          <p className="text-[13px] text-neutral-600 mt-1">
            A focused community around a topic, role, sector, or city.
          </p>
        </div>

        {/* Eligibility banner — at the top */}
        {blocked && (
          <div
            className="rounded-2xl p-4 flex gap-3 items-start"
            style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.40)" }}
          >
            <Lock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#92400E" }} />
            <div>
              <p className="text-[13px] font-bold mb-1" style={{ color: "#92400E" }}>
                Almost there — a few things to check
              </p>
              <ul className="text-[12px] list-disc pl-4 space-y-0.5" style={{ color: "#92400E" }}>
                {blockedReasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </div>
          </div>
        )}

        {linkedOrgId && (
          <div
            className="rounded-2xl p-3 flex items-center gap-2"
            style={{ background: "rgba(232,115,58,0.08)", border: "1px solid rgba(232,115,58,0.30)" }}
          >
            <Users className="w-4 h-4" style={{ color: "#9A4C1F" }} />
            <p className="text-[12px] font-semibold" style={{ color: "#9A4C1F" }}>
              This circle will be linked to <strong>{linkedOrgName || "your organization"}</strong>.
            </p>
          </div>
        )}

        {/* SECTION 1: Type */}
        <SectionCard title="Type" hint="Pick what kind of community this is.">
          <div className="grid grid-cols-2 gap-2">
            {TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = type === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className="text-left p-3 rounded-xl cursor-pointer transition"
                  style={{
                    background: active ? "rgba(255, 90, 31,0.08)" : "#fff",
                    border: `1px solid ${active ? "#FF5A1F" : "#E5E7EB"}`,
                  }}
                >
                  <Icon className="w-4 h-4 mb-1" style={{ color: active ? "#FF5A1F" : "#6B7094" }} />
                  <p className="text-[13px] font-bold" style={{ color: "#1A1A2E" }}>{opt.label}</p>
                  <p className="text-[11px] text-neutral-500">{opt.hint}</p>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* SECTION 2: Identity */}
        <SectionCard title="Identity" hint="Name, link, description and icon.">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1 block text-neutral-500">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder="e.g. Bangalore Designers"
              className="w-full h-11 px-3.5 rounded-xl outline-none text-[14px] bg-white"
              style={{ border: "1px solid #E5E7EB", color: "#1A1A2E" }}
            />
            <div className="flex justify-between mt-1">
              <p className="text-[11px] text-neutral-500">
                URL: /app/circles/<span className="text-neutral-700 font-semibold">{slug || "your-circle"}</span>
              </p>
              <p className="text-[11px]" style={{ color: name.length > 40 ? "#EF4444" : "#9CA3AF" }}>{name.length}/40</p>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1 block text-neutral-500">
              Description (20-300 chars)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 300))}
              placeholder="What's this circle about? Who should join?"
              className="w-full min-h-[80px] px-3.5 py-2.5 rounded-xl outline-none text-[14px] resize-none bg-white"
              style={{ border: "1px solid #E5E7EB", color: "#1A1A2E" }}
            />
            <p className="text-[11px] text-right mt-1" style={{ color: description.length > 300 ? "#EF4444" : "#9CA3AF" }}>
              {description.length}/300
            </p>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1 block text-neutral-500">
              Icon
            </label>
            <div className="flex gap-2 flex-wrap">
              {["✨", "🎯", "💡", "🚀", "🔥", "🌱", "📚", "🎨", "💻", "🏙️", "🤝", "⚡"].map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className="w-10 h-10 rounded-xl text-[18px] cursor-pointer flex items-center justify-center transition"
                  style={{
                    background: icon === e ? "rgba(255, 90, 31,0.10)" : "#fff",
                    border: `1px solid ${icon === e ? "#FF5A1F" : "#E5E7EB"}`,
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* SECTION 3: Rules */}
        <SectionCard title="Community rules" hint="Editable — these appear on your circle's About panel.">
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            className="w-full min-h-[140px] px-3.5 py-2.5 rounded-xl outline-none text-[13px] resize-none bg-white"
            style={{ border: "1px solid #E5E7EB", color: "#1A1A2E" }}
          />
        </SectionCard>

        {/* SECTION 4: Access */}
        <SectionCard title="Access" hint="Who can see, post, and join.">
          <Selector
            label="Visibility"
            value={visibility}
            onChange={(v) => setVisibility(v as any)}
            options={[
              { value: "public", label: "Public", hint: "Anyone can find and read" },
              { value: "private", label: "Private", hint: "Only members can read" },
            ]}
          />
          <Selector
            label="Who can post"
            value={whoCanPost}
            onChange={(v) => setWhoCanPost(v as any)}
            options={[
              { value: "members", label: "Members", hint: "Anyone who joined" },
              { value: "verified", label: "Verified members", hint: "Only verified accounts" },
              { value: "mods", label: "Mods only", hint: "Locked-down feed" },
            ]}
          />
          <Selector
            label="Who can join"
            value={whoCanJoin}
            onChange={(v) => setWhoCanJoin(v as any)}
            options={[
              { value: "anyone", label: "Anyone", hint: "Open to all" },
              { value: "verified", label: "Verified only", hint: "Must be verified" },
              { value: "invite", label: "Invite only", hint: "Mods invite people" },
            ]}
          />
        </SectionCard>
      </div>

      {/* Sticky footer CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md"
        style={{
          background: "rgba(255,255,255,0.95)",
          borderTop: "1px solid #E5E7EB",
        }}
      >
        <div className="max-w-[720px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <p className="text-[12px] text-neutral-500 hidden sm:block">
            {!formValid
              ? "Add a name (3+ chars) and description (20+ chars) to continue."
              : blocked
                ? "Eligibility required — see the banner above."
                : "Ready to create."}
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="ml-auto h-11 px-6 rounded-xl text-[14px] font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95"
            style={{
              background: canSubmit ? "linear-gradient(135deg, #E8733A, #FF6B9D)" : "#9CA3AF",
              color: "#fff",
              border: "none",
            }}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Create circle"}
          </button>
        </div>
      </div>

      <SoftWarnModal
        open={softWarn.open}
        category={softWarn.category}
        matchedTerm={softWarn.matchedTerm}
        onConfirm={() => { setSoftWarn({ open: false }); proceedSubmit(); }}
        onCancel={() => setSoftWarn({ open: false })}
      />
    </div>
  );
}

function Selector({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; hint: string }[];
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5 text-neutral-500">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className="text-left p-2.5 rounded-xl cursor-pointer relative transition"
              style={{
                background: active ? "rgba(255, 90, 31,0.08)" : "#fff",
                border: `1px solid ${active ? "#FF5A1F" : "#E5E7EB"}`,
              }}
            >
              {active && <Check className="w-3 h-3 absolute top-2 right-2" style={{ color: "#FF5A1F" }} />}
              <p className="text-[12px] font-bold" style={{ color: "#1A1A2E" }}>{o.label}</p>
              <p className="text-[10px] mt-0.5 text-neutral-500">{o.hint}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
