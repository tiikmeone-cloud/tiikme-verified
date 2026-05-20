/**
 * Unified 5-step onboarding wizard.
 *
 * Steps:
 *   1. Identity      — full name + username
 *   2. Work          — org search + job title + work type (derives role)
 *   3. Location      — country / state / city
 *   4. Interests     — pick 3–8 tags
 *   5. Display pref  — what to show publicly + finish
 */
import { PageSEO } from "@/hooks/usePageSEO";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Check, Loader2, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import { consumePostAuthRedirect } from "@/lib/safeRedirect";
import {
  INTERESTS,
  type Role,
} from "@/lib/onboardingTaxonomy";
import { COUNTRIES, loadIndiaStates } from "@/data/indiaStatesLazy";
import {
  DISPLAY_PREFERENCE_OPTIONS, DEFAULT_DISPLAY_PREFERENCE,
  type DisplayPreference,
} from "@/utils/displayProfile";

const STORAGE_KEY = "ob_wizard_state_v3";
const TOTAL = 5;

const WORK_TYPES = [
  { value: "full_time",     label: "Full-time employee",   role: "professional" as Role },
  { value: "part_time",     label: "Part-time / Contract", role: "professional" as Role },
  { value: "freelance",     label: "Freelancer",           role: "freelancer"   as Role },
  { value: "student",       label: "Student / Intern",     role: "student"      as Role },
  { value: "self_employed", label: "Founder / Self-employed", role: "founder"   as Role },
];

interface WizardState {
  step: number;
  full_name: string;
  username: string;
  role: Role | "";
  country: string;
  location_state: string;
  location_city: string;
  interests: string[];
  display_preference: DisplayPreference;
  // Work step
  orgQuery: string;
  selectedOrgId: string;
  selectedOrgName: string;
  jobTitle: string;
  workType: string;
}

const EMPTY: WizardState = {
  step: 1,
  full_name: "",
  username: "",
  role: "",
  country: "India",
  location_state: "",
  location_city: "",
  interests: [],
  display_preference: DEFAULT_DISPLAY_PREFERENCE,
  orgQuery: "",
  selectedOrgId: "",
  selectedOrgName: "",
  jobTitle: "",
  workType: "",
};

// Glass-on-midnight input/select styling. Translucent fill, white text,
// brand-orange focus ring. Used by every step on the dark AuthLayout.
const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1.5px solid rgba(255,255,255,0.15)",
  borderRadius: 14,
  color: "#FAFAF7",
  height: 48,
  width: "100%",
  padding: "0 14px",
  fontSize: 14,
  outline: "none",
};

const labelCls = "block text-[13px] font-semibold mb-1.5";
const labelStyle: React.CSSProperties = { color: "rgba(250,250,247,0.85)" };

