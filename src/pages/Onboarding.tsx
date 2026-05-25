/**
 * Unified 4-step onboarding wizard (v4 — role-adaptive).
 *
 * Steps:
 *   1. Who are you?       — 8 profession cards (saves profession_type)
 *   2. Specific role      — adaptive chips based on Step 1 (saves role_subtype + role)
 *   3. Basic info         — display name, headline, city, state, avatar
 *   4. Done screen        — welcome, activity score, CTA buttons
 */
import { PageSEO } from "@/hooks/usePageSEO";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Briefcase,
  GraduationCap,
  Wrench,
  Video,
  BookOpen,
  Stethoscope,
  Building2,
  Microscope,
  Check,
  ChevronLeft,
  Loader2,
  Camera,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import { consumePostAuthRedirect } from "@/lib/safeRedirect";

const STORAGE_KEY = "ob_wizard_state_v4";
const TOTAL = 4;
const BRAND = "#E8733A";
const BRAND_BORDER = "1.5px solid #E8733A";
const GRAY_BORDER = "1px solid #D1D5DB";
const SECONDARY_TEXT = "#6B7094";

/* ─── Profession Cards ─── */
interface ProfessionCard {
  value: string;
  label: string;
  desc: string;
  Icon: React.ElementType;
}

const PROFESSION_CARDS: ProfessionCard[] = [
  { value: "professional", label: "Professional",           desc: "Working in a company or organisation",       Icon: Briefcase      },
  { value: "student",      label: "Student",                desc: "Currently studying at college or university", Icon: GraduationCap  },
  { value: "gig_worker",   label: "Gig Worker",             desc: "Freelancer, contractor, or daily wage worker", Icon: Wrench        },
  { value: "creator",      label: "Creator",                desc: "YouTuber, podcaster, blogger, influencer",   Icon: Video          },
  { value: "teacher",      label: "Teacher / Educator",     desc: "School or college teacher, trainer, coach",  Icon: BookOpen       },
  { value: "doctor",       label: "Doctor / Healthcare",    desc: "Physician, nurse, medical professional",     Icon: Stethoscope    },
  { value: "government",   label: "Government / Public Sector", desc: "Govt employee, IAS, IPS, PSU",          Icon: Building2      },
  { value: "researcher",   label: "Researcher / Academic",  desc: "PhD, postdoc, scientist, researcher",       Icon: Microscope     },
];

/* ─── Role chips map ─── */
const ROLE_CHIPS_MAP: Record<string, { title: string; chips: string[] }> = {
  professional: {
    title: "What's your area of work?",
    chips: ["Software Engineering","Product Management","Design & Creative","Marketing","Sales","Operations","Finance & Accounts","HR / People","Legal","Data & Analytics","Consulting","Other"],
  },
  student: {
    title: "What are you studying?",
    chips: ["Engineering","Medicine / MBBS","Business / MBA","Law","Arts & Humanities","Science","Commerce","Computer Science","Architecture","Other"],
  },
  doctor: {
    title: "Your medical specialisation?",
    chips: ["General Physician","Surgeon","Paediatrician","Cardiologist","Psychiatrist","Dentist","Physiotherapist","Nurse / Nursing","Pharmacist","Radiologist","Other Medical"],
  },
  teacher: {
    title: "Where do you teach?",
    chips: ["School (K-12)","College / University","Coaching & Tutoring","Corporate Training","Online / EdTech","Skill Training","Other"],
  },
  gig_worker: {
    title: "What kind of gigs do you take?",
    chips: ["Delivery & Logistics","Design & Creative","Tech & IT Support","Photography & Video","Writing & Content","Driver / Transport","Home Services","Fitness & Wellness","Teaching & Tutoring","Other"],
  },
  creator: {
    title: "What do you create?",
    chips: ["YouTube","Podcasting","Instagram / Reels","Newsletter","Blogging / Writing","Tech Content","Finance Content","Comedy / Entertainment","Education","Other"],
  },
  government: {
    title: "Which sector?",
    chips: ["IAS / IPS / IFS","Defence Forces","PSU (ONGC/BHEL etc.)","Indian Railways","Municipal Corporation","State Government","Government Education","Government Healthcare","Other"],
  },
  researcher: {
    title: "Your research field?",
    chips: ["Engineering & Technology","Medicine & Life Sciences","Social Sciences","Physics / Chemistry","Computer Science / AI","Economics","Education Research","Other"],
  },
};

