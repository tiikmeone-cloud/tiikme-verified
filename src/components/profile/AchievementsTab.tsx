import { useState } from "react";
import { Trophy, ScrollText, Star, Medal, FileText, Plus, X, ArrowRight, Globe, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import VisibilityToggle from "./VisibilityToggle";

const achievementTypes = [
  { value: "award", label: "Award / Recognition", emoji: "🏆" },
  { value: "certification", label: "Certification", emoji: "📜" },
  { value: "hackathon", label: "Hackathon", emoji: "🥇" },
  { value: "publication", label: "Publication", emoji: "📄" },
  { value: "rank", label: "Rank / Score", emoji: "⭐" },
  { value: "other", label: "Other", emoji: "✨" },
];

const recognizedBodies = ["Google", "AWS", "Microsoft", "NASSCOM", "Coursera", "Udemy", "IBM", "Meta", "Oracle", "Cisco", "CompTIA", "PMI"];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const years = Array.from({ length: 30 }, (_, i) => String(2026 - i));

interface Achievement {
  id: string;
  type: string;
  title: string;
  issued_by: string;
  date: string;
  description: string;
  visibility: string;
  source_type: string;
  source_workspace_name?: string;
  icon_emoji: string;
  is_shared_to_feed: boolean;
}

interface AchievementsTabProps {
  isOwnProfile: boolean;
  achievements?: Achievement[];
}

export default function AchievementsTab({ isOwnProfile, achievements = [] }: AchievementsTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [addStep, setAddStep] = useState(0);
  const [selectedType, setSelectedType] = useState("");
  const [form, setForm] = useState({ title: "", issuedBy: "", month: "", year: "", description: "", certUrl: "", visibility: "public" });
  const [items, setItems] = useState<Achievement[]>(achievements);

  const u = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) { toast.info("Title is required"); return; }
    const newItem: Achievement = {
      id: Date.now().toString(),
      type: selectedType,
      title: form.title,
      issued_by: form.issuedBy,
      date: form.month && form.year ? `${form.month} ${form.year}` : "",
      description: form.description,
      visibility: form.visibility,
      source_type: "self",
      icon_emoji: achievementTypes.find(t => t.value === selectedType)?.emoji || "🏆",
      is_shared_to_feed: false,
    };
    setItems(prev => [newItem, ...prev]);
    setShowAddModal(false);
    setAddStep(0);
    setForm({ title: "", issuedBy: "", month: "", year: "", description: "", certUrl: "", visibility: "public" });
    toast.success("Achievement added!");
  };

  const handleSaveCert = () => {
    if (!form.title.trim()) { toast.info("Certificate name is required"); return; }
    const isRecognized = recognizedBodies.some(b => form.issuedBy.toLowerCase().includes(b.toLowerCase()));
    const newItem: Achievement = {
      id: Date.now().toString(),
      type: "certification",
      title: form.title,
      issued_by: form.issuedBy,
      date: form.month && form.year ? `${form.month} ${form.year}` : "",
      description: isRecognized ? "Verified issuance" : "Self-reported · Pending verification",
      visibility: form.visibility,
      source_type: isRecognized ? "verified" : "self",
      icon_emoji: "📜",
      is_shared_to_feed: false,
    };
    setItems(prev => [newItem, ...prev]);
    setShowCertModal(false);
    setForm({ title: "", issuedBy: "", month: "", year: "", description: "", certUrl: "", visibility: "public" });
    toast.success("Certification added!");
  };

  const handleShareToFeed = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, is_shared_to_feed: true } : item));
    toast.success("Posted to feed ✓");
  };

  const handleVisibilityChange = (id: string, vis: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, visibility: vis } : item));
  };

  // Empty state for own profile
  if (isOwnProfile && items.length === 0) {
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <button onClick={() => { setShowAddModal(true); setAddStep(0); }} className="t-card t-card-hover p-5 text-center cursor-pointer">
            <span className="text-2xl block mb-2">🏆</span>
            <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>Add an achievement</p>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>A win, recognition, or milestone</p>
            <Button size="sm" variant="secondary" className="mt-3 gap-1"><Plus className="w-3 h-3" /> Add</Button>
          </button>
          <button onClick={() => setShowCertModal(true)} className="t-card t-card-hover p-5 text-center cursor-pointer">
            <span className="text-2xl block mb-2">📜</span>
            <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>Upload a certification</p>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>Course completion, professional cert</p>
            <Button size="sm" variant="secondary" className="mt-3 gap-1"><Plus className="w-3 h-3" /> Upload</Button>
          </button>
          <div className="t-card p-5 text-center">
            <span className="text-2xl block mb-2">⭐</span>
            <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>Got recognised?</p>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>Ask your manager to post it</p>
            <button className="text-[12px] font-semibold mt-3" style={{ color: "var(--brand)" }}>How it works</button>
          </div>
        </div>
        <p className="text-[12px] text-center" style={{ color: "var(--text-3)" }}>Once added, achievements appear here and are visible to HR when they search your profile.</p>

        {renderAddModal()}
        {renderCertModal()}
      </>
    );
  }

  // Empty state for other profiles
  if (!isOwnProfile && items.length === 0) {
    return <p className="text-[14px] text-center py-8" style={{ color: "var(--text-3)" }}>No achievements added yet</p>;
  }

  function renderAddModal() {
    return (
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[17px] font-extrabold" style={{ color: "var(--text-1)" }}>{addStep === 0 ? "Choose type" : addStep === 1 ? "Fill details" : "Set visibility"}</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1 cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-5 h-5" /></button>
              </div>
              {addStep === 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {achievementTypes.map(t => (
                    <button key={t.value} onClick={() => { setSelectedType(t.value); setAddStep(1); }}
                      className="t-card t-card-hover p-3 text-left cursor-pointer">
                      <span className="text-lg">{t.emoji}</span>
                      <p className="text-[12px] font-bold mt-1" style={{ color: "var(--text-1)" }}>{t.label}</p>
                    </button>
                  ))}
                </div>
              )}
              {addStep === 1 && (
                <div className="space-y-3">
                  <Input placeholder="Title (required)" value={form.title} onChange={e => u("title", e.target.value.slice(0, 80))} maxLength={80} />
                  <Input placeholder="Issued by / Recognised by" value={form.issuedBy} onChange={e => u("issuedBy", e.target.value.slice(0, 60))} maxLength={60} />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={form.month} onChange={e => u("month", e.target.value)} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                      <option value="">Month</option>{months.map(m => <option key={m}>{m}</option>)}
                    </select>
                    <select value={form.year} onChange={e => u("year", e.target.value)} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                      <option value="">Year</option>{years.map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                  <textarea placeholder="Description (optional)" value={form.description} onChange={e => u("description", e.target.value.slice(0, 200))} rows={2} maxLength={200}
                    className="w-full rounded-xl p-3 text-[12px] outline-none resize-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
                  <Input placeholder="Certificate URL (optional)" value={form.certUrl} onChange={e => u("certUrl", e.target.value)} />
                  <div className="flex gap-3 pt-2">
                    <Button variant="ghost" className="flex-1" onClick={() => setAddStep(0)}>Back</Button>
                    <Button className="flex-1" onClick={() => setAddStep(2)}>Next</Button>
                  </div>
                </div>
              )}
              {addStep === 2 && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {(["public", "connections", "private"] as const).map(v => {
                      const icons = { public: Globe, connections: Users, private: Lock };
                      const labels = { public: "Public", connections: "Connections", private: "Private" };
                      const Icon = icons[v];
                      return (
                        <button key={v} onClick={() => u("visibility", v)}
                          className="flex-1 py-3 rounded-xl text-center text-[12px] font-semibold cursor-pointer flex flex-col items-center gap-1"
                          style={{ background: form.visibility === v ? "var(--brand-dim)" : "var(--surface-2)", border: form.visibility === v ? "1px solid var(--brand)" : "1px solid var(--border)", color: form.visibility === v ? "var(--brand)" : "var(--text-2)" }}>
                          <Icon className="w-4 h-4" />
                          {labels[v]}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="ghost" className="flex-1" onClick={() => setAddStep(1)}>Back</Button>
                    <Button className="flex-1" onClick={handleSave}>Save achievement</Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  function renderCertModal() {
    return (
      <AnimatePresence>
        {showCertModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={() => setShowCertModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[17px] font-extrabold" style={{ color: "var(--text-1)" }}>Upload certification</h2>
                <button onClick={() => setShowCertModal(false)} className="p-1 cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <Input placeholder="Certificate name (required)" value={form.title} onChange={e => u("title", e.target.value)} />
                <Input placeholder="Issuing body" value={form.issuedBy} onChange={e => u("issuedBy", e.target.value)} list="recognized-bodies" />
                <datalist id="recognized-bodies">{recognizedBodies.map(b => <option key={b} value={b} />)}</datalist>
                <Input placeholder="Certificate ID / number (optional)" value={form.certUrl} onChange={e => u("certUrl", e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <select value={form.month} onChange={e => u("month", e.target.value)} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                    <option value="">Issue month</option>{months.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <select value={form.year} onChange={e => u("year", e.target.value)} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                    <option value="">Issue year</option>{years.map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <Input placeholder="External verification URL (optional)" value={form.description} onChange={e => u("description", e.target.value)} />
                <Button className="w-full" onClick={handleSaveCert}>Save certification</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  // Render achievement cards
  return (
    <>
      {isOwnProfile && (
        <div className="flex gap-2 mb-4">
          <Button size="sm" variant="secondary" onClick={() => { setShowAddModal(true); setAddStep(0); }} className="gap-1"><Plus className="w-3 h-3" /> Add achievement</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowCertModal(true)} className="gap-1"><Plus className="w-3 h-3" /> Upload cert</Button>
        </div>
      )}
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="t-card p-4 relative">
            <div className="absolute top-3 right-3">
              {isOwnProfile && <VisibilityToggle value={item.visibility} onChange={v => handleVisibilityChange(item.id, v)} />}
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">{item.icon_emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold" style={{ color: "var(--text-1)" }}>{item.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {item.source_type === "self" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-3)" }}>Self-added</span>
                  )}
                  {item.source_type === "workspace" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>by {item.source_workspace_name} ✓</span>
                  )}
                  {item.source_type === "verified" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>Verified issuance</span>
                  )}
                  {item.date && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>{item.date}</span>
                  )}
                </div>
                {item.description && item.source_type !== "verified" && (
                  <p className="text-[12px] mt-1.5 line-clamp-2" style={{ color: "var(--text-2)" }}>{item.description}</p>
                )}
              </div>
            </div>
            {isOwnProfile && item.visibility === "public" && (
              <div className="mt-3 pt-2 flex justify-end" style={{ borderTop: "1px solid var(--border)" }}>
                {item.is_shared_to_feed ? (
                  <span className="text-[11px] font-semibold" style={{ color: "var(--text-3)" }}>Shared ✓</span>
                ) : (
                  <button onClick={() => handleShareToFeed(item.id)} className="text-[11px] font-semibold cursor-pointer flex items-center gap-1" style={{ color: "var(--brand)" }}>
                    Share to feed <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {renderAddModal()}
      {renderCertModal()}
    </>
  );
}