// Tiikme brand orange used everywhere instead of legacy #FF5A1F
const BRAND = "#FF5A1F";
const BRAND_DIM = "rgba(255, 90, 31,0.14)";
const BRAND_RING = "rgba(255, 90, 31,0.45)";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [state, setState] = useState<WizardState>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Hydrate from localStorage + DB once we have a user. Resume from the
  // furthest step the server knows about — this is the canonical fix for
  // the "loops back to step 1 on refresh" bug.
  useEffect(() => {
    if (!user) return;
    let initial: Partial<WizardState> = {};
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { initial = JSON.parse(raw) as Partial<WizardState>; } catch { /* ignore */ }
    }
    // Server-side resume — beats stale localStorage from a previous device
    const dbStep = (profile as any)?.last_onboarding_step as number | undefined;
    const resumeStep = Math.max(initial.step ?? 1, dbStep ?? 1);
    setState(s => ({
      ...s,
      ...initial,
      step: Math.min(TOTAL, Math.max(1, resumeStep)),
      full_name: initial.full_name || profile?.full_name || (user.user_metadata as any)?.full_name || "",
      username: initial.username || profile?.username || "",
    }));
    setLoaded(true);
  }, [user, profile]);

  // Persist on change
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, loaded]);

  // Already finished? Bounce to feed.
  useEffect(() => {
    if (profile?.onboarding_complete) {
      const dest = consumePostAuthRedirect();
      navigate(dest, { replace: true });
    }
  }, [profile?.onboarding_complete, navigate]);

  const set = <K extends keyof WizardState>(k: K, v: WizardState[K]) =>
    setState(s => ({ ...s, [k]: v }));

  /** Move to step N and persist the highest-reached step to the DB so we
   *  can resume from the correct place after refresh / re-login. */
  const goto = (n: number) => {
    const next = Math.max(1, Math.min(TOTAL, n));
    setState(s => ({ ...s, step: next }));
    if (user) {
      // Fire-and-forget — we never want navigation to wait on this
      supabase
        .from("profiles")
        .update({ last_onboarding_step: next } as never)
        .eq("id", user.id)
        .then(() => {});
    }
  };

  /** Persist a partial profile patch. Omits empty strings. */
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
      display_preference: state.display_preference,
      last_onboarding_step: TOTAL,
    });
    if (!ok) { setSaving(false); return; }
    // CRITICAL: refresh the profile in AuthContext BEFORE navigating, so the
    // ProtectedRoute guard sees onboarding_complete=true and doesn't bounce
    // the user right back here.
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
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: BRAND }} /></div>
      </OnboardingShell>
    );
  }

  const { step } = state;
  const showBack = step > 1;

  return (
    <>
    <PageSEO title="Create Your Profile | Tiikme" description="Set up your verified professional identity on Tiikme." noIndex />
    <OnboardingShell step={step} totalSteps={TOTAL}>
      <div>
        {showBack && (
          <button type="button" onClick={() => goto(step - 1)}
            className="flex items-center gap-1 text-[13px] font-medium mb-4 cursor-pointer hover:opacity-70"
            style={{ color: "rgba(250,250,247,0.65)" }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}

        {step === 1 && <StepIdentity state={state} set={set} onNext={async () => {
          const ok = await savePatch({ full_name: state.full_name.trim(), username: state.username.trim().toLowerCase() });
          if (ok) goto(2);
        }} saving={saving} setSaving={setSaving} />}

        {step === 2 && <StepWork state={state} set={set} onNext={async () => {
          const wt = WORK_TYPES.find(w => w.value === state.workType);
          const derivedRole: Role | "" = wt ? wt.role : "";
          const ok = await savePatch({
            role: derivedRole,
            designation: state.jobTitle.trim(),
            currently_working_at: state.selectedOrgName || state.orgQuery.trim(),
            org_id: state.selectedOrgId || null,
          });
          if (ok) { set("role", derivedRole as any); goto(3); }
        }} onSkip={() => goto(3)} />}

        {step === 3 && <StepLocation state={state} set={set} onNext={async () => {
          const ok = await savePatch({
            country: state.country,
            location_state: state.location_state,
            location_city: state.location_city,
          });
          if (ok) goto(4);
        }} onSkip={() => goto(4)} />}

        {step === 4 && <StepInterests state={state} set={set} onNext={async () => {
          const ok = await savePatch({ interests: state.interests });
          if (ok) goto(5);
        }} onSkip={() => goto(5)} />}

        {step === 5 && <StepDisplayPref state={state} set={set} onFinish={finish} saving={saving} />}
      </div>
    </OnboardingShell>
    </>
  );
}

/* ───────────────────────── Step 1: Identity ───────────────────────── */

function StepIdentity({ state, set, onNext, saving, setSaving }: {
  state: WizardState; set: any; onNext: () => Promise<void>;
  saving: boolean; setSaving: (b: boolean) => void;
}) {
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const username = state.username.trim().toLowerCase();
  const usernameValid = /^[a-z0-9._-]{3,30}$/.test(username);

  // Debounced uniqueness check
  useEffect(() => {
    if (!usernameValid) { setAvailable(null); return; }
    setChecking(true);
    const t = setTimeout(async () => {
      const { data } = await supabase.from("profiles").select("id").ilike("username", username).limit(1).maybeSingle();
      setAvailable(!data);
      setChecking(false);
    }, 350);
    return () => clearTimeout(t);
  }, [username, usernameValid]);

  const canContinue = state.full_name.trim().length >= 2 && usernameValid && available === true;

  return (
    <>
      <h1 className="text-[26px] font-extrabold mb-1" style={{ color: "#FAFAF7" }}>Set up your identity</h1>
      <p className="text-[14px] mb-6" style={{ color: "rgba(250,250,247,0.65)" }}>This is what people see when they find you.</p>

      <div className="space-y-4">
        <div>
          <label className={labelCls} style={labelStyle}>Full name</label>
          <input type="text" value={state.full_name} onChange={e => set("full_name", e.target.value)}
            placeholder="Your full name" style={inputStyle} maxLength={80} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Username</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px]" style={{ color: "rgba(250,250,247,0.45)" }}>tiikme.com/</span>
            <input type="text" value={state.username}
              onChange={e => set("username", e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))}
              placeholder="yourname" style={{ ...inputStyle, paddingLeft: 110 }} maxLength={30} />
          </div>
          <p className="text-[12px] mt-1.5" style={{
            color: !state.username ? "rgba(250,250,247,0.45)" :
              !usernameValid ? "#EF4444" :
              checking ? "rgba(250,250,247,0.45)" :
              available ? "#059669" : "#EF4444",
          }}>
            {!state.username ? "Lowercase letters, numbers, dots, dashes, underscores. 3–30 chars." :
              !usernameValid ? "Use lowercase letters, numbers, . _ - (3–30 chars)" :
              checking ? "Checking availability..." :
              available ? "✓ Available" : "Already taken"}
          </p>
        </div>
      </div>

      <button type="button" disabled={!canContinue || saving}
        onClick={async () => { setSaving(true); await onNext(); setSaving(false); }}
        className="mt-6 w-full h-12 rounded-2xl text-[15px] font-bold text-white cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: BRAND }}>
        {saving ? "Saving..." : "Continue →"}
      </button>
    </>
  );
}