/* ─── Headline placeholders ─── */
const HEADLINE_PLACEHOLDERS: Record<string, string> = {
  professional: "e.g. Senior Engineer at Infosys",
  student:      "e.g. B.Tech CSE Student, IIT Delhi",
  gig_worker:   "e.g. Plumber & Electrician, Hyderabad",
  creator:      "e.g. Tech YouTuber, 50K subscribers",
  doctor:       "e.g. Cardiologist at Apollo Hospitals",
  teacher:      "e.g. Mathematics Teacher, DPS",
  government:   "e.g. Deputy Collector, Telangana",
  researcher:   "e.g. PhD Researcher, IISc Bangalore",
};

/* ─── Indian States ─── */
const INDIA_STATES = [
  "Andhra Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra",
  "Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim",
  "Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Other",
];

/* ─── Wizard State ─── */
interface WizardState {
  step: number;
  profession_type: string;
  role_subtype: string;
  full_name: string;
  headline: string;
  location_city: string;
  location_state: string;
  avatar_url: string;
}

const EMPTY: WizardState = {
  step: 1,
  profession_type: "",
  role_subtype: "",
  full_name: "",
  headline: "",
  location_city: "",
  location_state: "",
  avatar_url: "",
};

/* ─── Shared input/select style (light, white bg) ─── */
const inputStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1.5px solid #D1D5DB",
  borderRadius: 12,
  color: "#111827",
  height: 48,
  width: "100%",
  padding: "0 14px",
  fontSize: 14,
  outline: "none",
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [state, setState] = useState<WizardState>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Hydrate from localStorage + DB */
  useEffect(() => {
    if (!user) return;
    let initial: Partial<WizardState> = {};
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { initial = JSON.parse(raw) as Partial<WizardState>; } catch { /* ignore */ }
    }
    const dbStep = (profile as any)?.last_onboarding_step as number | undefined;
    const resumeStep = Math.max(initial.step ?? 1, dbStep ?? 1);
    setState(s => ({
      ...s,
      ...initial,
      step: Math.min(TOTAL, Math.max(1, resumeStep)),
      full_name: initial.full_name || profile?.full_name || (user.user_metadata as any)?.full_name || "",
      avatar_url: initial.avatar_url || profile?.avatar_url || "",
    }));
    setLoaded(true);
  }, [user, profile]);

  /* Persist on change */
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, loaded]);

  /* Already finished? Bounce to feed */
  useEffect(() => {
    if (profile?.onboarding_complete) {
      const dest = consumePostAuthRedirect();
      navigate(dest, { replace: true });
    }
  }, [profile?.onboarding_complete, navigate]);

  const set = <K extends keyof WizardState>(k: K, v: WizardState[K]) =>
    setState(s => ({ ...s, [k]: v }));

  const goto = (n: number) => {
    const next = Math.max(1, Math.min(TOTAL, n));
    setState(s => ({ ...s, step: next }));
    if (user) {
      supabase
        .from("profiles")
        .update({ last_onboarding_step: next } as never)
        .eq("id", user.id)
        .then(() => {});
    }
  };

  const savePatch = async (patch: Record<string, unknown>) => {
    if (!user) return false;
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v === "" || v === null || v === undefined) continue;
      if (Array.isArray(v) && v.length === 0) continue;
      clean[k] = v;
    }
    if (Object.keys(clean).length === 0) return true;
    const { error } = await supabase.from("profiles").update(clean as never).eq("id", user.id);
    if (error) { toast.error("Could not save. Try again."); return false; }
    return true;
  };

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    const ok = await savePatch({
      onboarding_complete: true,
      last_onboarding_step: TOTAL,
    });
    if (!ok) { setSaving(false); return; }
    await refreshProfile();
    setSaving(false);
    localStorage.removeItem(STORAGE_KEY);
    const dest = consumePostAuthRedirect();
    toast.success("Welcome to Tiikme!");
    navigate(dest, { replace: true });
  };

  if (!loaded) {
    return (
      <OnboardingShell step={1} totalSteps={TOTAL}>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: BRAND }} />
        </div>
      </OnboardingShell>
    );
  }

  const { step } = state;

  return (
    <>
      <PageSEO title="Create Your Profile | Tiikme" description="Set up your verified professional identity on Tiikme." noIndex />
      <OnboardingShell step={step} totalSteps={TOTAL}>
        <div>
          {/* Step counter + back button row */}
          <div className="relative flex items-center justify-center mb-5" style={{ minHeight: 28 }}>
            {step > 1 && (
              <button
                type="button"
                onClick={() => goto(step - 1)}
                className="absolute left-0 flex items-center gap-1 text-[13px] font-medium cursor-pointer hover:opacity-70"
                style={{ color: SECONDARY_TEXT }}
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <span className="text-[13px] font-semibold" style={{ color: SECONDARY_TEXT }}>
              Step {step} of {TOTAL}
            </span>
          </div>

          {step === 1 && (
            <StepProfession
              selected={state.profession_type}
              userId={user?.id ?? ""}
              onSelect={async (val) => {
                set("profession_type", val);
                await supabase.from("profiles").update({ profession_type: val } as never).eq("id", user?.id ?? "");
                setTimeout(() => goto(2), 300);
              }}
            />
          )}

          {step === 2 && (
            <StepRoleChips
              professionType={state.profession_type}
              selected={state.role_subtype}
              userId={user?.id ?? ""}
              onSelect={async (chip) => {
                set("role_subtype", chip);
                await supabase.from("profiles").update({ role_subtype: chip, role: state.profession_type } as never).eq("id", user?.id ?? "");
                setTimeout(() => goto(3), 300);
              }}
              onNext={() => goto(3)}
            />
          )}

          {step === 3 && (
            <StepBasicInfo
              state={state}
              set={set}
              userId={user?.id ?? ""}
              onNext={async () => {
                setSaving(true);
                const ok = await savePatch({
                  full_name: state.full_name.trim(),
                  headline: state.headline.trim(),
                  location_city: state.location_city.trim(),
                  location_state: state.location_state,
                  avatar_url: state.avatar_url || undefined,
                });
                setSaving(false);
                if (ok) goto(4);
              }}
              saving={saving}
            />
          )}

          {step === 4 && (
            <StepDone
              state={state}
              onFinish={finish}
              saving={saving}
              navigate={navigate}
            />
          )}
        </div>
      </OnboardingShell>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   Step 1: Who are you?
────────────────────────────────────────────────────────────── */

function StepProfession({
  selected,
  onSelect,
}: {
  selected: string;
  userId: string;
  onSelect: (val: string) => Promise<void>;
}) {
  return (
    <>
      <h1 className="text-[24px] font-extrabold mb-1" style={{ color: "#111827" }}>
        Who are you?
      </h1>
      <p className="text-[13px] mb-5" style={{ color: SECONDARY_TEXT }}>
        Pick the option that best describes you.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {PROFESSION_CARDS.map(({ value, label, desc, Icon }) => {
          const isSelected = selected === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onSelect(value)}
              className="relative text-left p-4 rounded-2xl cursor-pointer transition-all"
              style={{
                background: "#FFFFFF",
                border: isSelected ? BRAND_BORDER : GRAY_BORDER,
                boxShadow: isSelected ? `0 0 0 1px ${BRAND}` : "none",
              }}
            >
              {/* Checkmark top-right */}
              {isSelected && (
                <span
                  className="absolute top-2.5 right-2.5 flex items-center justify-center w-5 h-5 rounded-full"
                  style={{ background: BRAND }}
                >
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
              )}

              {/* Icon */}
              <div className="mb-2.5">
                <Icon
                  style={{ width: 40, height: 40, color: BRAND }}
                  strokeWidth={1.5}
                />
              </div>

              {/* Label */}
              <div className="text-[15px] font-bold mb-0.5" style={{ color: "#111827" }}>
                {label}
              </div>

              {/* Description */}
              <div className="text-[12px] leading-[1.4]" style={{ color: SECONDARY_TEXT }}>
                {desc}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   Step 2: Specific role chips
────────────────────────────────────────────────────────────── */

function StepRoleChips({
  professionType,
  selected,
  onSelect,
  onNext,
}: {
  professionType: string;
  selected: string;
  userId: string;
  onSelect: (chip: string) => Promise<void>;
  onNext: () => void;
}) {
  const config = ROLE_CHIPS_MAP[professionType] ?? {
    title: "What's your role?",
    chips: ["Other"],
  };

  return (
    <>
      <h1 className="text-[22px] font-extrabold mb-1" style={{ color: "#111827" }}>
        {config.title}
      </h1>
      <p className="text-[13px] mb-5" style={{ color: SECONDARY_TEXT }}>
        Select the one that fits you best.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {config.chips.map(chip => {
          const isSelected = selected === chip;
          return (
            <button
              key={chip}
              type="button"
              onClick={() => onSelect(chip)}
              className="px-4 h-9 rounded-full text-[13px] font-semibold cursor-pointer transition-all"
              style={{
                border: isSelected ? `1.5px solid ${BRAND}` : GRAY_BORDER,
                background: isSelected ? BRAND : "#FFFFFF",
                color: isSelected ? "#FFFFFF" : "#374151",
              }}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {selected && (
        <button
          type="button"
          onClick={onNext}
          className="w-full h-12 rounded-2xl text-[15px] font-bold text-white cursor-pointer transition-all hover:opacity-90"
          style={{ background: BRAND }}
        >
          Next →
        </button>
      )}
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   Step 3: Basic Info
────────────────────────────────────────────────────────────── */

function StepBasicInfo({
  state,
  set,
  userId,
  onNext,
  saving,
}: {
  state: WizardState;
  set: any;
  userId: string;
  onNext: () => Promise<void>;
  saving: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const headlinePlaceholder =
    HEADLINE_PLACEHOLDERS[state.profession_type] ?? "e.g. Your role and organisation";

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `avatars/${userId}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (upErr) { toast.error("Upload failed"); return; }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      set("avatar_url", data.publicUrl);
    } finally {
      setUploading(false);
    }
  };

  const canContinue = state.full_name.trim().length >= 2;

  const initials = state.full_name.trim()
    ? state.full_name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <>
      <h1 className="text-[24px] font-extrabold mb-1" style={{ color: "#111827" }}>
        Basic Info
      </h1>
      <p className="text-[13px] mb-5" style={{ color: SECONDARY_TEXT }}>
        Tell people a bit about yourself.
      </p>

      {/* Avatar upload */}
      <div className="flex justify-center mb-5">
        <div className="relative">
          <div
            className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center cursor-pointer"
            style={{
              background: state.avatar_url ? "transparent" : "#F3F4F6",
              border: `2px solid ${BRAND}`,
            }}
            onClick={() => fileRef.current?.click()}
          >
            {state.avatar_url ? (
              <img
                src={state.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[24px] font-bold" style={{ color: BRAND }}>
                {initials}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: BRAND, border: "2px solid white" }}
          >
            {uploading
              ? <Loader2 className="w-4 h-4 text-white animate-spin" />
              : <Camera className="w-4 h-4 text-white" />
            }
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* Display Name */}
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "#374151" }}>
            Display Name *
          </label>
          <input
            type="text"
            value={state.full_name}
            onChange={e => set("full_name", e.target.value)}
            placeholder="Your full name"
            style={inputStyle}
            maxLength={80}
          />
        </div>

        {/* Headline */}
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "#374151" }}>
            Headline
          </label>
          <input
            type="text"
            value={state.headline}
            onChange={e => set("headline", e.target.value)}
            placeholder={headlinePlaceholder}
            style={inputStyle}
            maxLength={120}
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "#374151" }}>
            City
          </label>
          <input
            type="text"
            value={state.location_city}
            onChange={e => set("location_city", e.target.value)}
            placeholder="e.g. Hyderabad"
            style={inputStyle}
            maxLength={60}
          />
        </div>

        {/* State */}
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "#374151" }}>
            State
          </label>
          <select
            value={state.location_state}
            onChange={e => set("location_state", e.target.value)}
            style={{ ...inputStyle, cursor: "pointer", color: state.location_state ? "#111827" : "#9CA3AF" }}
          >
            <option value="">Select state…</option>
            {INDIA_STATES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!canContinue || saving}
        className="mt-6 w-full h-12 rounded-2xl text-[15px] font-bold text-white cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: BRAND }}
      >
        {saving ? "Saving..." : "Save & Continue →"}
      </button>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   Step 4: Done screen
────────────────────────────────────────────────────────────── */

function StepDone({
  state,
  onFinish,
  saving,
  navigate,
}: {
  state: WizardState;
  onFinish: () => Promise<void>;
  saving: boolean;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const displayName = state.full_name.trim() || "there";
  const initials = state.full_name.trim()
    ? state.full_name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const professionCard = PROFESSION_CARDS.find(c => c.value === state.profession_type);
  const roleLabel = professionCard?.label ?? state.profession_type;
  const subLabel = state.role_subtype || "";

  return (
    <div className="text-center">
      <div className="mb-2 text-[32px]">🎉</div>
      <h1 className="text-[24px] font-extrabold mb-1" style={{ color: "#111827" }}>
        Welcome to Tiikme, {displayName}!
      </h1>
      <p className="text-[14px] mb-6" style={{ color: SECONDARY_TEXT }}>
        Your profile is ready.
      </p>

      {/* Avatar + role badge */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <div
          className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
          style={{
            background: state.avatar_url ? "transparent" : "#FEF3EE",
            border: `3px solid ${BRAND}`,
          }}
        >
          {state.avatar_url ? (
            <img src={state.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[26px] font-bold" style={{ color: BRAND }}>{initials}</span>
          )}
        </div>

        {/* Role badge */}
        {roleLabel && (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold"
            style={{ background: "#FEF3EE", color: BRAND, border: `1px solid ${BRAND}` }}
          >
            {roleLabel}{subLabel ? ` · ${subLabel}` : ""}
          </div>
        )}

        {/* Activity score */}
        <div
          className="w-full max-w-xs rounded-2xl p-4 text-left"
          style={{ background: "#F9FAFB", border: GRAY_BORDER }}
        >
          <div className="text-[12px] font-semibold mb-1" style={{ color: SECONDARY_TEXT }}>
            Activity Score
          </div>
          <div className="text-[28px] font-extrabold" style={{ color: "#111827" }}>0</div>
          <div className="text-[11px] mt-0.5" style={{ color: SECONDARY_TEXT }}>
            Post, connect, and verify to unlock features.
          </div>
        </div>

        {/* Info note */}
        <div
          className="w-full max-w-xs rounded-xl px-4 py-3 text-[12px] text-left"
          style={{ background: "#FEF3EE", color: BRAND, border: `1px solid ${BRAND}` }}
        >
          Post, connect, and verify to unlock features.
        </div>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={async () => {
            await onFinish();
            navigate("/app/profile");
          }}
          disabled={saving}
          className="w-full h-12 rounded-2xl text-[14px] font-bold cursor-pointer transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "#F3F4F6", color: "#374151", border: GRAY_BORDER }}
        >
          Add Work / Education
        </button>
        <button
          type="button"
          onClick={onFinish}
          disabled={saving}
          className="w-full h-12 rounded-2xl text-[15px] font-bold text-white cursor-pointer transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: BRAND }}
        >
          {saving ? "Loading..." : "Go to Feed →"}
        </button>
      </div>
    </div>
  );
}
