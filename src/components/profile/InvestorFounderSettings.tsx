import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { tiikToast } from "@/components/ui/tiik-toast";
import { TrendingUp, Rocket } from "lucide-react";

const SECTORS = ["Fintech", "Healthtech", "Edtech", "Agritech", "SaaS", "E-commerce", "AI/ML", "Climate", "Deeptech", "Social Impact", "Logistics", "D2C", "Gaming", "Media", "Other"];
const STAGES = ["Pre-seed", "Seed", "Series A", "Series B", "Series C+", "Growth"];

interface Props {
  userId: string;
  roleMetadata: any;
  onSaved: () => void;
}

export default function InvestorFounderSettings({ userId, roleMetadata, onSaved }: Props) {
  const meta = roleMetadata || {};
  const [isInvestor, setIsInvestor] = useState(!!meta.investor_profile);
  const [isFounder, setIsFounder] = useState(!!meta.founder_profile);

  // Investor fields
  const [investMin, setInvestMin] = useState(meta.investor_profile?.investment_min || "");
  const [investMax, setInvestMax] = useState(meta.investor_profile?.investment_max || "");
  const [sectors, setSectors] = useState<string[]>(meta.investor_profile?.sectors || []);
  const [stagePrefs, setStagePrefs] = useState<string[]>(meta.investor_profile?.stage_preferences || []);
  const [portfolio, setPortfolio] = useState(meta.investor_profile?.portfolio_count || "");

  // Founder fields
  const [startupName, setStartupName] = useState(meta.founder_profile?.startup_name || "");
  const [fundingStage, setFundingStage] = useState(meta.founder_profile?.funding_stage || "");
  const [lookingForFunding, setLookingForFunding] = useState(meta.founder_profile?.looking_for_funding ?? false);
  const [pitchDeckUrl, setPitchDeckUrl] = useState(meta.founder_profile?.pitch_deck_url || "");

  const [saving, setSaving] = useState(false);

  const toggleSector = (s: string) => setSectors(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleStage = (s: string) => setStagePrefs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const save = async () => {
    setSaving(true);
    const updated: any = { ...meta };
    if (isInvestor) {
      updated.investor_profile = {
        investment_min: investMin || null,
        investment_max: investMax || null,
        sectors,
        stage_preferences: stagePrefs,
        portfolio_count: portfolio ? Number(portfolio) : null,
      };
    } else {
      delete updated.investor_profile;
    }
    if (isFounder) {
      updated.founder_profile = {
        startup_name: startupName || null,
        funding_stage: fundingStage || null,
        looking_for_funding: lookingForFunding,
        pitch_deck_url: pitchDeckUrl || null,
      };
    } else {
      delete updated.founder_profile;
    }
    const { error } = await supabase.from("profiles").update({ role_metadata: updated } as any).eq("id", userId);
    setSaving(false);
    if (error) { tiikToast.error("Failed to save"); return; }
    tiikToast.success("Saved");
    onSaved();
  };

  const labelStyle = "text-[11px] font-bold uppercase tracking-wider block mb-1.5";
  const pillActive = (active: boolean) => ({
    background: active ? "rgba(232,115,58,0.15)" : "var(--color-surface)",
    border: active ? "1.5px solid rgba(232,115,58,0.40)" : "1.5px solid var(--glass-border-subtle)",
    color: active ? "#E8733A" : "var(--color-text-secondary)",
  });

  return (
    <div className="space-y-5">
      <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
        <h3 className="text-[16px] font-semibold mb-2" style={{ color: "var(--color-text)" }}>Additional Roles</h3>
        <p className="text-[13px] mb-4" style={{ color: "var(--color-text-secondary)" }}>These are in addition to your primary role. You can be an employee AND an investor.</p>

        {/* Checkboxes */}
        <div className="space-y-3 mb-4">
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all" style={{ background: isInvestor ? "rgba(21,128,61,0.08)" : "var(--color-surface)", border: isInvestor ? "1.5px solid rgba(21,128,61,0.30)" : "1.5px solid var(--glass-border-subtle)" }}>
            <input type="checkbox" checked={isInvestor} onChange={e => setIsInvestor(e.target.checked)} className="w-4 h-4 accent-[#15803D]" />
            <TrendingUp className="w-5 h-5" style={{ color: "#15803D" }} />
            <div>
              <span className="text-[14px] font-semibold" style={{ color: "var(--color-text)" }}>Investor (Angel/VC)</span>
              <p className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>Show investor badge, appear in investor carousel</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all" style={{ background: isFounder ? "rgba(124,58,237,0.08)" : "var(--color-surface)", border: isFounder ? "1.5px solid rgba(124,58,237,0.30)" : "1.5px solid var(--glass-border-subtle)" }}>
            <input type="checkbox" checked={isFounder} onChange={e => setIsFounder(e.target.checked)} className="w-4 h-4 accent-[#7C3AED]" />
            <Rocket className="w-5 h-5" style={{ color: "#7C3AED" }} />
            <div>
              <span className="text-[14px] font-semibold" style={{ color: "var(--color-text)" }}>Startup Founder</span>
              <p className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>Show founder badge, link your startup page</p>
            </div>
          </label>
        </div>
      </div>

      {/* Investor fields */}
      {isInvestor && (
        <div className="glass-light" style={{ padding: 16, borderRadius: 20, borderLeft: "2px solid #15803D" }}>
          <h3 className="text-[15px] font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
            <TrendingUp className="w-4 h-4" style={{ color: "#15803D" }} /> Investment Profile
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelStyle} style={{ color: "var(--color-text-secondary)" }}>Min Investment (INR)</label><Input type="number" value={investMin} onChange={e => setInvestMin(e.target.value)} placeholder="e.g. 500000" /></div>
              <div><label className={labelStyle} style={{ color: "var(--color-text-secondary)" }}>Max Investment (INR)</label><Input type="number" value={investMax} onChange={e => setInvestMax(e.target.value)} placeholder="e.g. 5000000" /></div>
            </div>
            <div>
              <label className={labelStyle} style={{ color: "var(--color-text-secondary)" }}>Sectors Interested</label>
              <div className="flex flex-wrap gap-1.5">
                {SECTORS.map(s => (
                  <button key={s} type="button" onClick={() => toggleSector(s)}
                    className="px-3 py-1.5 rounded-full text-[12px] font-semibold cursor-pointer transition-all"
                    style={pillActive(sectors.includes(s))}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelStyle} style={{ color: "var(--color-text-secondary)" }}>Stage Preference</label>
              <div className="flex flex-wrap gap-1.5">
                {STAGES.map(s => (
                  <button key={s} type="button" onClick={() => toggleStage(s)}
                    className="px-3 py-1.5 rounded-full text-[12px] font-semibold cursor-pointer transition-all"
                    style={pillActive(stagePrefs.includes(s))}>{s}</button>
                ))}
              </div>
            </div>
            <div><label className={labelStyle} style={{ color: "var(--color-text-secondary)" }}>Portfolio Companies Count</label><Input type="number" value={portfolio} onChange={e => setPortfolio(e.target.value)} placeholder="e.g. 5" /></div>
          </div>
        </div>
      )}

      {/* Founder fields */}
      {isFounder && (
        <div className="glass-light" style={{ padding: 16, borderRadius: 20, borderLeft: "2px solid #7C3AED" }}>
          <h3 className="text-[15px] font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
            <Rocket className="w-4 h-4" style={{ color: "#7C3AED" }} /> Founder Profile
          </h3>
          <div className="space-y-4">
            <div><label className={labelStyle} style={{ color: "var(--color-text-secondary)" }}>Startup Name</label><Input value={startupName} onChange={e => setStartupName(e.target.value)} placeholder="e.g. Acme Inc" /></div>
            <div>
              <label className={labelStyle} style={{ color: "var(--color-text-secondary)" }}>Funding Stage</label>
              <div className="flex flex-wrap gap-1.5">
                {STAGES.map(s => (
                  <button key={s} type="button" onClick={() => setFundingStage(s === fundingStage ? "" : s)}
                    className="px-3 py-1.5 rounded-full text-[12px] font-semibold cursor-pointer transition-all"
                    style={pillActive(fundingStage === s)}>{s}</button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={lookingForFunding} onChange={e => setLookingForFunding(e.target.checked)} className="w-4 h-4 accent-[#7C3AED]" />
              <span className="text-[13px] font-medium" style={{ color: "var(--color-text)" }}>Currently looking for funding</span>
            </label>
            <div><label className={labelStyle} style={{ color: "var(--color-text-secondary)" }}>Pitch Deck URL (optional)</label><Input value={pitchDeckUrl} onChange={e => setPitchDeckUrl(e.target.value)} placeholder="https://..." /></div>
          </div>
        </div>
      )}

      {/* Save */}
      <button type="button" onClick={save} disabled={saving}
        className="w-full h-11 rounded-2xl text-[14px] font-bold transition-all disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(232,115,58,0.25)" }}>
        {saving ? "Saving..." : "Save Additional Roles"}
      </button>
    </div>
  );
}
