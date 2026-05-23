import { useState, useEffect } from "react";
import { fixStorageUrl } from "@/components/ui/AvatarSquare";
import {
  Briefcase, GraduationCap, Rocket, Award, Code2, MessageCircle,
  MapPin, CheckCircle, Clock, Eye, EyeOff, Trash2, Plus, ExternalLink,
  Star, X, Heart, Repeat2,
} from "lucide-react";
import { Link } from "react-router-dom";
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
    if (item.start_date) return formatDuration(item.start_date, item.end_date, item.is_current);
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

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n || 0);
}

const getLikeCount = (post: any) => {
  if (Array.isArray(post.post_reactions) && post.post_reactions.length > 0) return post.post_reactions[0]?.count || 0;
  const r = post.reactions;
  if (!r || typeof r !== "object") return 0;
  return (r.useful || 0) + (r.inspiring || 0) + (r.insightful || 0) + (r.like || 0);
};

const getCommentCount = (post: any) => {
  if (Array.isArray(post.post_comments) && post.post_comments.length > 0) return post.post_comments[0]?.count || 0;
  return post.comment_count || 0;
};

export const PostPreviewCard = ({ post }: { post: any }) => {
  const image = post.image_urls?.[0] ? fixStorageUrl(post.image_urls[0]) : null;
  const mediaCount = post.image_urls?.length || 0;

  return (
    <Link to={`/app/post/${post.id}`} className="group relative h-[220px] w-[220px] shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-muted">
      {image ? (
        <img src={image} alt={post.content ? post.content.slice(0, 80) : "Post media"} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
      ) : (
        <div className="flex h-full w-full items-center bg-accent p-4">
          <p className="line-clamp-6 text-sm text-foreground">{post.content}</p>
        </div>
      )}
      {mediaCount > 1 && (
        <div className="absolute right-2 top-2 rounded-full bg-foreground/60 px-2 py-0.5 text-[10px] text-background backdrop-blur">
          1/<span className="num">{mediaCount}</span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent p-2 text-xs text-background">
        <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /><span className="num">{formatCount(getLikeCount(post))}</span></span>
        <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /><span className="num">{formatCount(getCommentCount(post))}</span></span>
        <span className="ml-auto flex items-center gap-1"><Repeat2 className="h-3.5 w-3.5" /><span className="num">{formatCount(post.repost_count || 0)}</span></span>
      </div>
    </Link>
  );
};

/* ── Verification Badge (inline) ── */
const VerifBadge = ({ item, isOwn, onStatusChange }: { item: any; isOwn: boolean; onStatusChange?: (id: string, status: string) => void }) => {
  const status = item.verification_status || "unverified";
  if (status === "verified") return (
    <div className="flex items-center justify-center shrink-0" style={{ width: 20, height: 20, borderRadius: 10, background: "#FFB800", boxShadow: "0 0 8px rgba(255,184,0,0.40)" }}>
      <CheckCircle className="w-3 h-3 text-white" />
    </div>
  );
  if (status === "pending") return (
    <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "#FFB800" }} />
  );
  if (status === "rejected" || status === "declined") return (
    <span className="text-[11px] font-medium shrink-0" style={{ color: "#EF4444" }}>Declined</span>
  );
  if (isOwn) return (
    <div className="relative shrink-0">
      <VerificationRequest item={item} itemType={item.item_type || "experience"} onStatusChange={onStatusChange!} />
    </div>
  );
  return null;
};

/* ── Company Logo Square ── */
const CompanyLogo = ({ name, logoUrl, color, size = 40 }: { name: string; logoUrl?: string | null; color?: string; size?: number }) => {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const bg = color || hashColor(name || "X");
  return (
    <div className="flex items-center justify-center shrink-0 overflow-hidden"
      style={{ width: size, height: size, borderRadius: 0, backgroundColor: logoUrl ? "transparent" : bg, border: "2px solid rgba(255,255,255,0.30)" }}>
      {logoUrl ? (
        <img src={fixStorageUrl(logoUrl) || ""} alt="" loading="lazy" className="w-full h-full object-cover" style={{ borderRadius: 0 }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; e.currentTarget.parentElement!.style.backgroundColor = bg; }} />
      ) : <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{initials}</span>}
    </div>
  );
};

