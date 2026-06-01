/**
 * Clay profile sections — all GenZ-named section components.
 * Each section is a separate self-contained component.
 */
import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Trash2, Eye, EyeOff, ExternalLink, Award, Globe,
  Youtube, Instagram, Twitter, Linkedin,
} from "lucide-react";
import { ExperienceSquadSlot } from "@/components/profile/ProfileSections";
import ProfileFlicksSection from "@/components/profile/ProfileFlicksSection";

/* ── Shared section wrapper ── */
function SectionBox({
  title, accentColor = "#E8733A", onAdd, isOwner, children,
}: {
  title: string;
  accentColor?: string;
  onAdd?: () => void;
  isOwner?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="clay-card" style={{ padding: "20px 20px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.25px" }}>{title}</h2>
        {isOwner && onAdd && (
          <button type="button" onClick={onAdd} className="clay-btn" style={{ width: 30, height: 30, borderRadius: 10, color: accentColor }}>
            <Plus style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

/* ─── THE STORY (about / bio) ─── */
export function TheStory({ about, isOwner }: { about: string; isOwner: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const text = (about || "").trim();
  if (!text && !isOwner) return null;

  const isLong = text.length > 220;
  const shown = isLong && !expanded ? text.slice(0, 220) + "…" : text;

  return (
    <SectionBox title="The Story" isOwner={false}>
      {text ? (
        <>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--text-2)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {shown}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              style={{ fontSize: 12, color: "#E8733A", background: "none", border: "none", cursor: "pointer", marginTop: 6, padding: 0, fontWeight: 600 }}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </>
      ) : (
        <p style={{ fontSize: 13, color: "#9CA3C0", fontStyle: "italic" }}>
          Tell your story — add a bio in Settings.
        </p>
      )}
    </SectionBox>
  );
}

/* ─── THE GRIND (experience, threaded) ─── */
const getDuration = (item: any) => {
  const sm = item.start_month; const sy = item.start_year;
  const em = item.end_month; const ey = item.end_year;
  if (!sy) return "";
  const start = sm ? `${sm} ${sy}` : String(sy);
  if (item.is_current) return `${start} – Present`;
  if (ey) return `${start} – ${em ? `${em} ${ey}` : String(ey)}`;
  if (item.start_date) {
    const s = new Date(item.start_date);
    const e = item.end_date ? new Date(item.end_date) : new Date();
    const mo = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    const yrs = Math.floor(mo / 12); const mos = mo % 12;
    const dur = [yrs > 0 ? `${yrs}y` : "", mos > 0 ? `${mos}m` : ""].filter(Boolean).join(" ") || "< 1m";
    return `${start} – ${item.end_date ? `${em || ""} ${ey || ""}`.trim() : "Present"} · ${dur}`;
  }
  return start;
};

export function TheGrind({
  experiences, isOwner, onAdd, onDelete, onToggleVisibility,
}: {
  experiences: any[];
  isOwner: boolean;
  onAdd: () => void;
  onDelete: (id: string, table: "work_items" | "achievements") => void;
  onToggleVisibility: (id: string, table: "work_items" | "achievements", vis: string) => void;
}) {
  if (!experiences.length && !isOwner) return null;
  const threaded = experiences.length > 1;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 2px" }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>The Grind</h2>
        {isOwner && (
          <button type="button" onClick={onAdd} className="clay-btn" style={{ width: 30, height: 30, borderRadius: 10, color: "#E8733A" }}>
            <Plus style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>

      {!experiences.length ? (
        <div className="clay-card" style={{ padding: "16px 20px" }}>
          <p style={{ fontSize: 13, color: "#9CA3C0", fontStyle: "italic" }}>Add your work experience to build trust.</p>
        </div>
      ) : (
        <div className={threaded ? "thread-wrap" : undefined}>
          {threaded && <div className="thread-line" />}
          {experiences.map((exp, i) => {
            const isHidden = exp.visibility === "private";
            const title = exp.job_title || exp.title || "Role";
            const company = exp.company_name || exp.company || "";
            const skills: string[] = Array.isArray(exp.skills)
              ? exp.skills
              : exp.skills ? String(exp.skills).split(",").map((s: string) => s.trim()).filter(Boolean) : [];

            return (
              <div key={exp.id} className={threaded ? "thread-item" : undefined} style={{ marginBottom: i < experiences.length - 1 ? 8 : 0 }}>
                {/* Thread dot */}
                {threaded && (
                  <div style={{
                    position: "absolute", left: 17, top: 18,
                    width: 14, height: 14, borderRadius: "50%",
                    background: exp.is_current ? "#E8733A" : "#D1D5DB",
                    border: "2px solid var(--bg-card)", zIndex: 2,
                  }} />
                )}

                <div
                  className="clay-card"
                  style={{ marginLeft: threaded ? 44 : 0, padding: "14px 16px", opacity: isHidden ? 0.65 : 1 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{title}</p>
                      {company && <p style={{ fontSize: 13, color: "#E8733A", fontWeight: 500, marginTop: 1 }}>{company}</p>}
                      {getDuration(exp) && (
                        <p style={{ fontSize: 11, color: "#9CA3C0", marginTop: 3 }}>
                          {getDuration(exp)}
                          {exp.employment_type ? ` · ${exp.employment_type}` : ""}
                        </p>
                      )}
                      {exp.city && <p style={{ fontSize: 11, color: "#9CA3C0" }}>{exp.city}</p>}
                    </div>

                    {isOwner && (
                      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                        <button type="button" onClick={() => onToggleVisibility(exp.id, "work_items", isHidden ? "public" : "private")}
                          style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3C0" }}>
                          {isHidden ? <EyeOff style={{ width: 13, height: 13 }} /> : <Eye style={{ width: 13, height: 13 }} />}
                        </button>
                        <button type="button" onClick={() => onDelete(exp.id, "work_items")}
                          style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}>
                          <Trash2 style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    )}
                  </div>

                  {exp.description && (
                    <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 8, lineHeight: 1.6 }}>{exp.description}</p>
                  )}

                  {skills.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                      {skills.map((s, j) => (
                        <span key={j} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(232,115,58,0.09)", color: "#E8733A", fontWeight: 500 }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Squad co-sign slot */}
                  <ExperienceSquadSlot workItemId={exp.id} companyName={company} isOwnProfile={isOwner} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── THE CLASS (education, threaded) ─── */
export function TheClass({
  education, isOwner, onAdd, onDelete,
}: {
  education: any[];
  isOwner: boolean;
  onAdd: () => void;
  onDelete: (id: string, table: "work_items" | "achievements") => void;
}) {
  if (!education.length && !isOwner) return null;
  const threaded = education.length > 1;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 2px" }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>The Class</h2>
        {isOwner && (
          <button type="button" onClick={onAdd} className="clay-btn" style={{ width: 30, height: 30, borderRadius: 10, color: "#0369A1" }}>
            <Plus style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>

      {!education.length ? (
        <div className="clay-card" style={{ padding: "16px 20px" }}>
          <p style={{ fontSize: 13, color: "#9CA3C0", fontStyle: "italic" }}>Add your education history.</p>
        </div>
      ) : (
        <div className={threaded ? "thread-wrap" : undefined}>
          {threaded && <div className="thread-line-edu" />}
          {education.map((edu, i) => {
            const school = edu.institution_name || edu.institution || "Institution";
            const degree = [edu.degree, edu.branch].filter(Boolean).join(", ");

            return (
              <div key={edu.id} className={threaded ? "thread-item" : undefined} style={{ marginBottom: i < education.length - 1 ? 8 : 0 }}>
                {threaded && (
                  <div style={{
                    position: "absolute", left: 17, top: 18,
                    width: 14, height: 14, borderRadius: "50%",
                    background: edu.is_current ? "#0369A1" : "#D1D5DB",
                    border: "2px solid var(--bg-card)", zIndex: 2,
                  }} />
                )}

                <div className="clay-card" style={{ marginLeft: threaded ? 44 : 0, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{school}</p>
                      {degree && <p style={{ fontSize: 13, color: "#0369A1", fontWeight: 500, marginTop: 1 }}>{degree}</p>}
                      <p style={{ fontSize: 11, color: "#9CA3C0", marginTop: 3 }}>
                        {edu.start_year && (
                          `${edu.start_year}${edu.is_current ? " – Present" : edu.end_year ? ` – ${edu.end_year}` : ""}`
                        )}
                        {edu.grade ? ` · Grade: ${edu.grade}` : ""}
                      </p>
                    </div>
                    {isOwner && (
                      <button type="button" onClick={() => onDelete(edu.id, "work_items")}
                        style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444", flexShrink: 0 }}>
                        <Trash2 style={{ width: 12, height: 12 }} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── THE TOOLKIT (skills) ─── */
export function TheToolkit({
  skills, isOwner, onAdd, onRemoveSkill,
}: {
  skills: string[];
  isOwner: boolean;
  onAdd: () => void;
  onRemoveSkill: (skill: string) => void;
}) {
  if (!skills.length && !isOwner) return null;

  return (
    <SectionBox title="The Toolkit" accentColor="#7C3AED" onAdd={onAdd} isOwner={isOwner}>
      {skills.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {skills.map((skill, i) => (
            <span key={i} className="clay-pill" style={{ padding: "5px 12px", fontSize: 12, fontWeight: 500, background: "rgba(124,58,237,0.08)", color: "#7C3AED" }}>
              {skill}
              {isOwner && (
                <button type="button" onClick={() => onRemoveSkill(skill)}
                  style={{ marginLeft: 5, background: "none", border: "none", cursor: "pointer", color: "#7C3AED", padding: 0, display: "inline-flex", alignItems: "center", fontSize: 13, lineHeight: 1 }}>
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "#9CA3C0", fontStyle: "italic" }}>Add skills to show your toolkit.</p>
      )}
    </SectionBox>
  );
}

/* ─── THE WINS (achievements) ─── */
export function TheWins({
  achievements, isOwner, onAdd, onDelete,
}: {
  achievements: any[];
  isOwner: boolean;
  onAdd: () => void;
  onDelete: (id: string, table: "work_items" | "achievements") => void;
}) {
  if (!achievements.length && !isOwner) return null;

  return (
    <SectionBox title="The Wins" accentColor="#F59E0B" onAdd={onAdd} isOwner={isOwner}>
      {!achievements.length ? (
        <p style={{ fontSize: 13, color: "#9CA3C0", fontStyle: "italic" }}>Add awards and milestones.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {achievements.map((ach) => (
            <div key={ach.id} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{ach.icon_emoji || "🏆"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{ach.title}</p>
                {ach.issued_by && <p style={{ fontSize: 11, color: "#9CA3C0", marginTop: 1 }}>{ach.issued_by}</p>}
                {ach.description && <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4, lineHeight: 1.55 }}>{ach.description}</p>}
              </div>
              {isOwner && (
                <button type="button" onClick={() => onDelete(ach.id, "achievements")}
                  style={{ width: 26, height: 26, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444", flexShrink: 0 }}>
                  <Trash2 style={{ width: 12, height: 12 }} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionBox>
  );
}

/* ─── CERTS (certifications) ─── */
export function CertsSection({ certifications }: { certifications: any[] }) {
  if (!certifications.length) return null;

  return (
    <SectionBox title="Certs" accentColor="#0E7490">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {certifications.map((cert: any) => (
          <div key={cert.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(14,116,144,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Award style={{ width: 17, height: 17, color: "#0E7490" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{cert.name || cert.title}</p>
              {cert.issuer && <p style={{ fontSize: 11, color: "#9CA3C0" }}>{cert.issuer}{cert.issue_date ? ` · ${cert.issue_date}` : ""}</p>}
            </div>
            {cert.credential_url && (
              <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" style={{ color: "#0E7490", display: "flex", flexShrink: 0 }}>
                <ExternalLink style={{ width: 13, height: 13 }} />
              </a>
            )}
          </div>
        ))}
      </div>
    </SectionBox>
  );
}

/* ─── DROPS (posts grid) ─── */
export function DropsSection({
  userId, posts, totalPosts, isOwner, username,
}: {
  userId: string;
  posts: any[];
  totalPosts: number;
  isOwner: boolean;
  username?: string;
}) {
  if (!posts.length && !isOwner) return null;

  return (
    <SectionBox title="Drops" accentColor="#EC4899">
      {!posts.length ? (
        <p style={{ fontSize: 13, color: "#9CA3C0", fontStyle: "italic" }}>No posts yet.</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: posts.length > 6 ? 10 : 0 }}>
            {posts.slice(0, 6).map((post: any) => (
              <Link
                key={post.id}
                to={`/post/${post.id}`}
                style={{ display: "block", aspectRatio: "4/3", borderRadius: 14, overflow: "hidden", background: "rgba(0,0,0,0.04)", position: "relative", textDecoration: "none" }}
              >
                {post.image_urls?.[0] ? (
                  <img src={post.image_urls[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 6px" }}>
                    <p style={{ fontSize: 10, color: "#9CA3C0", lineHeight: 1.4, textAlign: "center", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 4 as any, WebkitBoxOrient: "vertical" as any }}>
                      {post.content || ""}
                    </p>
                  </div>
                )}
                {isOwner && (post.view_count != null || post.reach != null) && (
                  <div style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.55)", borderRadius: 6, padding: "2px 5px" }}>
                    <span style={{ fontSize: 9, color: "#fff", fontWeight: 700 }}>{(post.view_count || post.reach || 0).toLocaleString()}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
          {totalPosts > 6 && (
            <Link to={`/app/u/${username || userId}/posts`} style={{ fontSize: 12, color: "#E8733A", fontWeight: 600, textDecoration: "none" }}>
              See all {totalPosts} posts →
            </Link>
          )}
        </>
      )}
    </SectionBox>
  );
}

/* ─── REELS (flicks 9:16 grid) ─── */
export function ReelsSection({ profileId, isOwner }: { profileId: string; isOwner: boolean }) {
  return (
    <SectionBox title="Reels" accentColor="#FF5A1F">
      <ProfileFlicksSection profileId={profileId} isOwnProfile={isOwner} />
    </SectionBox>
  );
}

/* ─── CREATOR (channels + social links) ─── */
const PLATFORM_ICONS: Record<string, React.ElementType> = {
  youtube: Youtube,
  instagram: Instagram,
  twitter: Twitter,
  x: Twitter,
  linkedin: Linkedin,
};

export function CreatorSection({ channels, isOwner }: { channels: any[]; isOwner: boolean }) {
  if (!channels.length && !isOwner) return null;

  return (
    <SectionBox title="Creator" accentColor="#7E22CE">
      {!channels.length ? (
        <p style={{ fontSize: 13, color: "#9CA3C0", fontStyle: "italic" }}>
          {isOwner ? "Add your creator channels in Settings." : "No channels added."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {channels.map((ch) => {
            const Icon = PLATFORM_ICONS[ch.platform?.toLowerCase()] || Globe;
            return (
              <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(126,34,206,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon style={{ width: 17, height: 17, color: "#7E22CE" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{ch.channel_name}</p>
                  <p style={{ fontSize: 11, color: "#9CA3C0" }}>
                    {ch.platform}
                    {ch.subscriber_count ? ` · ${ch.subscriber_count.toLocaleString()} subs` : ""}
                    {ch.content_niche ? ` · ${ch.content_niche}` : ""}
                  </p>
                </div>
                {ch.channel_url && (
                  <a href={ch.channel_url} target="_blank" rel="noopener noreferrer" style={{ color: "#7E22CE", display: "flex", flexShrink: 0 }}>
                    <ExternalLink style={{ width: 14, height: 14 }} />
                  </a>
                )}
                {ch.is_monetized && (
                  <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 999, background: "rgba(126,34,206,0.10)", color: "#7E22CE", fontWeight: 700, flexShrink: 0 }}>
                    Monetized
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionBox>
  );
}

/* ─── OWNER DASHBOARD TILES ─── */
export function DashboardTiles({
  profileViewsCount, activityScore, cosignCount, completenessPercent,
}: {
  profileViewsCount: number;
  activityScore: number;
  cosignCount: number;
  completenessPercent: number;
}) {
  const tiles = [
    { label: "Profile views", value: profileViewsCount, color: "#E8733A", sub: "30 days" },
    { label: "Activity score", value: activityScore, color: "#7C3AED", sub: "pts" },
    { label: "Cosigns", value: cosignCount, color: "#0D9488", sub: "verified" },
    { label: "Complete", value: `${completenessPercent}%`, color: "#0369A1", sub: "profile" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
      {tiles.map((t) => (
        <div key={t.label} className="clay-card" style={{ padding: "14px 12px 12px", borderRadius: 20 }}>
          <p style={{ fontSize: 21, fontWeight: 800, color: t.color, lineHeight: 1 }}>{t.value}</p>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)", marginTop: 4 }}>{t.label}</p>
          <p style={{ fontSize: 10, color: "#9CA3C0" }}>{t.sub}</p>
        </div>
      ))}
    </div>
  );
}
