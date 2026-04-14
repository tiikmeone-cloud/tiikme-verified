import { useState, useEffect } from "react";
import { storageImageUrl } from "@/lib/imageTransform";
import {
  Briefcase, GraduationCap, Rocket, Award, Code2, MessageCircle,
  MapPin, CheckCircle, Clock, Eye, EyeOff, Trash2, Plus, ExternalLink,
  Star, ChevronDown, ChevronUp, X
} from "lucide-react";
import { Link } from "react-router-dom";
import GlassBox from "@/components/ui/GlassBox";
import VerificationRequest from "@/components/profile/VerificationRequest";
import { useCompanyLogos } from "@/hooks/useCompanyLogos";

/* ── Helpers ── */
const LOGO_COLORS = ["#E8733A", "#4A90D9", "#34C759", "#FF6B9D", "#8B5CF6", "#FFB800"];
const hashColor = (name: string) => LOGO_COLORS[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % LOGO_COLORS.length];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDuration = (start: string | null, end: string | null, isCurrent: boolean) => {
  const fmt = (d: string) => { const dt = new Date(d); return `${months[dt.getMonth()]} ${dt.getFullYear()}`; };
  if (!start) return "";
  const s = new Date(start);
  const e = isCurrent ? new Date() : end ? new Date(end) : null;
  if (!e) return fmt(start);
  let mo = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (mo < 0) mo = 0;
  const yrs = Math.floor(mo / 12); const mos = mo % 12;
  const parts: string[] = [];
  if (yrs > 0) parts.push(`${yrs} yr${yrs > 1 ? "s" : ""}`);
  if (mos > 0) parts.push(`${mos} mo${mos > 1 ? "s" : ""}`);
  return `${fmt(start)} – ${isCurrent ? "Present" : end ? fmt(end) : ""} · ${parts.join(" ") || "< 1 mo"}`;
};

const getDuration = (item: any) => {
  if (item.start_month && item.start_year) {
    const start = `${item.start_month} ${item.start_year}`;
    const end = item.is_current ? "Present" : (item.end_month && item.end_year ? `${item.end_month} ${item.end_year}` : "");
    // Calculate duration
    if (item.start_date) {
      return formatDuration(item.start_date, item.end_date, item.is_current);
    }
    return `${start} – ${end}`;
  }
  if (item.start_date) return formatDuration(item.start_date, item.end_date, item.is_current);
  return "";
};

function getTimeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ── Verification Badge ── */
const VerifBadge = ({ item, isOwn, onStatusChange }: { item: any; isOwn: boolean; onStatusChange?: (id: string, status: string) => void }) => {
  const status = item.verification_status || "unverified";
  if (status === "verified") return (
    <span title="Verified" className="shrink-0">
      <CheckCircle className="w-4 h-4" style={{ color: "#34C759" }} />
    </span>
  );
  if (status === "pending") return (
    <span title="Verification pending" className="shrink-0">
      <Clock className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />
    </span>
  );
  if (isOwn) return <VerificationRequest item={item} itemType={item.item_type || "experience"} onStatusChange={onStatusChange!} />;
  return null;
};

/* ── Company Logo Square ── */
const CompanyLogo = ({ name, logoUrl, color, size = 40 }: { name: string; logoUrl?: string | null; color?: string; size?: number }) => {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const bg = color || hashColor(name || "X");
  const radius = size >= 48 ? "rounded-2xl" : "rounded-xl";

  return (
    <div className={`${radius} flex items-center justify-center text-[12px] font-bold text-white shrink-0 overflow-hidden`}
      style={{ width: size, height: size, backgroundColor: logoUrl ? "transparent" : bg }}>
      {logoUrl ? (
        <img src={storageImageUrl(logoUrl, "avatar")} alt="" className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; e.currentTarget.parentElement!.style.backgroundColor = bg; }} />
      ) : initials}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   EXPERIENCE SECTION
   ═══════════════════════════════════════════════════════════ */
