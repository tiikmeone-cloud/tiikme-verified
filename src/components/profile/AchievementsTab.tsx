import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const achievementTypes = [
  { value: "award", label: "Competition / Hackathon", emoji: "🏆" },
  { value: "certification", label: "Certification", emoji: "📜" },
  { value: "scholarship", label: "Scholarship / Fellowship", emoji: "🎓" },
  { value: "recognition", label: "Award / Recognition", emoji: "👏" },
  { value: "publication", label: "Publication / Paper", emoji: "📰" },
  { value: "leadership", label: "Leadership Role", emoji: "🌟" },
  { value: "other", label: "Other", emoji: "🎯" },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const years = Array.from({ length: 30 }, (_, i) => String(2026 - i));

interface Achievement {
  id: string; type: string; title: string; issued_by: string | null;
  achievement_date: string | null; description: string | null; visibility: string;
  source_type: string; icon_emoji: string; is_shared_to_feed: boolean;
  verification_url: string | null; created_at: string | null;
}

interface AchievementsTabProps {
  isOwnProfile: boolean; achievements?: Achievement[];
  userId?: string; onRefresh?: () => void;
}

export default function AchievementsTab({ isOwnProfile, achievements = [], userId, onRefresh }: AchievementsTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState(0);
  const [selectedType, setSelectedType] = useState("");
  const [form, setForm] = useState({ title: "", issuedBy: "", month: "", year: "", description: "", credentialUrl: "" });
  const [saving, setSaving] = useState(false);

  const u = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const openAddModal = (preType?: string) => {
    setForm({ title: "", issuedBy: "", month: "", year: "", description: "", credentialUrl: "" });
    if (preType) { setSelectedType(preType); setAddStep(1); }
    else { setSelectedType(""); setAddStep(0); }
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !userId) return;
    setSaving(true);
    const dateStr = form.month && form.year ? `${form.year}-${String(months.indexOf(form.month) + 1).padStart(2, "0")}-01` : null;
    const { error } = await supabase.from("achievements").insert({
      user_id: userId, title: form.title.trim(), type: selectedType || "other",
      issued_by: form.issuedBy.trim() || null, achievement_date: dateStr,
      description: form.description.trim() || null, visibility: "public",
      icon_emoji: achievementTypes.find(t => t.value === selectedType)?.emoji || "🏆",
      verification_url: form.credentialUrl.trim() || null,
    });
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Achievement added ✓");
    setShowAddModal(false);
    onRefresh?.();
  };

  const getTypeIcon = (type: string) => achievementTypes.find(t => t.value === type)?.emoji || "🏆";

  const formatDate = (d: string | null) => {
    if (!d) return "";
    const date = new Date(d);
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const renderModal = () => createPortal(
    <AnimatePresence>
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={() => setShowAddModal(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="p-6 max-w-md w-full" style={{ background: "#FFFFFF", borderRadius: 20, boxShadow: "0 25px 80px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-extrabold" style={{ color: "#1A1A2E" }}>{addStep === 0 ? "Choose type" : "Achievement details"}</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1 cursor-pointer" style={{ color: "#6B7094" }}><X className="w-5 h-5" /></button>
            </div>
            {addStep === 0 && (
              <div className="grid grid-cols-2 gap-2">
                {achievementTypes.map(t => (
                  <button type="button" key={t.value} onClick={() => { setSelectedType(t.value); setAddStep(1); }}
                    className="p-3 text-left cursor-pointer rounded-xl transition-all hover:scale-[1.01]"
                    style={{ background: "#F8F9FC", border: "1px solid #E8E8E8" }}>
                    <span className="text-lg">{t.emoji}</span>
                    <p className="text-[12px] font-bold mt-1" style={{ color: "#1A1A2E" }}>{t.label}</p>
                  </button>
                ))}
              </div>
            )}
            {addStep === 1 && (
              <div className="space-y-3">
                <Input placeholder="Title *" value={form.title} onChange={e => u("title", e.target.value.slice(0, 80))} maxLength={80} />
                <Input placeholder="Issued by / Organisation" value={form.issuedBy} onChange={e => u("issuedBy", e.target.value.slice(0, 60))} maxLength={60} />
                <div className="grid grid-cols-2 gap-2">
                  <select value={form.month} onChange={e => u("month", e.target.value)} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={{ background: "#F8F9FC", border: "1px solid #E8E8E8", color: "#1A1A2E" }}>
                    <option value="">Month</option>{months.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <select value={form.year} onChange={e => u("year", e.target.value)} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={{ background: "#F8F9FC", border: "1px solid #E8E8E8", color: "#1A1A2E" }}>
                    <option value="">Year</option>{years.map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <textarea placeholder="Description (optional, 200 chars)" value={form.description} onChange={e => u("description", e.target.value.slice(0, 200))} rows={2} maxLength={200}
                  className="w-full rounded-xl p-3 text-[12px] outline-none resize-none" style={{ background: "#F8F9FC", border: "1px solid #E8E8E8", color: "#1A1A2E" }} />
                <Input placeholder="Credential URL (optional)" value={form.credentialUrl} onChange={e => u("credentialUrl", e.target.value)} />
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setAddStep(0)}>Back</Button>
                  <Button className="flex-1" onClick={handleSave} disabled={saving || !form.title.trim()}>
                    {saving ? "Saving..." : "Save achievement"}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );

  // Empty state
  if (isOwnProfile && achievements.length === 0) {
    return (
      <>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
          {achievementTypes.slice(0, 5).map(t => (
            <button type="button" key={t.value} onClick={() => openAddModal(t.value)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer active:scale-95"
              style={{ borderColor: "color-mix(in srgb, var(--brand) 30%, transparent)", color: "var(--brand)" }}>
              {t.emoji} {t.label.split(" / ")[0]} +
            </button>
          ))}
        </div>
        <div className="text-center py-10">
          <span className="text-5xl block mb-3">🏆</span>
          <p className="text-[16px] font-bold mb-1" style={{ color: "var(--text-1)" }}>No achievements yet</p>
          <p className="text-[13px] mb-4" style={{ color: "var(--text-3)" }}>Add certifications, wins, or recognitions</p>
          <Button onClick={() => openAddModal()} style={{ background: "var(--brand)" }} className="text-white">
            <Plus className="w-4 h-4 mr-1" /> Add first achievement
          </Button>
        </div>
        {renderModal()}
      </>
    );
  }

  if (!isOwnProfile && achievements.length === 0) {
    return <p className="text-[14px] text-center py-8" style={{ color: "var(--text-3)" }}>No achievements added yet</p>;
  }

  return (
    <>
      <div className="space-y-2">
        {achievements.map(item => (
          <div key={item.id} className="flex items-start gap-3 p-4 rounded-xl transition-all duration-150 hover:shadow-sm"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: "3px solid var(--brand)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0" style={{ background: "var(--brand-dim)" }}>
              {getTypeIcon(item.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold" style={{ color: "var(--text-1)" }}>{item.title}</p>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--text-3)" }}>
                {[item.issued_by, formatDate(item.achievement_date)].filter(Boolean).join(" · ")}
              </p>
              {item.description && <p className="text-[12px] mt-1.5 line-clamp-2" style={{ color: "var(--text-2)" }}>{item.description}</p>}
            </div>
            {item.verification_url && (
              <a href={item.verification_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg shrink-0" style={{ color: "var(--brand)" }}>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        ))}
      </div>
      {isOwnProfile && (
        <button type="button" onClick={() => openAddModal()}
          className="w-full py-3 mt-3 border-2 border-dashed rounded-2xl text-sm font-medium cursor-pointer active:scale-[0.98] transition-all"
          style={{ borderColor: "color-mix(in srgb, var(--brand) 30%, transparent)", color: "var(--brand)" }}>
          <Plus className="w-4 h-4 inline mr-1" /> Add achievement
        </button>
      )}
      {renderModal()}
    </>
  );
}