/* ───────────────────────── Step 2: Work ───────────────────────── */

function StepWork({ state, set, onNext, onSkip }: {
  state: WizardState; set: any; onNext: () => Promise<void>; onSkip: () => void;
}) {
  const [orgResults, setOrgResults] = useState<{ id: string; name: string; logo_url: string | null }[]>([]);
  const [searching, setSearching] = useState(false);

  const searchOrgs = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setOrgResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from("organizations")
      .select("id, name, logo_url")
      .ilike("name", `%${q.trim()}%`)
      .eq("status", "active")
      .limit(6);
    setOrgResults(data || []);
    setSearching(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchOrgs(state.orgQuery), 300);
    return () => clearTimeout(t);
  }, [state.orgQuery, searchOrgs]);

  const selectOrg = (org: { id: string; name: string }) => {
    set("selectedOrgId", org.id);
    set("selectedOrgName", org.name);
    set("orgQuery", org.name);
    setOrgResults([]);
  };

  const clearOrg = () => {
    set("selectedOrgId", "");
    set("selectedOrgName", "");
    set("orgQuery", "");
    setOrgResults([]);
  };

  return (
    <>
      <h1 className="text-[26px] font-extrabold mb-1" style={{ color: "#FAFAF7" }}>Where do you work?</h1>
      <p className="text-[14px] mb-6" style={{ color: "rgba(250,250,247,0.65)" }}>Help people find you in the right context.</p>

      <div className="space-y-4">
        {/* Org search */}
        <div>
          <label className={labelCls} style={labelStyle}>Organization</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(250,250,247,0.45)" }} />
            <input
              type="text"
              value={state.orgQuery}
              onChange={e => { set("orgQuery", e.target.value); set("selectedOrgId", ""); set("selectedOrgName", ""); }}
              placeholder="Company, college, hospital…"
              style={{ ...inputStyle, paddingLeft: 36, paddingRight: 36 }}
            />
            {state.orgQuery && (
              <button type="button" onClick={clearOrg} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4" style={{ color: "rgba(250,250,247,0.45)" }} />
              </button>
            )}
          </div>
          {/* Dropdown */}
          {orgResults.length > 0 && !state.selectedOrgId && (
            <div className="mt-1 rounded-xl overflow-hidden" style={{ background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.12)" }}>
              {orgResults.map(org => (
                <button key={org.id} type="button" onClick={() => selectOrg(org)}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-white/[0.06] transition-colors">
                  {org.logo_url
                    ? <img src={org.logo_url} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
                    : <div className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center text-[10px] font-bold" style={{ background: BRAND, color: "#fff" }}>{org.name.charAt(0)}</div>
                  }
                  <span className="text-[13px]" style={{ color: "#FAFAF7" }}>{org.name}</span>
                </button>
              ))}
            </div>
          )}
          {searching && (
            <p className="text-[12px] mt-1" style={{ color: "rgba(250,250,247,0.45)" }}>Searching…</p>
          )}
          {state.selectedOrgId && (
            <p className="text-[12px] mt-1" style={{ color: "#059669" }}>✓ Linked to {state.selectedOrgName}</p>
          )}
          {!state.selectedOrgId && state.orgQuery.trim().length >= 2 && orgResults.length === 0 && !searching && (
            <p className="text-[12px] mt-1" style={{ color: "rgba(250,250,247,0.45)" }}>Not found — we'll save the name anyway</p>
          )}
        </div>

        {/* Job title */}
        <div>
          <label className={labelCls} style={labelStyle}>Your title / role</label>
          <input
            type="text"
            value={state.jobTitle}
            onChange={e => set("jobTitle", e.target.value)}
            placeholder="e.g. Software Engineer, Marketing Manager"
            style={inputStyle}
            maxLength={80}
          />
        </div>

        {/* Work type */}
        <div>
          <label className={labelCls} style={labelStyle}>Work type</label>
          <div className="grid grid-cols-1 gap-2">
            {WORK_TYPES.map(w => {
              const selected = state.workType === w.value;
              return (
                <button key={w.value} type="button" onClick={() => set("workType", w.value)}
                  className="text-left px-4 py-3 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                  style={{
                    border: selected ? `2px solid ${BRAND}` : "1.5px solid rgba(255,255,255,0.12)",
                    background: selected ? BRAND_DIM : "rgba(255,255,255,0.04)",
                  }}>
                  <span className="text-[13px] font-semibold" style={{ color: "#FAFAF7" }}>{w.label}</span>
                  {selected && <span style={{ color: BRAND, fontSize: 14 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button type="button" onClick={onSkip}
          className="h-12 px-5 rounded-2xl text-[14px] font-semibold cursor-pointer hover:bg-white/[0.10]"
          style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.12)", color: "rgba(250,250,247,0.65)" }}>
          Skip
        </button>
        <button type="button" onClick={onNext}
          className="flex-1 h-12 rounded-2xl text-[15px] font-bold text-white cursor-pointer transition-all hover:opacity-90"
          style={{ background: BRAND }}>
          Continue →
        </button>
      </div>
    </>
  );
}

/* ───────────────────────── Step 3: Location ───────────────────────── */

function StepLocation({ state, set, onNext, onSkip }: {
  state: WizardState; set: any; onNext: () => Promise<void>; onSkip: () => void;
}) {
  const [statesData, setStatesData] = useState<{ state: string; districts: string[] }[]>([]);
  const isIndia = state.country === "IN" || state.country === "India";

  useEffect(() => {
    if (!isIndia) return;
    loadIndiaStates().then(d => setStatesData(d.states));
  }, [isIndia]);

  const districts = useMemo(() => {
    return statesData.find(s => s.state === state.location_state)?.districts || [];
  }, [statesData, state.location_state]);

  return (
    <>
      <h1 className="text-[26px] font-extrabold mb-1" style={{ color: "#FAFAF7" }}>Where are you based?</h1>
      <p className="text-[14px] mb-6" style={{ color: "rgba(250,250,247,0.65)" }}>Helps surface local people, jobs, and events.</p>

      <div className="space-y-4">
        <div>
          <label className={labelCls} style={labelStyle}>Country</label>
          <select value={state.country} onChange={e => { set("country", e.target.value); set("location_state", ""); set("location_city", ""); }}
            style={{ ...inputStyle, cursor: "pointer" }}>
            {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        {isIndia ? (
          <>
            <div>
              <label className={labelCls} style={labelStyle}>State</label>
              <select value={state.location_state} onChange={e => { set("location_state", e.target.value); set("location_city", ""); }}
                style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">Select state…</option>
                {statesData.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
              </select>
            </div>
            {state.location_state && (
              <div>
                <label className={labelCls} style={labelStyle}>City / District</label>
                <select value={state.location_city} onChange={e => set("location_city", e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">Select city…</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <label className={labelCls} style={labelStyle}>State / Region</label>
              <input type="text" value={state.location_state} onChange={e => set("location_state", e.target.value)}
                placeholder="e.g. California" style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>City</label>
              <input type="text" value={state.location_city} onChange={e => set("location_city", e.target.value)}
                placeholder="e.g. San Francisco" style={inputStyle} />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button type="button" onClick={onSkip}
          className="h-12 px-5 rounded-2xl text-[14px] font-semibold cursor-pointer hover:bg-white/[0.10]"
          style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid #E5E7EB", color: "rgba(250,250,247,0.65)" }}>
          Skip
        </button>
        <button type="button" onClick={onNext}
          className="flex-1 h-12 rounded-2xl text-[15px] font-bold text-white cursor-pointer transition-all hover:opacity-90"
          style={{ background: BRAND }}>
          Continue →
        </button>
      </div>
    </>
  );
}

/* ───────────────────────── Step 4: Interests ───────────────────────── */

function StepInterests({ state, set, onNext, onSkip }: {
  state: WizardState; set: any; onNext: () => Promise<void>; onSkip: () => void;
}) {
  const toggle = (tag: string) => {
    if (state.interests.includes(tag)) {
      set("interests", state.interests.filter((t: string) => t !== tag));
    } else if (state.interests.length < 8) {
      set("interests", [...state.interests, tag]);
    }
  };
  const count = state.interests.length;
  const valid = count >= 3 && count <= 8;

  return (
    <>
      <h1 className="text-[26px] font-extrabold mb-1" style={{ color: "#FAFAF7" }}>What are you into?</h1>
      <p className="text-[14px] mb-2" style={{ color: "rgba(250,250,247,0.65)" }}>Pick 3–8 interests. We'll use these to tune your feed.</p>
      <p className="text-[12px] mb-5 font-semibold" style={{ color: valid ? "#059669" : "rgba(250,250,247,0.45)" }}>
        {count} selected {valid ? "✓" : `(need ${count < 3 ? 3 - count + " more" : ""}${count > 8 ? "too many" : ""})`}
      </p>

      <div className="flex flex-wrap gap-2">
        {INTERESTS.map(tag => {
          const selected = state.interests.includes(tag);
          return (
            <button key={tag} type="button" onClick={() => toggle(tag)}
              className="px-3.5 h-9 rounded-full text-[13px] font-semibold cursor-pointer transition-all"
              style={{
                border: selected ? "1.5px solid #FF5A1F" : "1.5px solid #E5E7EB",
                background: selected ? BRAND_DIM : "#fff",
                color: selected ? BRAND : "rgba(250,250,247,0.85)",
              }}>
              {tag}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 mt-6">
        <button type="button" onClick={onSkip}
          className="h-12 px-5 rounded-2xl text-[14px] font-semibold cursor-pointer hover:bg-white/[0.10]"
          style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid #E5E7EB", color: "rgba(250,250,247,0.65)" }}>
          Skip
        </button>
        <button type="button" onClick={onNext} disabled={!valid}
          className="flex-1 h-12 rounded-2xl text-[15px] font-bold text-white cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: BRAND }}>
          Continue →
        </button>
      </div>
    </>
  );
}

/* ───────────────────────── Step 5: Display preference ───────────────────────── */

function DisplayPreviewCard({ state }: { state: WizardState }) {
  const pref = state.display_preference;
  const showName = pref !== "dp_only";
  const showRole = pref === "dp_name_profession" || pref === "dp_name_profession_company";
  const showCompany = pref === "dp_name_profession_company";
  const name = state.full_name.trim() || "Your Name";
  const role = state.jobTitle || (state.workType ? WORK_TYPES.find(w => w.value === state.workType)?.label : "") || "Your Role";

  return (
    <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#FF5A1F,#E8733A)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{name.charAt(0).toUpperCase()}</span>
      </div>
      <div style={{ minWidth: 0 }}>
        {showName && <p style={{ fontSize: 14, fontWeight: 700, color: "#FAFAF7", margin: 0, lineHeight: "20px" }}>{name}</p>}
        {showRole && <p style={{ fontSize: 12, color: "rgba(250,250,247,0.65)", margin: 0 }}>{role}</p>}
        {showCompany && <p style={{ fontSize: 11, color: "rgba(250,250,247,0.45)", margin: 0 }}>Tiikme Inc.</p>}
        {!showName && <p style={{ fontSize: 12, color: "rgba(250,250,247,0.45)", margin: 0, fontStyle: "italic" }}>Name hidden</p>}
      </div>
    </div>
  );
}

function StepDisplayPref({ state, set, onFinish, saving }: {
  state: WizardState; set: any; onFinish: () => Promise<void>; saving: boolean;
}) {
  return (
    <>
      <h1 className="text-[26px] font-extrabold mb-1" style={{ color: "#FAFAF7" }}>What should people see?</h1>
      <p className="text-[14px] mb-4" style={{ color: "rgba(250,250,247,0.65)" }}>Pick how your card appears across Tiikme. You can change this anytime.</p>

      <DisplayPreviewCard state={state} />

      <div className="space-y-2.5">
        {DISPLAY_PREFERENCE_OPTIONS.map(opt => {
          const selected = state.display_preference === opt.value;
          return (
            <button key={opt.value} type="button" onClick={() => set("display_preference", opt.value)}
              className="w-full text-left p-4 rounded-2xl cursor-pointer transition-all flex items-start justify-between gap-3"
              style={{
                border: selected ? "2px solid #FF5A1F" : "1.5px solid #E5E7EB",
                background: selected ? BRAND_DIM : "#fff",
              }}>
              <div>
                <div className="text-[14px] font-bold mb-0.5" style={{ color: "#FAFAF7" }}>{opt.label}</div>
                <div className="text-[12px]" style={{ color: "rgba(250,250,247,0.65)" }}>{opt.desc}</div>
              </div>
              {selected && <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: BRAND }} />}
            </button>
          );
        })}
      </div>

      <button type="button" onClick={onFinish} disabled={saving}
        className="mt-6 w-full h-12 rounded-2xl text-[15px] font-bold text-white cursor-pointer transition-all hover:opacity-90 disabled:opacity-50"
        style={{ background: BRAND }}>
        {saving ? "Finishing..." : "Finish & enter Tiikme →"}
      </button>
    </>
  );
}
