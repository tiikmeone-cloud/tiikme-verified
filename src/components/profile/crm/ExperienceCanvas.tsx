import { Plus, Trash2, Eye, EyeOff, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { getJobMatch } from "@/hooks/useProfile";

export type ExperienceSection = "experience" | "education" | "portfolio";

interface ExperienceCanvasProps {
  section: ExperienceSection;
  experiences: any[];
  education: any[];
  projects: any[];
  isOwner: boolean;
  profileId: string;
  onAdd?: (type: "experience" | "education" | "project") => void;
  onDelete?: (id: string, table: "work_items" | "achievements") => void;
  onToggleVisibility?: (id: string, table: "work_items" | "achievements", vis: string) => void;
}

/* Attestation badge based on verification_status */
function AttestationBadge({ status }: { status: string }) {
  if (status === "verified") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
        background: "rgba(52,199,89,0.10)", color: "#34C759",
        border: "1px solid rgba(52,199,89,0.25)",
      }}>
        ● Attested
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
        background: "rgba(255,184,0,0.10)", color: "#FFB800",
        border: "1px solid rgba(255,184,0,0.25)",
      }}>
        ◐ Pending
      </span>
    );
  }
  return null;
}

/* Stage pill for the left column */
type Stage = "NOW" | "PAST" | "START";
function StagePill({ stage }: { stage: Stage }) {
  const configs: Record<Stage, { bg: string; color: string }> = {
    NOW:   { bg: "linear-gradient(180deg, #34C759 0%, #00A846 100%)", color: "#fff" },
    PAST:  { bg: "linear-gradient(180deg, #6E6E76 0%, #4A4A50 100%)", color: "#fff" },
    START: { bg: "linear-gradient(180deg, #2B2A6B 0%, #16152B 100%)", color: "rgba(255,255,255,0.7)" },
  };
  const { bg, color } = configs[stage];
  return (
    <div style={{
      width: 44,
      padding: "20px 0",
      borderRadius: 10,
      background: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}>
      <span style={{
        fontSize: 9, fontWeight: 800, color, letterSpacing: "0.12em",
        writingMode: "vertical-lr", textOrientation: "upright",
        transform: "rotate(180deg)",
      }}>
        {stage}
      </span>
    </div>
  );
}

/* Duration string */
function getDuration(item: any): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (item.start_month && item.start_year) {
    const start = `${item.start_month} ${item.start_year}`;
    const end = item.is_current ? "Present"
      : (item.end_month && item.end_year ? `${item.end_month} ${item.end_year}` : "");
    return end ? `${start} – ${end}` : start;
  }
  if (item.start_year) {
    return item.is_current ? `${item.start_year} – Present` : `${item.start_year}${item.end_year ? ` – ${item.end_year}` : ""}`;
  }
  if (item.start_date) {
    const s = new Date(item.start_date);
    const e = item.end_date ? new Date(item.end_date) : new Date();
    const mo = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    return `${months[s.getMonth()]} ${s.getFullYear()} – ${item.is_current ? "Present" : months[e.getMonth()] + " " + e.getFullYear()} · ${mo}mo`;
  }
  return "";
}