interface SectionProps {
  items: any[];
  isOwnProfile: boolean;
  onAdd: () => void;
  onDelete: (id: string, table: "work_items" | "achievements") => void;
  onToggleVisibility: (id: string, table: "work_items" | "achievements", vis: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

export const ExperienceSection = ({ items, isOwnProfile, onAdd, onDelete, onToggleVisibility, onStatusChange }: SectionProps) => {
  const [expanded, setExpanded] = useState(true);
  const { lookupBatch, getLogo } = useCompanyLogos();
  const MAX_COLLAPSED = 3;

  useEffect(() => {
    const names = items.map(e => e.company_name || e.institution_name || "").filter(Boolean);
    if (names.length > 0) lookupBatch(names);
  }, [items, lookupBatch]);

  const visibleItems = expanded ? items : items.slice(0, MAX_COLLAPSED);

  return (
    <GlassBox accent="experience">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" style={{ color: "#4A90D9" }} />
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>Experience</h2>
          {items.length > 0 && <span className="text-[12px] font-medium" style={{ color: "var(--color-text-muted)" }}>{items.length}</span>}
        </div>
        {isOwnProfile && (
          <button type="button" onClick={onAdd} className="btn-glass-pill" style={{ padding: "4px 12px", fontSize: 12, borderRadius: 10 }}>
            <Plus className="w-3 h-3 inline mr-0.5" /> Add
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-[13px] mt-2" style={{ color: "var(--color-text-muted)" }}>No experience added</p>
      ) : (
        <div className="mt-2 space-y-0">
          {visibleItems.map((exp: any, idx: number) => {
            const companyName = exp.company_name || exp.institution_name || "";
            const logo = getLogo(companyName);
            return (
              <div key={exp.id} className="flex gap-3 py-2.5 group"
                style={{ borderBottom: idx < visibleItems.length - 1 ? "1px solid var(--glass-border-subtle)" : "none" }}>
                <CompanyLogo name={companyName} logoUrl={logo?.logo_url} />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold leading-tight" style={{ color: "var(--color-text)" }}>
                    {exp.job_title || exp.title}
                  </p>
                  <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>{companyName}</p>
                  <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>{getDuration(exp)}</p>
                  {exp.work_location && (
                    <p className="text-[12px] flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                      <MapPin className="w-3 h-3" />{exp.work_location}
                    </p>
                  )}
                </div>
                <div className="flex items-start gap-1 shrink-0">
                  <VerifBadge item={exp} isOwn={isOwnProfile} onStatusChange={onStatusChange} />
                  {isOwnProfile && (
                    <div className="flex flex-col gap-0.5 items-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => onToggleVisibility(exp.id, "work_items", exp.visibility || "public")} className="p-1 cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
                        {exp.visibility === "public" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button type="button" onClick={() => onDelete(exp.id, "work_items")} className="p-1 cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {items.length > MAX_COLLAPSED && (
            <button type="button" onClick={() => setExpanded(!expanded)}
              className="text-[12px] font-semibold mt-1 flex items-center gap-1" style={{ color: "var(--color-accent)" }}>
              {expanded ? <>Show less <ChevronUp className="w-3 h-3" /></> : <>See all {items.length} experiences <ChevronDown className="w-3 h-3" /></>}
            </button>
          )}
        </div>
      )}
    </GlassBox>
  );
};

/* ═══════════════════════════════════════════════════════════
   EDUCATION SECTION
   ═══════════════════════════════════════════════════════════ */
export const EducationSection = ({ items, isOwnProfile, onAdd, onDelete, onToggleVisibility, onStatusChange }: SectionProps) => {
  const [expanded, setExpanded] = useState(true);
  const { lookupBatch, getLogo } = useCompanyLogos();
  const MAX_COLLAPSED = 3;

  useEffect(() => {
    const names = items.map(e => e.institution_name_edu || e.institution_name || "").filter(Boolean);
    if (names.length > 0) lookupBatch(names);
  }, [items, lookupBatch]);

  const visibleItems = expanded ? items : items.slice(0, MAX_COLLAPSED);

  return (
    <GlassBox accent="education">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5" style={{ color: "#34C759" }} />
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>Education</h2>
          {items.length > 0 && <span className="text-[12px] font-medium" style={{ color: "var(--color-text-muted)" }}>{items.length}</span>}
        </div>
        {isOwnProfile && (
          <button type="button" onClick={onAdd} className="btn-glass-pill" style={{ padding: "4px 12px", fontSize: 12, borderRadius: 10 }}>
            <Plus className="w-3 h-3 inline mr-0.5" /> Add
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-[13px] mt-2" style={{ color: "var(--color-text-muted)" }}>No education added</p>
      ) : (
        <div className="mt-2 space-y-0">
          {visibleItems.map((edu: any, idx: number) => {
            const instName = edu.institution_name_edu || edu.institution_name || "";
            const logo = getLogo(instName);
            const degree = [edu.degree_type || edu.title, edu.field_of_study].filter(Boolean).join(" in ");
            const years = [edu.start_year, edu.is_current ? "Present" : edu.end_year].filter(Boolean).join(" – ");

            return (
              <div key={edu.id} className="flex gap-3 py-2.5 group"
                style={{ borderBottom: idx < visibleItems.length - 1 ? "1px solid var(--glass-border-subtle)" : "none" }}>
                <CompanyLogo name={instName} logoUrl={logo?.logo_url} color="#34C759" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold leading-tight" style={{ color: "var(--color-text)" }}>{degree || "Degree"}</p>
                  <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>{instName}</p>
                  {years && <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>{years}</p>}
                  {edu.grade_score && <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>Grade: {edu.grade_score}</p>}
                </div>
                <div className="flex items-start gap-1 shrink-0">
                  <VerifBadge item={{ ...edu, item_type: "education" }} isOwn={isOwnProfile} onStatusChange={onStatusChange} />
                  {isOwnProfile && (
                    <div className="flex flex-col gap-0.5 items-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => onToggleVisibility(edu.id, "work_items", edu.visibility || "public")} className="p-1 cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
                        {edu.visibility === "public" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button type="button" onClick={() => onDelete(edu.id, "work_items")} className="p-1 cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {items.length > MAX_COLLAPSED && (
            <button type="button" onClick={() => setExpanded(!expanded)}
              className="text-[12px] font-semibold mt-1 flex items-center gap-1" style={{ color: "var(--color-accent)" }}>
              {expanded ? <>Show less <ChevronUp className="w-3 h-3" /></> : <>See all {items.length} <ChevronDown className="w-3 h-3" /></>}
            </button>
          )}
        </div>
      )}
    </GlassBox>
  );
};

/* ═══════════════════════════════════════════════════════════
   PROJECTS SECTION
   ═══════════════════════════════════════════════════════════ */
export const ProjectsSection = ({ items, isOwnProfile, onAdd, onDelete, onToggleVisibility, onStatusChange }: SectionProps) => {
  const [expanded, setExpanded] = useState(true);
  const MAX_COLLAPSED = 3;
  const visibleItems = expanded ? items : items.slice(0, MAX_COLLAPSED);

  return (
    <GlassBox accent="projects">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5" style={{ color: "#FF6B9D" }} />
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>Projects</h2>
          {items.length > 0 && <span className="text-[12px] font-medium" style={{ color: "var(--color-text-muted)" }}>{items.length}</span>}
        </div>
        {isOwnProfile && (
          <button type="button" onClick={onAdd} className="btn-glass-pill" style={{ padding: "4px 12px", fontSize: 12, borderRadius: 10 }}>
            <Plus className="w-3 h-3 inline mr-0.5" /> Add
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-[13px] mt-2" style={{ color: "var(--color-text-muted)" }}>No projects added</p>
      ) : (
        <div className="mt-2 space-y-0">
          {visibleItems.map((p: any, idx: number) => {
            const techStack: string[] = p.tech_stack || [];
            const years = [p.start_year, p.is_current ? "Present" : p.end_year].filter(Boolean).join(" – ");

            return (
              <div key={p.id} className="flex gap-3 py-2.5 group"
                style={{ borderBottom: idx < visibleItems.length - 1 ? "1px solid var(--glass-border-subtle)" : "none" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,107,157,0.10)" }}>
                  <Rocket className="w-4 h-4" style={{ color: "#FF6B9D" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold leading-tight" style={{ color: "var(--color-text)" }}>{p.title}</p>
                  {p.company_name && <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>{p.company_name}</p>}
                  {years && <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>{years}</p>}
                  {techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {techStack.slice(0, 3).map((s: string) => (
                        <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-lg"
                          style={{ background: "rgba(255,107,157,0.08)", color: "#FF6B9D" }}>{s}</span>
                      ))}
                      {techStack.length > 3 && <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg" style={{ background: "var(--glass-bg)", color: "var(--color-text-muted)" }}>+{techStack.length - 3}</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-start gap-1 shrink-0">
                  <VerifBadge item={{ ...p, item_type: "project" }} isOwn={isOwnProfile} onStatusChange={onStatusChange} />
                  {isOwnProfile && (
                    <div className="flex flex-col gap-0.5 items-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => onToggleVisibility(p.id, "work_items", p.visibility || "public")} className="p-1 cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
                        {p.visibility === "public" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button type="button" onClick={() => onDelete(p.id, "work_items")} className="p-1 cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {items.length > MAX_COLLAPSED && (
            <button type="button" onClick={() => setExpanded(!expanded)}
              className="text-[12px] font-semibold mt-1 flex items-center gap-1" style={{ color: "var(--color-accent)" }}>
              {expanded ? <>Show less <ChevronUp className="w-3 h-3" /></> : <>See all {items.length} projects <ChevronDown className="w-3 h-3" /></>}
            </button>
          )}
        </div>
      )}
    </GlassBox>
  );
};

/* ═══════════════════════════════════════════════════════════
   ACHIEVEMENTS SECTION
   ═══════════════════════════════════════════════════════════ */
export const AchievementsSection = ({ items, isOwnProfile, onAdd, onDelete, onToggleVisibility }: Omit<SectionProps, "onStatusChange">) => {
  const [expanded, setExpanded] = useState(true);
  const MAX_COLLAPSED = 3;
  const visibleItems = expanded ? items : items.slice(0, MAX_COLLAPSED);

  return (
    <GlassBox accent="achievements">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5" style={{ color: "#FFB800" }} />
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>Achievements</h2>
          {items.length > 0 && <span className="text-[12px] font-medium" style={{ color: "var(--color-text-muted)" }}>{items.length}</span>}
        </div>
        {isOwnProfile && (
          <button type="button" onClick={onAdd} className="btn-glass-pill" style={{ padding: "4px 12px", fontSize: 12, borderRadius: 10 }}>
            <Plus className="w-3 h-3 inline mr-0.5" /> Add
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-[13px] mt-2" style={{ color: "var(--color-text-muted)" }}>No achievements added</p>
      ) : (
        <div className="mt-2 space-y-0">
          {visibleItems.map((a: any, idx: number) => {
            const dateStr = a.achievement_date ? new Date(a.achievement_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "";
            return (
              <div key={a.id} className="flex gap-3 py-2.5 group"
                style={{ borderBottom: idx < visibleItems.length - 1 ? "1px solid var(--glass-border-subtle)" : "none" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[18px]"
                  style={{ background: "rgba(255,184,0,0.10)" }}>
                  {a.icon_emoji || "🏆"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold leading-tight" style={{ color: "var(--color-text)" }}>{a.title}</p>
                  {a.issued_by && <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>{a.issued_by} · {a.type || "Award"}</p>}
                  {dateStr && <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>{dateStr}</p>}
                </div>
                <div className="flex items-start gap-1 shrink-0">
                  {a.certificate_url && (
                    <a href={a.certificate_url} target="_blank" rel="noopener noreferrer" title="View certificate" className="p-1">
                      <ExternalLink className="w-3.5 h-3.5" style={{ color: "var(--color-accent)" }} />
                    </a>
                  )}
                  {isOwnProfile && (
                    <div className="flex flex-col gap-0.5 items-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => onToggleVisibility(a.id, "achievements", a.visibility || "public")} className="p-1 cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
                        {a.visibility === "public" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button type="button" onClick={() => onDelete(a.id, "achievements")} className="p-1 cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {items.length > MAX_COLLAPSED && (
            <button type="button" onClick={() => setExpanded(!expanded)}
              className="text-[12px] font-semibold mt-1 flex items-center gap-1" style={{ color: "var(--color-accent)" }}>
              {expanded ? <>Show less <ChevronUp className="w-3 h-3" /></> : <>See all {items.length} achievements <ChevronDown className="w-3 h-3" /></>}
            </button>
          )}
        </div>
      )}
    </GlassBox>
  );
};

/* ═══════════════════════════════════════════════════════════
   SKILLS SECTION
   ═══════════════════════════════════════════════════════════ */
export const SkillsSection = ({ skills, isOwnProfile, onAdd, onRemoveSkill }: {
  skills: string[]; isOwnProfile: boolean; onAdd: () => void; onRemoveSkill: (skill: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const MAX_COLLAPSED = 8;
  const visible = expanded ? skills : skills.slice(0, MAX_COLLAPSED);

  return (
    <GlassBox accent="skills">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5" style={{ color: "#8B5CF6" }} />
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>Skills</h2>
          {skills.length > 0 && <span className="text-[12px] font-medium" style={{ color: "var(--color-text-muted)" }}>{skills.length}</span>}
        </div>
        {isOwnProfile && (
          <button type="button" onClick={onAdd} className="btn-glass-pill" style={{ padding: "4px 12px", fontSize: 12, borderRadius: 10 }}>
            <Plus className="w-3 h-3 inline mr-0.5" /> Add
          </button>
        )}
      </div>

      {skills.length === 0 ? (
        <p className="text-[13px] mt-2" style={{ color: "var(--color-text-muted)" }}>No skills added</p>
      ) : (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {visible.map((s: string) => (
            <span key={s} className="flex items-center gap-1 text-[12px] font-medium px-3 py-1 rounded-xl"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "var(--color-text-secondary)" }}>
              {s}
              {isOwnProfile && (
                <button type="button" onClick={() => onRemoveSkill(s)} className="cursor-pointer ml-0.5 opacity-50 hover:opacity-100">
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
          {!expanded && skills.length > MAX_COLLAPSED && (
            <button type="button" onClick={() => setExpanded(true)}
              className="text-[12px] font-medium px-3 py-1 rounded-xl"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "var(--color-accent)" }}>
              +{skills.length - MAX_COLLAPSED} more
            </button>
          )}
          {expanded && skills.length > MAX_COLLAPSED && (
            <button type="button" onClick={() => setExpanded(false)}
              className="text-[12px] font-medium px-3 py-1 rounded-xl"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "var(--color-accent)" }}>
              Show less
            </button>
          )}
        </div>
      )}
    </GlassBox>
  );
};

/* ═══════════════════════════════════════════════════════════
   POSTS SECTION
   ═══════════════════════════════════════════════════════════ */
export const PostsSection = ({ posts, stats }: { posts: any[]; stats: { posts: number } }) => {
  return (
    <GlassBox accent="posts">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" style={{ color: "#E8733A" }} />
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>Posts</h2>
          {stats.posts > 0 && <span className="text-[12px] font-medium" style={{ color: "var(--color-text-muted)" }}>{stats.posts}</span>}
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="text-[13px] mt-2" style={{ color: "var(--color-text-muted)" }}>No posts yet</p>
      ) : (
        <div className="mt-2 space-y-0">
          {posts.slice(0, 2).map((p: any, idx: number) => (
            <Link key={p.id} to={`/post/${p.id}`} className="block py-2.5 group"
              style={{ borderBottom: idx < Math.min(posts.length, 2) - 1 ? "1px solid var(--glass-border-subtle)" : "none" }}>
              <p className="text-[13px] line-clamp-2 leading-relaxed group-hover:underline" style={{ color: "var(--color-text)" }}>{p.content}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                  {p.comment_count || 0} comments
                </span>
                <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>·</span>
                <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                  {p.created_at ? getTimeAgo(new Date(p.created_at)) : ""}
                </span>
              </div>
            </Link>
          ))}
          {posts.length > 2 && (
            <Link to="/app/feed" className="text-[12px] font-semibold mt-1 block" style={{ color: "var(--color-accent)" }}>
              See all posts →
            </Link>
          )}
        </div>
      )}
    </GlassBox>
  );
};