/* ── Section Box wrapper ── */
const SectionBox = ({ title, icon: Icon, iconColor, count, isOwnProfile, onAdd, children, borderColor }: {
  title: string; icon: any; iconColor: string; count?: number; isOwnProfile: boolean; onAdd?: () => void; children: React.ReactNode; borderColor: string;
}) => (
  <div className="glass-card" style={{
    padding: 12, borderRadius: 16,
    borderLeft: `2px solid ${borderColor}66`,
    boxShadow: `0 8px 32px rgba(26,26,78,0.08), inset 0 1px 0 rgba(255,255,255,0.60), -3px 0 14px ${borderColor}26`,
    transition: "all 200ms ease",
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 12px 40px rgba(26,26,78,0.12), inset 0 1px 0 rgba(255,255,255,0.60), -3px 0 20px ${borderColor}3d`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 8px 32px rgba(26,26,78,0.08), inset 0 1px 0 rgba(255,255,255,0.60), -3px 0 14px ${borderColor}26`; }}
  >
    {/* HEADER ROW — exact 28px height */}
    <div className="flex items-center" style={{ height: 28, gap: 8 }}>
      <Icon style={{ width: 18, height: 18, color: iconColor, flexShrink: 0 }} />
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>{title}</span>
      {count !== undefined && count > 0 && (
        <span className="num" style={{ fontSize: 11, color: "var(--text-muted)", background: "rgba(255,255,255,0.25)", padding: "0 6px", borderRadius: 4, height: 18, display: "inline-flex", alignItems: "center" }}>{count}</span>
      )}
      {isOwnProfile && onAdd && (
        <button type="button" onClick={onAdd} className="cursor-pointer" style={{
          height: 26, padding: "0 10px", fontSize: 11, fontWeight: 500, borderRadius: 6,
          background: "var(--bg-card)", border: "1px solid var(--border-glass)",
          color: "var(--text-primary)", display: "inline-flex", alignItems: "center", gap: 4,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.50)",
        }}>
          <Plus style={{ width: 12, height: 12 }} /> Add
        </button>
      )}
    </div>
    {/* Content starts at margin-top: 8px */}
    <div style={{ marginTop: 8 }}>{children}</div>
  </div>
);

/* ── Item Row ── */
const ItemRow = ({ logo, line1, line2, line3, line4, right, isLast, extra }: {
  logo: React.ReactNode; line1: React.ReactNode; line2?: string; line3?: string; line4?: string;
  right?: React.ReactNode; isLast: boolean; extra?: React.ReactNode;
}) => (
  <div className="flex" style={{ alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: isLast ? "none" : "1px solid var(--border-subtle)" }}>
    {logo}
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 600, lineHeight: "18px", color: "var(--text-primary)", overflowWrap: "anywhere", wordBreak: "break-word" }}>{line1}</div>
      {line2 && <p style={{ fontSize: 13, fontWeight: 400, lineHeight: "17px", color: "var(--text-secondary)", overflowWrap: "anywhere", wordBreak: "break-word" }}>{line2}</p>}
      {line3 && <p style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>{line3}</p>}
      {line4 && <p style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>{line4}</p>}
      {extra}
    </div>
    {right && <div className="shrink-0">{right}</div>}
  </div>
);