/* Experience entry card */
function ExperienceCard({
  item, isOwner, profileId, index, total,
  onDelete, onToggleVisibility,
}: {
  item: any;
  isOwner: boolean;
  profileId: string;
  index: number;
  total: number;
  onDelete?: (id: string, table: "work_items" | "achievements") => void;
  onToggleVisibility?: (id: string, table: "work_items" | "achievements", vis: string) => void;
}) {
  // TODO: RAG-match — use real jobId when pipeline is wired
  const match = getJobMatch(profileId, item.id ?? "latest");
  const isHidden = item.visibility === "private";

  const stage: Stage = index === 0 && item.is_current ? "NOW"
    : index === total - 1 ? "START"
    : "PAST";

  const company = item.company_name || item.institution_name || "";
  const role = item.job_title || item.title || "Role";
  const dur = getDuration(item);
  const loc = item.work_location || item.location_city || "";

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
      {/* Stage pill */}
      <StagePill stage={stage} />

      {/* Card */}
      <div
        style={{
          flex: 1, minWidth: 0,
          background: "#FFFFFF",
          borderRadius: 16,
          border: "1px solid #EAE8E2",
          padding: "14px 16px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          opacity: isHidden ? 0.6 : 1,
          position: "relative",
        }}
      >
        {/* Card header: role + match badge + owner actions */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#16161A", lineHeight: 1.3 }}>{role}</p>
            <p style={{ fontSize: 12, color: "#FF5A1F", fontWeight: 500, marginTop: 1 }}>{company}</p>
          </div>
          {/* Match trend badge */}
          <span style={{
            flexShrink: 0,
            fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
            background: match.score >= 75 ? "rgba(52,199,89,0.10)"
              : match.score >= 50 ? "rgba(255,184,0,0.10)"
              : "rgba(255,90,31,0.10)",
            color: match.score >= 75 ? "#34C759"
              : match.score >= 50 ? "#FFB800"
              : "#FF5A1F",
          }}>
            {match.score}% match
          </span>
          {isOwner && (
            <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => onToggleVisibility?.(item.id, "work_items", isHidden ? "public" : "private")}
                style={{ width: 26, height: 26, borderRadius: 7, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#A0A0A8" }}
              >
                {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(item.id, "work_items")}
                style={{ width: 26, height: 26, borderRadius: 7, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Meta: org · city · dates */}
        <p style={{ fontSize: 11, color: "#A0A0A8", lineHeight: 1.5 }}>
          {[company, loc, dur].filter(Boolean).join(" · ")}
        </p>

        {/* Skills chips */}
        {Array.isArray(item.skills_used) && item.skills_used.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
            {item.skills_used.slice(0, 4).map((s: string, i: number) => (
              <span key={i} style={{
                fontSize: 10, padding: "2px 7px", borderRadius: 999,
                background: "rgba(255,90,31,0.07)", color: "#FF5A1F", fontWeight: 500,
              }}>
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Timeline bar */}
        <div style={{ marginTop: 10 }}>
          <div style={{ height: 3, borderRadius: 2, background: "#F0EFE9", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: item.is_current ? "100%" : "70%",
              background: item.is_current
                ? "linear-gradient(90deg, #34C759, #00A846)"
                : "#A0A0A8",
              borderRadius: 2,
            }} />
          </div>
        </div>

        {/* Squad avatar stack + attestation badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          {/* Squad avatars — placeholder for now */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: `hsl(${i * 40 + 200}, 55%, 65%)`,
                  border: "2px solid #fff",
                  marginLeft: i === 0 ? 0 : -6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 700, color: "#fff",
                }}>
                  {["A","B","C"][i]}
                </div>
              ))}
            </div>
            {item.verification_status === "verified" && (
              <span style={{ fontSize: 10, color: "#6E6E76" }}>3 peers</span>
            )}
          </div>
          <AttestationBadge status={item.verification_status || "unverified"} />
        </div>

        {item.description && (
          <p style={{ fontSize: 12, color: "#6E6E76", marginTop: 8, lineHeight: 1.6 }}>
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}

/* Education card */
function EducationCard({ item, isOwner, onDelete }: {
  item: any;
  isOwner: boolean;
  onDelete?: (id: string, table: "work_items" | "achievements") => void;
}) {
  const school = item.institution_name_edu || item.institution_name || "Institution";
  const degree = [item.degree_type, item.field_of_study || item.title].filter(Boolean).join(", ");
  const years = [item.start_year, item.end_year || (item.is_current ? "Present" : "")].filter(Boolean).join(" – ");
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
      <StagePill stage="PAST" />
      <div style={{
        flex: 1, background: "#FFFFFF", borderRadius: 16,
        border: "1px solid #EAE8E2", padding: "14px 16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#16161A" }}>{school}</p>
            {degree && <p style={{ fontSize: 12, color: "#4A90D9", marginTop: 1 }}>{degree}</p>}
            {years && <p style={{ fontSize: 11, color: "#A0A0A8", marginTop: 2 }}>{years}</p>}
            {item.grade_score && <p style={{ fontSize: 11, color: "#A0A0A8" }}>Grade: {item.grade_score}</p>}
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={() => onDelete?.(item.id, "work_items")}
              style={{ width: 26, height: 26, borderRadius: 7, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444", flexShrink: 0 }}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* Project/Portfolio card */
function ProjectCard({ item, isOwner, onDelete }: {
  item: any;
  isOwner: boolean;
  onDelete?: (id: string, table: "work_items" | "achievements") => void;
}) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
      <StagePill stage="PAST" />
      <div style={{
        flex: 1, background: "#FFFFFF", borderRadius: 16,
        border: "1px solid #EAE8E2", padding: "14px 16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#16161A" }}>{item.title || "Project"}</p>
            {item.company_name && <p style={{ fontSize: 12, color: "#6E6E76", marginTop: 1 }}>{item.company_name}</p>}
            {item.description && <p style={{ fontSize: 12, color: "#6E6E76", marginTop: 6, lineHeight: 1.6 }}>{item.description}</p>}
            {Array.isArray(item.tech_stack) && item.tech_stack.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                {item.tech_stack.slice(0, 5).map((t: string, i: number) => (
                  <span key={i} style={{
                    fontSize: 10, padding: "2px 7px", borderRadius: 999,
                    background: "rgba(139,92,246,0.08)", color: "#8B5CF6", fontWeight: 500,
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={() => onDelete?.(item.id, "work_items")}
              style={{ width: 26, height: 26, borderRadius: 7, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444", flexShrink: 0 }}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
        {Array.isArray(item.links) && item.links.length > 0 && (
          <a href={item.links[0].url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: "#4A90D9", marginTop: 8, display: "block" }}>
            View project ↗
          </a>
        )}
      </div>
    </div>
  );
}

/* Sub-nav bar: Experience · Education · Portfolio */
export function SubNav({
  section, onSectionChange, followerCount, followingCount, isOwner, onAddNew,
}: {
  section: ExperienceSection;
  onSectionChange: (s: ExperienceSection) => void;
  followerCount: number;
  followingCount: number;
  isOwner: boolean;
  onAddNew?: () => void;
}) {
  const tabs: { id: ExperienceSection; label: string }[] = [
    { id: "experience", label: "Experience" },
    { id: "education",  label: "Education" },
    { id: "portfolio",  label: "Portfolio" },
  ];

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 20px",
      borderBottom: "1px solid #EAE8E2",
      background: "#FFFFFF",
    }}>
      <div style={{ display: "flex", gap: 0 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSectionChange(t.id)}
            style={{
              padding: "6px 14px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: section === t.id ? 600 : 400,
              color: section === t.id ? "#16161A" : "#6E6E76",
              borderBottom: section === t.id ? "2px solid #FF5A1F" : "2px solid transparent",
              marginBottom: -1,
              transition: "border-color 120ms, color 120ms",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, color: "#A0A0A8", fontWeight: 500 }}>Public</span>
        <Link to="/app/connections" style={{ fontSize: 12, color: "#6E6E76", textDecoration: "none", fontWeight: 500 }}>
          {(followerCount || 0).toLocaleString()} Followers
        </Link>
        <span style={{ fontSize: 12, color: "#6E6E76", fontWeight: 500 }}>
          {(followingCount || 0).toLocaleString()} Following
        </span>
        {isOwner && (
          <button
            type="button"
            onClick={onAddNew}
            style={{
              height: 30, padding: "0 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: "#FF5A1F", color: "#fff", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              boxShadow: "0 2px 8px rgba(255,90,31,0.25)",
            }}
          >
            <Plus size={12} />
            Add New
          </button>
        )}
      </div>
    </div>
  );
}

/* Main canvas */
export default function ExperienceCanvas({
  section, experiences, education, projects, isOwner, profileId,
  onAdd, onDelete, onToggleVisibility,
}: ExperienceCanvasProps) {
  const items = section === "education" ? education
    : section === "portfolio" ? projects
    : experiences;

  const sectionType = section === "experience" ? "experience"
    : section === "education" ? "education"
    : "project";

  return (
    <div
      style={{
        padding: "20px 20px 40px",
        /* Dotted grid background */
        backgroundImage: "radial-gradient(circle, rgba(160,160,168,0.30) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
        minHeight: 400,
      }}
    >
      {items.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minHeight: 200, gap: 12,
        }}>
          <p style={{ fontSize: 14, color: "#A0A0A8", fontStyle: "italic" }}>
            No {section} added yet.
          </p>
          {isOwner && (
            <button
              type="button"
              onClick={() => onAdd?.(sectionType as any)}
              style={{
                height: 36, padding: "0 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: "#FF5A1F", color: "#fff", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Plus size={14} />
              Add {section}
            </button>
          )}
        </div>
      ) : (
        <>
          {section === "experience" && items.map((item, i) => (
            <ExperienceCard
              key={item.id}
              item={item}
              index={i}
              total={items.length}
              isOwner={isOwner}
              profileId={profileId}
              onDelete={onDelete}
              onToggleVisibility={onToggleVisibility}
            />
          ))}
          {section === "education" && items.map(item => (
            <EducationCard
              key={item.id}
              item={item}
              isOwner={isOwner}
              onDelete={onDelete}
            />
          ))}
          {section === "portfolio" && items.map(item => (
            <ProjectCard
              key={item.id}
              item={item}
              isOwner={isOwner}
              onDelete={onDelete}
            />
          ))}
        </>
      )}
    </div>
  );
}
