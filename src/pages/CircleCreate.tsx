/**
 * Circle creation flow.
 * GUARDRAILS:
 *  - activity_score >= 50
 *  - is_verified = true
 *  - max 3 circles per user per 30 days
 *  - only city / role / sector / topic types are user-creatable
 *    (company / college require page ownership)
 */
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Hash, MapPin, Users, Briefcase, Loader2, Check } from "lucide-react";
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

const MIN_SCORE = 50;
const MAX_PER_30D = 3;

export default function CircleCreate() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

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

  const slug = useMemo(() => generateSlug(name), [name]);

  // Check 30d quota
  useEffect(() => {
    if (!user) return;
    (async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("circles")
        .select("id", { count: "exact", head: true })
        .eq("created_by", user.id)
        .gte("created_at", since);
      setRecentCount(count ?? 0);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--brand)" }} />
      </div>
    );
  }

  const score = profile?.activity_score ?? 0;
  const isVerified = !!profile?.is_verified;

  const blockedReasons: string[] = [];
  if (score < MIN_SCORE) blockedReasons.push(`Reach Activity Score ${MIN_SCORE} (you're at ${score})`);
  if (!isVerified) blockedReasons.push("Get verified on your profile first");
  if (recentCount !== null && recentCount >= MAX_PER_30D) {
    blockedReasons.push(`You've created ${recentCount} circles in the last 30 days (max ${MAX_PER_30D})`);
  }
  const blocked = blockedReasons.length > 0;

  const proceedSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    const { data: existing } = await supabase
      .from("circles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) {
      setSubmitting(false);
      toast.error("That name is taken — try a different one");
      return;
    }

    const { data, error } = await supabase
      .from("circles")
      .insert({
        type,
        name: name.trim(),
        slug,
        description: description.trim(),
        icon_url: icon,
        rules,
        visibility,
        who_can_post: whoCanPost,
        who_can_join: whoCanJoin,
        created_by: user.id,
      } as any)
      .select()
      .single();

    if (error || !data) {
      setSubmitting(false);
      toast.error(error?.message || "Couldn't create circle");
      return;
    }

    // Auto-join the creator
    await supabase.from("circle_members").insert({ circle_id: data.id, user_id: user.id });

    setSubmitting(false);
    toast.success(`Circle "${name}" created`);
    navigate(`/app/circles/${data.slug}`);
  };

  const handleSubmit = async () => {
    if (blocked) return;
    if (name.trim().length < 2 || name.trim().length > 40) {
      toast.error("Name must be 2-40 characters");
      return;
    }
    if (description.trim().length < 20 || description.trim().length > 300) {
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
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-[640px] mx-auto px-4 py-6">
        <button
          type="button"
          onClick={() => navigate("/app/circles")}
          className="flex items-center gap-2 mb-4 cursor-pointer"
          style={{ background: "none", border: "none", color: "var(--text-2)", fontSize: 13 }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to circles
        </button>

        <h1 className="text-[22px] font-bold mb-1" style={{ color: "var(--text-1)" }}>
          Create a circle
        </h1>
        <p className="text-[13px] mb-5" style={{ color: "var(--text-3)" }}>
          A circle is a focused community around a topic, role, sector, or city.
        </p>

        {blocked && (
          <div
            className="p-3 rounded-xl mb-4"
            style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.40)" }}
          >
            <p className="text-[13px] font-bold mb-1" style={{ color: "#92400E" }}>
              You can't create a circle yet
            </p>
            <ul className="text-[12px] list-disc pl-4" style={{ color: "#92400E" }}>
              {blockedReasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        )}

        {/* Type */}
        <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-3)" }}>Type</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {TYPE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = type === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className="text-left p-3 rounded-xl cursor-pointer"
                style={{
                  background: active ? "var(--brand-dim)" : "var(--surface)",
                  border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
                }}
              >
                <Icon className="w-4 h-4 mb-1" style={{ color: active ? "var(--brand)" : "var(--text-2)" }} />
                <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{opt.label}</p>
                <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{opt.hint}</p>
              </button>
            );
          })}
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="text-[11px] font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-3)" }}>
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 40))}
            placeholder="e.g. Bangalore Designers"
            className="w-full h-11 px-3.5 rounded-xl outline-none text-[14px]"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)" }}
          />
          <div className="flex justify-between mt-1">
            <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
              URL: /app/circles/<span style={{ color: "var(--text-2)", fontWeight: 600 }}>{slug || "your-circle"}</span>
            </p>
            <p className="text-[11px]" style={{ color: name.length > 40 ? "#EF4444" : "var(--text-3)" }}>{name.length}/40</p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="text-[11px] font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-3)" }}>
            Description (20-300 chars)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 300))}
            placeholder="What's this circle about? Who should join?"
            className="w-full min-h-[80px] px-3.5 py-2.5 rounded-xl outline-none text-[14px] resize-none"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)" }}
          />
          <p className="text-[11px] text-right mt-1" style={{ color: description.length > 300 ? "#EF4444" : "var(--text-3)" }}>
            {description.length}/300
          </p>
        </div>

        {/* Icon */}
        <div className="mb-4">
          <label className="text-[11px] font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-3)" }}>
            Icon
          </label>
          <div className="flex gap-2 flex-wrap">
            {["✨", "🎯", "💡", "🚀", "🔥", "🌱", "📚", "🎨", "💻", "🏙️", "🤝", "⚡"].map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setIcon(e)}
                className="w-10 h-10 rounded-xl text-[18px] cursor-pointer flex items-center justify-center"
                style={{
                  background: icon === e ? "var(--brand-dim)" : "var(--surface)",
                  border: `1px solid ${icon === e ? "var(--brand)" : "var(--border)"}`,
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="mb-4">
          <label className="text-[11px] font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-3)" }}>
            Community rules (editable)
          </label>
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            className="w-full min-h-[120px] px-3.5 py-2.5 rounded-xl outline-none text-[13px] resize-none"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)" }}
          />
        </div>

        {/* Visibility / permissions */}
        <div className="grid grid-cols-1 gap-3 mb-5">
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
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || blocked}
          className="w-full h-12 rounded-xl text-[14px] font-bold cursor-pointer disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #E8733A, #FF6B9D)",
            color: "#fff",
            border: "none",
          }}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Create circle"}
        </button>
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
      <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-3)" }}>{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className="text-left p-2.5 rounded-xl cursor-pointer relative"
              style={{
                background: active ? "var(--brand-dim)" : "var(--surface)",
                border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
              }}
            >
              {active && <Check className="w-3 h-3 absolute top-2 right-2" style={{ color: "var(--brand)" }} />}
              <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{o.label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>{o.hint}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
