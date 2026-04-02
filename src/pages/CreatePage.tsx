import { useState } from "react";
import { ArrowLeft, ArrowRight, GraduationCap, Building2, Landmark, Hospital, Palette, Radio, Upload, Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const pageTypes = [
  { id: "academic", label: "Academic", desc: "Colleges, universities, schools", emoji: "🎓", icon: GraduationCap },
  { id: "company", label: "Company", desc: "Startups, corporations", emoji: "🏢", icon: Building2 },
  { id: "government", label: "Government", desc: "Departments, police, courts", emoji: "🏛️", icon: Landmark },
  { id: "institution", label: "Institution", desc: "Hospitals, banks, NGOs", emoji: "🏥", icon: Hospital },
  { id: "creator", label: "Creator / Agency", desc: "Studios, content, design", emoji: "🎨", icon: Palette },
  { id: "other", label: "Other", desc: "Clubs, associations, etc.", emoji: "📻", icon: Radio },
];

const companySubTypes = ["Private", "Public", "PSU", "Startup", "NGO", "Agency", "Studio"];
const academicSubTypes = ["University", "Engineering", "Medical", "School", "IIT/IIM/IISc", "Deemed", "Polytechnic"];
const govtSubTypes = ["Central Dept", "State Dept", "Police", "Municipality", "Defence", "Court", "PSU"];
const institutionSubTypes = ["Government Hospital", "Private Hospital", "Clinic", "Nationalised Bank", "Private Bank", "Cooperative Bank", "NBFC"];
const indianStates = ["Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Karnataka", "Kerala", "Maharashtra", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"];
const teamSizes = ["1-10", "11-50", "51-200", "201-500", "500-2000", "2000+"];
const cultureTags = ["Remote-friendly", "Startup culture", "Work-life balance", "Growth-focused", "Diverse team", "Engineering-first"];
const yearOptions = Array.from({ length: 126 }, (_, i) => String(2026 - i));

const CreatePage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState("");
  const [form, setForm] = useState<Record<string, string>>({ name: "", alsoKnownAs: "", subType: "", email: "", website: "", city: "", state: "", pincode: "", foundedYear: "", about: "" });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customLinks, setCustomLinks] = useState<{ url: string; label: string }[]>([]);
  const [awards, setAwards] = useState<{ name: string; year: string; issuer: string }[]>([]);
  const [inviteEmails, setInviteEmails] = useState("");

  const u = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const toggleTag = (t: string) => setSelectedTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  const getSubTypes = () => {
    switch (selectedType) {
      case "company": return companySubTypes;
      case "academic": return academicSubTypes;
      case "government": return govtSubTypes;
      case "institution": return institutionSubTypes;
      default: return [];
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "var(--bg)" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[560px]">
        <h1 className="text-[24px] font-extrabold text-center mb-2" style={{ color: "var(--text-1)" }}>Create a Tiikme Page</h1>
        <p className="text-[14px] text-center mb-8" style={{ color: "var(--text-2)" }}>Build your organisation's presence on Tiikme</p>

        <div className="flex gap-1.5 mb-8 max-w-xs mx-auto">
          {[0, 1, 2, 3, 4].map(s => (
            <div key={s} className="flex-1 h-[3px] rounded-full transition-all duration-500" style={{ background: s <= step ? "var(--brand)" : "var(--border-2)" }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Type Selection */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div className="glass-card p-8">
                <h2 className="text-[20px] font-extrabold text-center mb-6" style={{ color: "var(--text-1)" }}>What are you creating a Page for?</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {pageTypes.map(pt => {
                    const sel = selectedType === pt.id;
                    return (
                      <button key={pt.id} onClick={() => setSelectedType(pt.id)}
                        className="t-card t-card-hover p-4 text-center cursor-pointer relative"
                        style={{ border: sel ? "1.5px solid var(--brand)" : undefined, background: sel ? "var(--brand-dim)" : undefined }}>
                        {sel && <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--brand)" }}><Check className="w-3 h-3 text-white" /></div>}
                        <span className="text-2xl block mb-2">{pt.emoji}</span>
                        <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{pt.label}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>{pt.desc}</p>
                      </button>
                    );
                  })}
                </div>
                <Button size="xl" className="w-full mt-6" disabled={!selectedType} onClick={() => setStep(1)}>Continue <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <button onClick={() => setStep(0)} className="flex items-center gap-1 text-[13px] mb-4 cursor-pointer" style={{ color: "var(--text-2)" }}><ArrowLeft className="w-4 h-4" /> Back</button>
              <div className="glass-card p-8 max-h-[75vh] overflow-y-auto">
                <h2 className="text-[20px] font-extrabold text-center mb-6" style={{ color: "var(--text-1)" }}>Page details</h2>
                <div className="space-y-3">
                  <Input placeholder="Page name (required)" value={form.name} onChange={e => u("name", e.target.value)} />
                  <Input placeholder="Also known as / Previous name (optional)" value={form.alsoKnownAs} onChange={e => u("alsoKnownAs", e.target.value)} />
                  {getSubTypes().length > 0 && (
                    <select value={form.subType} onChange={e => u("subType", e.target.value)} className="w-full h-11 rounded-xl px-3 text-[14px] outline-none cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                      <option value="">Sub-type</option>
                      {getSubTypes().map(s => <option key={s}>{s}</option>)}
                    </select>
                  )}
                  <Input type="email" placeholder="Official email (required)" value={form.email} onChange={e => u("email", e.target.value)} />
                  <Input placeholder="Official website URL (optional)" value={form.website} onChange={e => u("website", e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="City (required)" value={form.city} onChange={e => u("city", e.target.value)} />
                    <select value={form.state} onChange={e => u("state", e.target.value)} className="w-full h-11 rounded-xl px-3 text-[14px] outline-none cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                      <option value="">State</option>
                      {indianStates.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Pincode (optional)" value={form.pincode} onChange={e => u("pincode", e.target.value)} />
                    <select value={form.foundedYear} onChange={e => u("foundedYear", e.target.value)} className="w-full h-11 rounded-xl px-3 text-[14px] outline-none cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                      <option value="">Founded year</option>
                      {yearOptions.map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                  <textarea placeholder="About (500 chars)" value={form.about} onChange={e => u("about", e.target.value.slice(0, 500))} rows={3} maxLength={500}
                    className="w-full rounded-xl p-3 text-[13px] outline-none resize-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }} />

                  {/* Type-specific fields */}
                  {selectedType === "company" && (
                    <div className="space-y-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                      <select value={form.teamSize || ""} onChange={e => u("teamSize", e.target.value)} className="w-full h-11 rounded-xl px-3 text-[14px] outline-none cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                        <option value="">Team size</option>
                        {teamSizes.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <Input placeholder="Why work with us (250 chars)" value={form.whyWork || ""} onChange={e => u("whyWork", e.target.value.slice(0, 250))} maxLength={250} />
                      <div>
                        <p className="text-[11px] font-semibold mb-2" style={{ color: "var(--text-3)" }}>Work culture</p>
                        <div className="flex flex-wrap gap-1.5">
                          {cultureTags.map(t => (
                            <button key={t} onClick={() => toggleTag(t)} className="text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer"
                              style={{ background: selectedTags.includes(t) ? "var(--brand-dim)" : "var(--surface-2)", border: selectedTags.includes(t) ? "1px solid var(--brand)" : "1px solid var(--border)", color: selectedTags.includes(t) ? "var(--brand)" : "var(--text-2)" }}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedType === "academic" && (
                    <div className="space-y-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                      <Input placeholder="Affiliation (e.g. Anna University)" value={form.affiliation || ""} onChange={e => u("affiliation", e.target.value)} />
                      <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="NAAC Grade (optional)" value={form.naacGrade || ""} onChange={e => u("naacGrade", e.target.value)} />
                        <Input placeholder="NIRF Ranking (optional)" type="number" value={form.nirfRanking || ""} onChange={e => u("nirfRanking", e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="ghost" className="flex-1" onClick={() => setStep(0)}>Back</Button>
                  <Button className="flex-1" disabled={!form.name || !form.email || !form.city} onClick={() => setStep(2)}>Next <ArrowRight className="w-4 h-4 ml-1" /></Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Media & Links */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-[13px] mb-4 cursor-pointer" style={{ color: "var(--text-2)" }}><ArrowLeft className="w-4 h-4" /> Back</button>
              <div className="glass-card p-8 max-h-[75vh] overflow-y-auto">
                <h2 className="text-[20px] font-extrabold text-center mb-6" style={{ color: "var(--text-1)" }}>Media & Links</h2>
                <div className="space-y-4">
                  <div>
                    <p className="micro-label mb-2">Logo</p>
                    <div className="w-20 h-20 rounded-xl flex items-center justify-center cursor-pointer" style={{ background: "var(--surface-2)", border: "2px dashed var(--border-2)" }}>
                      <Upload className="w-5 h-5" style={{ color: "var(--text-3)" }} />
                    </div>
                  </div>
                  <div>
                    <p className="micro-label mb-2">Cover photo</p>
                    <div className="w-full h-24 rounded-xl flex items-center justify-center cursor-pointer" style={{ background: "var(--surface-2)", border: "2px dashed var(--border-2)" }}>
                      <Upload className="w-5 h-5" style={{ color: "var(--text-3)" }} />
                    </div>
                  </div>
                  <div>
                    <p className="micro-label mb-2">Custom links (up to 5)</p>
                    {customLinks.map((link, i) => (
                      <div key={i} className="flex gap-2 mb-2 items-center">
                        <Input placeholder="URL" value={link.url} onChange={e => { const updated = [...customLinks]; updated[i].url = e.target.value; setCustomLinks(updated); }} className="flex-1" />
                        <Input placeholder="Display text" value={link.label} onChange={e => { const updated = [...customLinks]; updated[i].label = e.target.value; setCustomLinks(updated); }} className="flex-1" />
                        <button onClick={() => setCustomLinks(customLinks.filter((_, idx) => idx !== i))} className="p-1 cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {customLinks.length < 5 && (
                      <button onClick={() => setCustomLinks([...customLinks, { url: "", label: "" }])} className="text-[12px] font-semibold cursor-pointer" style={{ color: "var(--brand)" }}>+ Add link</button>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                  <Button className="flex-1" onClick={() => setStep(3)}>Next <ArrowRight className="w-4 h-4 ml-1" /></Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Admin permissions */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <button onClick={() => setStep(2)} className="flex items-center gap-1 text-[13px] mb-4 cursor-pointer" style={{ color: "var(--text-2)" }}><ArrowLeft className="w-4 h-4" /> Back</button>
              <div className="glass-card p-8">
                <h2 className="text-[20px] font-extrabold text-center mb-2" style={{ color: "var(--text-1)" }}>Admin permissions</h2>
                <p className="text-[14px] text-center mb-6" style={{ color: "var(--text-2)" }}>Who else can manage this Page?</p>
                <textarea value={inviteEmails} onChange={e => setInviteEmails(e.target.value)} placeholder="Enter emails (comma-separated)" rows={3}
                  className="w-full rounded-xl p-3 text-[13px] outline-none resize-none mb-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
                <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1" onClick={() => setStep(4)}>Skip for now</Button>
                  <Button className="flex-1" onClick={() => { toast.success("Invites sent!"); setStep(4); }}>Send invites</Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Founding member */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div className="glass-card p-8 text-center">
                <span className="text-4xl block mb-4">🏅</span>
                <h2 className="text-[24px] font-extrabold mb-2" style={{ color: "var(--text-1)" }}>You're one of our founding Pages</h2>
                <p className="text-[14px] mb-1" style={{ color: "var(--text-2)" }}>You are Page #847 of 2,000 founding members.</p>
                <p className="text-[14px] mb-6" style={{ color: "var(--text-2)" }}>You get 6 months of Tiikme Growth — free.</p>
                <div className="text-left space-y-2 mb-6 px-4">
                  {["Full page customization", "Unlimited members", "Job & opportunity postings", "Full Workspace access", "Analytics", "Priority search ranking"].map(f => (
                    <div key={f} className="flex items-center gap-2 text-[13px]" style={{ color: "var(--text-1)" }}>
                      <Check className="w-4 h-4 shrink-0" style={{ color: "var(--brand)" }} /> {f}
                    </div>
                  ))}
                </div>
                <p className="text-[12px] mb-4" style={{ color: "var(--brand)" }}>1,153 founding spots remaining</p>
                <Button size="xl" className="w-full" onClick={() => { toast.success("Page created!"); navigate("/app/explore"); }}>Complete my Page <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default CreatePage;
