import { useState, useEffect } from "react";
import {
  MapPin, Briefcase, Wifi, Clock, Users, Heart, Bookmark, BookmarkCheck,
  MessageCircle, Share2, X, CheckCircle, Loader2, Building2,
} from "lucide-react";
import AvatarSquare from "@/components/ui/AvatarSquare";
import OpportunityCommentPanel from "@/components/opportunities/OpportunityCommentPanel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Opp {
  id: string;
  poster_id: string;
  org_id?: string | null;
  title: string;
  description: string | null;
  type: string;
  location?: string | null;
  is_remote?: boolean;
  work_arrangement?: "onsite" | "hybrid" | "remote" | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string;
  skills_required?: string[] | null;
  applications_count: number;
  responses_count?: number | null;
  activity_score_min?: number | null;
  expires_at?: string | null;
  is_open: boolean;
  created_at: string;
  deadline?: string | null;
  positions_available?: number | null;
}

interface Props {
  opp: Opp;
  company: { id?: string; name: string; logo_url?: string | null; slug?: string } | null;
  isLikedByMe: boolean;
  isSavedByMe: boolean;
  hasApplied: boolean;
  isFollowingOrg?: boolean;
  onApply: () => void;
  onClose: () => void;
}

const typeConfig: Record<string, { bg: string; color: string }> = {
  job:        { bg: "rgba(196,74,31,0.10)", color: "#C44A1F" },
  full_time:  { bg: "rgba(196,74,31,0.10)", color: "#C44A1F" },
  internship: { bg: "rgba(22,101,52,0.10)", color: "#166534" },
  freelance:  { bg: "rgba(196,74,31,0.10)", color: "#C44A1F" },
  gig:        { bg: "rgba(196,74,31,0.10)", color: "#C44A1F" },
  contract:   { bg: "rgba(146,64,14,0.10)", color: "#92400E" },
  hackathon:  { bg: "rgba(196,74,31,0.10)", color: "#C44A1F" },
};