/* ── Section Props ── */
interface SectionProps {
  items: any[];
  isOwnProfile: boolean;
  onAdd: () => void;
  onDelete: (id: string, table: "work_items" | "achievements") => void;
  onToggleVisibility: (id: string, table: "work_items" | "achievements", vis: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

/* ═══ EXPERIENCE ═══ */
export const ExperienceSection = ({ items, isOwnProfile, onAdd, onDelete, onToggleVisibility, onStatusChange }: SectionProps) => {
  const { lookupBatch, getLogo } = useCompanyLogos();
  const MAX = 3;
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    const names = items.map(e => e.company_name || e.institution_name || "").filter(Boolean);
    if (names.length > 0) lookupBatch(names);
  }, [items, lookupBatch]);
  const visible = showAll ? items : items.slice(0, MAX);
  if (items.length === 0 && !isOwnProfile) return null;

  return (
    <SectionBox title="Experience" icon={Briefcase} iconColor="#4A90D9" borderColor="#4A90D9" count={items.length} isOwnProfile={isOwnProfile} onAdd={onAdd}>
      {items.length === 0 ? (
        isOwnProfile ? (
          <button type="button" onClick={onAdd}
            className="flex items-center gap-2 cursor-pointer w-full text-left"
            style={{ background: "rgba(74,144,217,0.05)", border: "1px dashed rgba(74,144,217,0.30)", borderRadius: 10, padding: "10px 12px", marginTop: 4 }}>
            <Plus style={{ width: 14, height: 14, color: "#4A90D9", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#4A90D9", fontWeight: 500 }}>Add your first experience</span>
          </button>
        ) : (
          <p style={{ fontSize: 13, color: "var(--text-muted)", padding: "4px 0" }}>No experience added</p>
        )
      ) : (
        <>
          {visible.map((exp: any, idx: number) => {
            const companyName = exp.company_name || exp.institution_name || "";
            const logo = getLogo(companyName);
            return (
              <ItemRow key={exp.id} isLast={idx === visible.length - 1}
                logo={<CompanyLogo name={companyName} logoUrl={logo?.logo_url} />}
                line1={
                  <span className="inline-flex items-center gap-1.5 flex-wrap">
                    <span>{exp.job_title || exp.title}</span>
                    {exp.verification_status === "verified" && (
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "#16A34A" }} />
                    )}
                  </span>
                }
                line2={[companyName, exp.employment_type].filter(Boolean).join(" · ")}
                line3={getDuration(exp)}
                line4={exp.work_location || undefined}
                right={
                  <div className="flex items-center gap-1">
                    <VerifBadge item={exp} isOwn={isOwnProfile} onStatusChange={onStatusChange} />
                    {isOwnProfile && (
                      <div className="flex flex-col gap-0.5 opacity-0 hover:opacity-100" style={{ transition: "opacity 150ms" }}>
                        <button type="button" onClick={() => onToggleVisibility(exp.id, "work_items", exp.visibility || "public")} className="p-0.5 cursor-pointer" style={{ color: "var(--text-muted)" }}>
                          {exp.visibility === "public" ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </button>
                        <button type="button" onClick={() => onDelete(exp.id, "work_items")} className="p-0.5 cursor-pointer" style={{ color: "var(--text-muted)" }}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                }
              />
            );
          })}
          {items.length > MAX && (
            <button type="button" onClick={() => setShowAll(v => !v)} className="cursor-pointer" style={{ fontSize: 12, fontWeight: 400, color: "#E8733A", marginTop: 4, background: "none", border: "none", padding: 0 }}>
              {showAll ? "Show less ↑" : `See all ${items.length} →`}
            </button>
          )}
        </>
      )}
    </SectionBox>
  );
};

/* ═══ EDUCATION ═══ */
export const EducationSection = ({ items, isOwnProfile, onAdd, onDelete, onToggleVisibility, onStatusChange }: SectionProps) => {
  const { lookupBatch, getLogo } = useCompanyLogos();
  const MAX = 3;
  useEffect(() => {
    const names = items.map(e => e.institution_name_edu || e.institution_name || "").filter(Boolean);
    if (names.length > 0) lookupBatch(names);
  }, [items, lookupBatch]);
  const visible = items.slice(0, MAX);

  return (
    <SectionBox title="Education" icon={GraduationCap} iconColor="#34C759" borderColor="#34C759" count={items.length} isOwnProfile={isOwnProfile} onAdd={onAdd}>
      {items.length === 0 ? (
        isOwnProfile ? (
          <button type="button" onClick={onAdd}
            className="flex items-center gap-2 cursor-pointer w-full text-left"
            style={{ background: "rgba(52,199,89,0.05)", border: "1px dashed rgba(52,199,89,0.30)", borderRadius: 10, padding: "10px 12px", marginTop: 4 }}>
            <Plus style={{ width: 14, height: 14, color: "#34C759", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#34C759", fontWeight: 500 }}>Add your education</span>
          </button>
        ) : (
          <p style={{ fontSize: 13, color: "var(--text-muted)", padding: "4px 0" }}>No education added</p>
        )
      ) : (
        <>
          {visible.map((edu: any, idx: number) => {
            const instName = edu.institution_name_edu || edu.institution_name || "";
            const logo = getLogo(instName);
            const degree = [edu.degree_type || edu.title, edu.field_of_study].filter(Boolean).join(" in ");
            const years = [edu.start_year, edu.is_current ? "Present" : edu.end_year].filter(Boolean).join(" – ");
            return (
              <ItemRow key={edu.id} isLast={idx === visible.length - 1}
                logo={<CompanyLogo name={instName} logoUrl={logo?.logo_url} color="#34C759" />}
                line1={degree || "Degree"}
                line2={instName}
                line3={years || undefined}
                line4={edu.grade_score ? `Grade: ${edu.grade_score}` : undefined}
                right={
                  <div className="flex items-center gap-1">
                    <VerifBadge item={{ ...edu, item_type: "education" }} isOwn={isOwnProfile} onStatusChange={onStatusChange} />
                    {isOwnProfile && (
                      <div className="flex flex-col gap-0.5 opacity-0 hover:opacity-100" style={{ transition: "opacity 150ms" }}>
                        <button type="button" onClick={() => onToggleVisibility(edu.id, "work_items", edu.visibility || "public")} className="p-0.5 cursor-pointer" style={{ color: "var(--text-muted)" }}>
                          {edu.visibility === "public" ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </button>
                        <button type="button" onClick={() => onDelete(edu.id, "work_items")} className="p-0.5 cursor-pointer" style={{ color: "var(--text-muted)" }}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                }
              />
            );
          })}
          {items.length > MAX && (
            <button type="button" className="cursor-pointer" style={{ fontSize: 12, color: "#E8733A", marginTop: 4, background: "none", border: "none", padding: 0 }}>See all {items.length} →</button>
          )}
        </>
      )}
    </SectionBox>
  );
};

/* ═══ PROJECTS ═══ */
export const ProjectsSection = ({ items, isOwnProfile, onAdd, onDelete, onToggleVisibility, onStatusChange }: SectionProps) => {
  const MAX = 3;
  const visible = items.slice(0, MAX);

  return (
    <SectionBox title="Projects" icon={Rocket} iconColor="#FF6B9D" borderColor="#FF6B9D" count={items.length} isOwnProfile={isOwnProfile} onAdd={onAdd}>
      {items.length === 0 ? (
        isOwnProfile ? (
          <button type="button" onClick={onAdd}
            className="flex items-center gap-2 cursor-pointer w-full text-left"
            style={{ background: "rgba(255,107,157,0.05)", border: "1px dashed rgba(255,107,157,0.30)", borderRadius: 10, padding: "10px 12px", marginTop: 4 }}>
            <Plus style={{ width: 14, height: 14, color: "#FF6B9D", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#FF6B9D", fontWeight: 500 }}>Add your first project</span>
          </button>
        ) : (
          <p style={{ fontSize: 13, color: "var(--text-muted)", padding: "4px 0" }}>No projects added</p>
        )
      ) : (
        <>
          {visible.map((p: any, idx: number) => {
            const techStack: string[] = p.tech_stack || [];
            const years = [p.start_year, p.is_current ? "Present" : p.end_year].filter(Boolean).join(" – ");
            return (
              <ItemRow key={p.id} isLast={idx === visible.length - 1}
                logo={
                  <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, background: "rgba(255,107,157,0.10)", borderRadius: 0, border: "2px solid rgba(255,255,255,0.30)" }}>
                    <Rocket style={{ width: 16, height: 16, color: "#FF6B9D" }} />
                  </div>
                }
                line1={p.title}
                line2={[p.project_type, p.domain || p.company_name].filter(Boolean).join(" · ") || undefined}
                line3={years || undefined}
                extra={techStack.length > 0 ? (
                  <div className="flex flex-wrap gap-1" style={{ marginTop: 4 }}>
                    {techStack.slice(0, 3).map((s: string) => (
                      <span key={s} style={{ fontSize: 12, fontWeight: 400, padding: "0 8px", height: 24, display: "inline-flex", alignItems: "center", borderRadius: 6, background: "rgba(139,92,246,0.08)", color: "#8B5CF6" }}>{s}</span>
                    ))}
                    {techStack.length > 3 && <span style={{ fontSize: 12, padding: "0 8px", height: 24, display: "inline-flex", alignItems: "center", borderRadius: 6, background: "var(--bg-card)", color: "var(--text-muted)" }}>+{techStack.length - 3}</span>}
                  </div>
                ) : undefined}
                right={
                  <div className="flex items-center gap-1">
                    <VerifBadge item={{ ...p, item_type: "project" }} isOwn={isOwnProfile} onStatusChange={onStatusChange} />
                    {isOwnProfile && (
                      <div className="flex flex-col gap-0.5 opacity-0 hover:opacity-100" style={{ transition: "opacity 150ms" }}>
                        <button type="button" onClick={() => onToggleVisibility(p.id, "work_items", p.visibility || "public")} className="p-0.5 cursor-pointer" style={{ color: "var(--text-muted)" }}>
                          {p.visibility === "public" ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </button>
                        <button type="button" onClick={() => onDelete(p.id, "work_items")} className="p-0.5 cursor-pointer" style={{ color: "var(--text-muted)" }}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                }
              />
            );
          })}
          {items.length > MAX && (
            <button type="button" className="cursor-pointer" style={{ fontSize: 12, color: "#E8733A", marginTop: 4, background: "none", border: "none", padding: 0 }}>See all {items.length} →</button>
          )}
        </>
      )}
    </SectionBox>
  );
};

/* ═══ ACHIEVEMENTS ═══ */
export const AchievementsSection = ({ items, isOwnProfile, onAdd, onDelete, onToggleVisibility }: Omit<SectionProps, "onStatusChange">) => {
  const MAX = 3;
  const visible = items.slice(0, MAX);

  return (
    <SectionBox title="Achievements" icon={Award} iconColor="#FFB800" borderColor="#FFB800" count={items.length} isOwnProfile={isOwnProfile} onAdd={onAdd}>
      {items.length === 0 ? (
        isOwnProfile ? (
          <button type="button" onClick={onAdd}
            className="flex items-center gap-2 cursor-pointer w-full text-left"
            style={{ background: "rgba(255,184,0,0.05)", border: "1px dashed rgba(255,184,0,0.30)", borderRadius: 10, padding: "10px 12px", marginTop: 4 }}>
            <Plus style={{ width: 14, height: 14, color: "#FFB800", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#FFB800", fontWeight: 500 }}>Add your first achievement</span>
          </button>
        ) : (
          <p style={{ fontSize: 13, color: "var(--text-muted)", padding: "4px 0" }}>No achievements added</p>
        )
      ) : (
        <>
          {visible.map((a: any, idx: number) => {
            const dateStr = a.achievement_date ? new Date(a.achievement_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "";
            return (
              <ItemRow key={a.id} isLast={idx === visible.length - 1}
                logo={
                  <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, background: "rgba(255,184,0,0.10)", borderRadius: 0, border: "2px solid rgba(255,255,255,0.30)" }}>
                    <Award style={{ width: 16, height: 16, color: "#FFB800" }} />
                  </div>
                }
                line1={a.title}
                line2={[a.issued_by, a.type || "Award"].filter(Boolean).join(" · ") || undefined}
                line3={dateStr || undefined}
                right={
                  <div className="flex items-center gap-1">
                    {a.certificate_url && (
                      <a href={a.certificate_url} target="_blank" rel="noopener noreferrer" className="p-0.5" style={{ color: "#E8733A" }}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {isOwnProfile && (
                      <div className="flex flex-col gap-0.5 opacity-0 hover:opacity-100" style={{ transition: "opacity 150ms" }}>
                        <button type="button" onClick={() => onToggleVisibility(a.id, "achievements", a.visibility || "public")} className="p-0.5 cursor-pointer" style={{ color: "var(--text-muted)" }}>
                          {a.visibility === "public" ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </button>
                        <button type="button" onClick={() => onDelete(a.id, "achievements")} className="p-0.5 cursor-pointer" style={{ color: "var(--text-muted)" }}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                }
              />
            );
          })}
          {items.length > MAX && (
            <button type="button" className="cursor-pointer" style={{ fontSize: 12, color: "#E8733A", marginTop: 4, background: "none", border: "none", padding: 0 }}>See all {items.length} →</button>
          )}
        </>
      )}
    </SectionBox>
  );
};

/* ═══ SKILLS ═══ */
export const SkillsSection = ({ skills, isOwnProfile, onAdd, onRemoveSkill }: {
  skills: string[]; isOwnProfile: boolean; onAdd: () => void; onRemoveSkill: (skill: string) => void;
}) => {
  const MAX = 8;
  const visible = skills.slice(0, MAX);

  return (
    <SectionBox title="Skills" icon={Star} iconColor="#8B5CF6" borderColor="#8B5CF6" count={skills.length} isOwnProfile={isOwnProfile} onAdd={onAdd}>
      {skills.length === 0 ? (
        isOwnProfile ? (
          <button type="button" onClick={onAdd}
            className="flex items-center gap-2 cursor-pointer w-full text-left"
            style={{ background: "rgba(139,92,246,0.05)", border: "1px dashed rgba(139,92,246,0.30)", borderRadius: 10, padding: "10px 12px", marginTop: 4 }}>
            <Plus style={{ width: 14, height: 14, color: "#8B5CF6", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#8B5CF6", fontWeight: 500 }}>Add your top skills</span>
          </button>
        ) : null
      ) : (
        <div className="flex flex-wrap" style={{ gap: 6, padding: "8px 0" }}>
          {visible.map((s: string) => (
            <span key={s} className="flex items-center" style={{
              height: 24, padding: "0 8px", borderRadius: 6, fontSize: 12, fontWeight: 400,
              background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", color: "#8B5CF6",
              gap: 4,
            }}>
              {s}
              {isOwnProfile && (
                <button type="button" onClick={() => onRemoveSkill(s)} className="cursor-pointer" style={{ color: "#8B5CF6", opacity: 0.5, background: "none", border: "none", padding: 0 }}>
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
          {skills.length > MAX && (
            <span style={{ height: 24, padding: "0 8px", borderRadius: 6, fontSize: 12, fontWeight: 400, background: "var(--bg-card)", color: "var(--text-muted)", display: "inline-flex", alignItems: "center" }}>+{skills.length - MAX} more</span>
          )}
        </div>
      )}
    </SectionBox>
  );
};

/* ═══ POSTS ═══ */
export const PostsSection = ({
  posts, stats, username, isOwnProfile,
}: {
  posts: any[];
  stats: { posts: number; reposts?: number };
  username?: string;
  isOwnProfile?: boolean;
}) => {
  return (
    <SectionBox title="Posts" icon={MessageCircle} iconColor="#E8733A" borderColor="#E8733A" count={stats.posts} isOwnProfile={!!isOwnProfile} onAdd={isOwnProfile ? () => {} : undefined}>
      {posts.length === 0 ? (
        isOwnProfile ? (
          <Link to="/post/create" className="flex items-center gap-2 w-full text-left"
            style={{ background: "rgba(232,115,58,0.05)", border: "1px dashed rgba(232,115,58,0.30)", borderRadius: 10, padding: "10px 12px" }}>
            <Plus style={{ width: 14, height: 14, color: "#E8733A", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#E8733A", fontWeight: 500 }}>Share your first post</span>
          </Link>
        ) : (
          <p style={{ fontSize: 13, color: "var(--text-muted)", padding: "4px 0" }}>No posts yet</p>
        )
      ) : (
        <>
          {/* Instagram-style 3-column grid — each cell navigates to posts page */}
          <div className="grid grid-cols-3 gap-1">
            {posts.slice(0, 9).map((p: any) => {
              const img = p.image_urls?.[0];
              return (
                <Link
                  key={p.id}
                  to={username ? `/app/u/${username}/posts` : "/app/feed"}
                  className="relative aspect-square overflow-hidden rounded-lg bg-black/5 hover:opacity-90 transition-opacity block"
                >
                  {img ? (
                    <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2"
                      style={{ background: "rgba(232,115,58,0.06)" }}>
                      <p className="text-[10px] text-center line-clamp-4 text-muted-foreground leading-tight">
                        {p.content?.slice(0, 60)}
                      </p>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
          {username && (
            <Link to={`/app/u/${username}/posts`}
              className="flex items-center justify-center mt-2 text-xs font-medium hover:underline"
              style={{ color: "#E8733A" }}>
              See all posts
            </Link>
          )}
        </>
      )}
    </SectionBox>
  );
};

/* ═══ ROLES ═══ */
export const RolesSection = ({ items, isOwnProfile, onAdd, onDelete }: {
  items: any[]; isOwnProfile: boolean; onAdd: () => void; onDelete: (id: string) => void;
}) => {
  const ROLE_TYPE_COLORS: Record<string, string> = {
    "Side Hustle": "#E8733A",
    "Freelance": "#8B5CF6",
    "Dual Employment": "#4A90D9",
    "Moonlighting": "#34C759",
  };

  return (
    <SectionBox title="Moonlighting" icon={Star} iconColor="#0369A1" borderColor="#0369A1" count={items.length} isOwnProfile={isOwnProfile} onAdd={onAdd}>
      {items.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--text-muted)", padding: "4px 0" }}>No additional roles added</p>
      ) : (
        <div className="flex flex-wrap" style={{ gap: 8, padding: "8px 0" }}>
          {items.map((r: any) => {
            const color = ROLE_TYPE_COLORS[r.role_type] || "#6B7094";
            return (
              <div key={r.id} style={{
                padding: "8px 12px", borderRadius: 10,
                background: `${color}0D`, border: `1px solid ${color}26`,
                display: "flex", flexDirection: "column", gap: 2, maxWidth: "100%",
              }}>
                <div className="flex items-center" style={{ gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: `${color}1A`, color }}>{r.role_type}</span>
                  {isOwnProfile && (
                    <button type="button" onClick={() => onDelete(r.id)} className="cursor-pointer ml-auto" style={{ color: "var(--text-muted)", background: "none", border: "none", padding: 0 }}>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{r.title}</span>
                {r.description && <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-secondary)" }}>{r.description}</span>}
              </div>
            );
          })}
        </div>
      )}
    </SectionBox>
  );
};