export default function JobDetailPanel({
  opp, company, isLikedByMe, isSavedByMe, hasApplied, isFollowingOrg, onApply, onClose,
}: Props) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(isLikedByMe);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(isSavedByMe);
  const [applied, setApplied] = useState(hasApplied);
  const [applying, setApplying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    setLiked(isLikedByMe);
    setSaved(isSavedByMe);
    setApplied(hasApplied);
    setShowComments(false);
    setCommentCount(0);
  }, [opp.id, isLikedByMe, isSavedByMe, hasApplied]);

  const handleLike = async () => {
    if (!user) { toast.error("Sign in to like"); return; }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(c => wasLiked ? Math.max(0, c - 1) : c + 1);
    try {
      if (wasLiked) {
        await supabase.from("opportunity_likes").delete().eq("opportunity_id", opp.id).eq("user_id", user.id);
      } else {
        await supabase.from("opportunity_likes").insert({ opportunity_id: opp.id, user_id: user.id });
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount(c => wasLiked ? c + 1 : Math.max(0, c - 1));
    }
  };

  const handleSave = async () => {
    if (!user) { toast.error("Sign in to save"); return; }
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      if (wasSaved) {
        await (supabase.from as any)("opportunity_saves").delete().eq("opportunity_id", opp.id).eq("user_id", user.id);
        toast.success("Removed from saved");
      } else {
        await (supabase.from as any)("opportunity_saves").insert({ opportunity_id: opp.id, user_id: user.id });
        toast.success("Saved!");
      }
    } catch {
      setSaved(wasSaved);
      toast.error("Could not save");
    }
  };

  const salaryLabel = () => {
    if (!opp.salary_min && !opp.salary_max) return null;
    const currency = opp.salary_currency === "INR" ? "₹" : "$";
    const lpa = (n: number) => n >= 100000 ? `${(n / 100000).toFixed(0)} LPA` : `${(n / 1000).toFixed(0)}K`;
    if (opp.salary_min && opp.salary_max) return `${currency}${lpa(opp.salary_min)}–${lpa(opp.salary_max)}`;
    if (opp.salary_min) return `From ${currency}${lpa(opp.salary_min)}`;
    return `Up to ${currency}${lpa(opp.salary_max!)}`;
  };

  const tc = typeConfig[opp.type] || { bg: "var(--surface-2)", color: "var(--text-2)" };
  const salary = salaryLabel();
  const applicantCount = opp.responses_count ?? opp.applications_count ?? 0;

  const expiryBadge = (() => {
    if (!opp.is_open) return { label: "Closed", urgent: false };
    const exp = opp.expires_at || (opp.deadline ? opp.deadline + "T23:59:59Z" : null);
    if (!exp) return null;
    const days = Math.ceil((new Date(exp).getTime() - Date.now()) / 86400000);
    if (days < 0) return { label: "Expired", urgent: false };
    if (days === 0) return { label: "Closes today", urgent: true };
    if (days <= 3) return { label: `${days}d left`, urgent: true };
    if (days <= 14) return { label: `${days}d left`, urgent: false };
    return null;
  })();

  const actionBtn = (active = false) => ({
    display: "flex", alignItems: "center", gap: 5,
    padding: "7px 10px", borderRadius: 8, fontSize: 13, fontWeight: 500,
    border: "none", cursor: "pointer", background: "none",
    color: active ? "#FF5A1F" : "var(--text-3)", transition: "color 120ms",
  });

  return (
    <div
      className="glass-card rounded-2xl overflow-hidden flex flex-col"
      style={{ maxHeight: "calc(100dvh - 120px)", position: "sticky", top: 64 }}
    >
      {/* Header */}
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 0 }}>
            <AvatarSquare src={company?.logo_url} name={company?.name || "Company"} size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500, truncate: "true" as any }}>
                {company?.name}
                {isFollowingOrg && (
                  <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 999, background: "rgba(13,148,136,0.10)", color: "#0D9488" }}>Following</span>
                )}
              </p>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", margin: "3px 0 0", lineHeight: 1.3 }}>{opp.title}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ flexShrink: 0, padding: 6, borderRadius: 8, background: "var(--surface-2)", border: "none", color: "var(--text-3)", cursor: "pointer" }}>
            <X size={14} />
          </button>
        </div>

        {/* Badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: tc.bg, color: tc.color, textTransform: "capitalize" }}>
            <Briefcase size={9} />{opp.type.replace(/_/g, " ")}
          </span>
          {opp.location && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--text-3)" }}>
              <MapPin size={9} />{opp.location}
            </span>
          )}
          {(opp.work_arrangement === "remote" || (!opp.work_arrangement && opp.is_remote)) && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "rgba(13,148,136,0.10)", color: "#0D9488" }}>
              <Wifi size={9} />Remote
            </span>
          )}
          {opp.work_arrangement === "hybrid" && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "rgba(99,102,241,0.10)", color: "#4F46E5" }}>Hybrid</span>
          )}
          {salary && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "rgba(22,101,52,0.10)", color: "#166534" }}>{salary}</span>
          )}
          {expiryBadge && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: expiryBadge.urgent ? "rgba(239,68,68,0.10)" : "rgba(217,119,6,0.10)", color: expiryBadge.urgent ? "#EF4444" : "#D97706" }}>
              <Clock size={9} />{expiryBadge.label}
            </span>
          )}
        </div>

        {/* Apply CTA */}
        <button
          type="button"
          onClick={() => { if (!applied && opp.is_open) { onApply(); setApplied(true); } }}
          disabled={applying || applied || !opp.is_open}
          style={{
            width: "100%", marginTop: 12, height: 44, borderRadius: 10,
            fontSize: 14, fontWeight: 700, border: "none",
            cursor: applying || applied || !opp.is_open ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            ...(applied
              ? { background: "rgba(52,199,89,0.10)", color: "#34C759" }
              : !opp.is_open
              ? { background: "var(--surface-2)", color: "var(--text-3)" }
              : { background: "#FF5A1F", color: "#fff" }),
          }}>
          {applying ? <Loader2 size={14} className="animate-spin" />
            : applied ? <><CheckCircle size={14} />Applied</>
            : !opp.is_open ? "Closed"
            : "Apply Now →"}
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
        {opp.description && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>About this role</p>
            <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{opp.description}</p>
          </div>
        )}

        {opp.skills_required && opp.skills_required.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Skills needed</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {opp.skills_required.map(s => (
                <span key={s} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, background: "var(--surface-2)", color: "var(--text-2)" }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontSize: 11, color: "var(--text-3)" }}>
          <Users size={11} style={{ display: "inline", marginRight: 4 }} />
          {applicantCount} applicant{applicantCount !== 1 ? "s" : ""}
          {opp.positions_available ? ` · ${opp.positions_available} open` : ""}
          {" · "}Posted {new Date(opp.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </p>

        {showComments && (
          <div style={{ marginTop: 16 }}>
            <OpportunityCommentPanel
              opportunityId={opp.id}
              onCountChange={delta => setCommentCount(c => Math.max(0, c + delta))}
            />
          </div>
        )}
      </div>

      {/* Action row */}
      <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "3px 10px", display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
        <button type="button" onClick={handleLike} style={actionBtn(liked)}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#FF5A1F"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = liked ? "#FF5A1F" : "var(--text-3)"; }}>
          <Heart size={14} style={liked ? { fill: "#FF5A1F", color: "#FF5A1F" } : {}} />
          {likeCount > 0 ? likeCount : "Like"}
        </button>
        <button type="button" onClick={() => setShowComments(v => !v)} style={actionBtn(showComments)}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#FF5A1F"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = showComments ? "#FF5A1F" : "var(--text-3)"; }}>
          <MessageCircle size={14} />
          {commentCount > 0 ? commentCount : "Comment"}
        </button>
        <button type="button" onClick={handleSave} style={actionBtn(saved)}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#FF5A1F"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = saved ? "#FF5A1F" : "var(--text-3)"; }}>
          {saved
            ? <BookmarkCheck size={14} style={{ fill: "#FF5A1F", color: "#FF5A1F" }} />
            : <Bookmark size={14} />}
          {saved ? "Saved" : "Save"}
        </button>
        <button type="button" style={actionBtn()}
          onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}/app/opportunities?opp=${opp.id}`); toast.success("Link copied!"); }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#FF5A1F"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; }}>
          <Share2 size={14} /> Share
        </button>
      </div>
    </div>
  );
}
