import { useState } from "react";
import {
  MapPin, Briefcase, Wifi, Clock, Users, Heart, MessageCircle,
  Share2, MoreHorizontal, Edit2, Trash2, X, CheckCircle, Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import AvatarSquare from "@/components/ui/AvatarSquare";
import SendJDModal from "@/components/opportunities/SendJDModal";
import OpportunityCommentPanel from "@/components/opportunities/OpportunityCommentPanel";

interface OpportunityCardProps {
  opp: {
    id: string;
    poster_id: string;
    org_id?: string | null;
    title: string;
    description: string | null;
    type: string;
    location?: string | null;
    is_remote?: boolean;
    salary_min?: number | null;
    salary_max?: number | null;
    salary_currency?: string;
    skills_required?: string[] | null;
    applications_count: number;
    responses_count?: number | null;
    compensation?: string | null;
    activity_score_min?: number | null;
    expires_at?: string | null;
    is_open: boolean;
    created_at: string;
    deadline?: string | null;
    positions_available?: number | null;
  };
  company: {
    id?: string;
    name: string;
    logo_url?: string | null;
  } | null;
  isLikedByMe: boolean;
  hasApplied: boolean;
  initialLikeCount?: number;
  initialCommentCount?: number;
  isFollowingOrg?: boolean;
  onApply?: (opp: OpportunityCardProps["opp"]) => void;
  onRefer?: (opp: OpportunityCardProps["opp"]) => void;
  onDelete?: (oppId: string) => void;
}

const typeConfig: Record<string, { bg: string; color: string }> = {
  job:        { bg: "rgba(196,74,31,0.10)",  color: "#C44A1F" },
  full_time:  { bg: "rgba(196,74,31,0.10)",  color: "#C44A1F" },
  internship: { bg: "rgba(22,101,52,0.10)",  color: "#166534" },
  freelance:  { bg: "rgba(196,74,31,0.10)",  color: "#C44A1F" },
  gig:        { bg: "rgba(196,74,31,0.10)",  color: "#C44A1F" },
  contract:   { bg: "rgba(146,64,14,0.10)",  color: "#92400E" },
  hackathon:  { bg: "rgba(196,74,31,0.10)",  color: "#C44A1F" },
  volunteer:  { bg: "rgba(159,18,57,0.10)",  color: "#9F1239" },
  fellowship: { bg: "rgba(20,83,45,0.10)",   color: "#14532D" },
};

export function OpportunityCard({
  opp,
  company,
  isLikedByMe,
  hasApplied,
  initialLikeCount = 0,
  initialCommentCount = 0,
  isFollowingOrg = false,
  onApply,
  onRefer,
  onDelete,
}: OpportunityCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(isLikedByMe);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(hasApplied);
  const [showRefer, setShowRefer] = useState(false);

  const isOwn = user?.id === opp.poster_id;

  const salaryLabel = () => {
    if (!opp.salary_min && !opp.salary_max) return null;
    const currency = opp.salary_currency === "INR" ? "₹" : "$";
    const lpa = (n: number) =>
      n >= 100000 ? `${(n / 100000).toFixed(0)} LPA` : `${(n / 1000).toFixed(0)}K`;
    if (opp.salary_min && opp.salary_max) return `${currency}${lpa(opp.salary_min)}–${lpa(opp.salary_max)}`;
    if (opp.salary_min) return `From ${currency}${lpa(opp.salary_min)}`;
    if (opp.salary_max) return `Up to ${currency}${lpa(opp.salary_max!)}`;
    return null;
  };

  const handleLike = async () => {
    if (!user) { toast.error("Sign in to like"); return; }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(c => wasLiked ? Math.max(0, c - 1) : c + 1);
    try {
      if (wasLiked) {
        await supabase.from("opportunity_likes").delete()
          .eq("opportunity_id", opp.id).eq("user_id", user.id);
      } else {
        await supabase.from("opportunity_likes").insert({ opportunity_id: opp.id, user_id: user.id });
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount(c => wasLiked ? c + 1 : Math.max(0, c - 1));
      toast.error("Could not react. Try again.");
    }
  };

  const handleApply = async () => {
    if (!user) { navigate("/sign-in"); return; }
    if (applied) return;
    if (onApply) { onApply(opp); return; }
    setApplying(true);
    try {
      const { error } = await supabase.from("opportunity_applications").insert({
        opportunity_id: opp.id,
        applicant_id: user.id,
        status: "applied",
      });
      if (error) throw error;
      setApplied(true);
      toast.success("Application submitted!");
    } catch (error: unknown) {
      if (typeof error === "object" && error && "code" in error && error.code === "23505") {
        setApplied(true);
      } else {
        toast.error("Could not apply. Try again.");
      }
    } finally {
      setApplying(false);
    }
  };

  const handleDelete = async () => {
    if (applicantCount > 0) {
      toast.error("Cannot delete an opportunity that already has applicants.");
      setShowMenu(false);
      return;
    }
    if (!window.confirm("Delete this opportunity? This cannot be undone.")) return;
    try {
      const { error } = await supabase.from("opportunities")
        .delete().eq("id", opp.id).eq("poster_id", user!.id);
      if (error) {
        if (error.code === "23503") {
          toast.error("Cannot delete — applications exist. Close it instead.");
          return;
        }
        throw error;
      }
      toast.success("Opportunity deleted");
      onDelete?.(opp.id);
    } catch {
      toast.error("Could not delete. Try again.");
    } finally {
      setShowMenu(false);
    }
  };

  const handleCloseOpportunity = async () => {
    try {
      const { error } = await supabase.from("opportunities")
        .update({ is_open: false, status: "closed" })
        .eq("id", opp.id).eq("poster_id", user!.id);
      if (error) throw error;
      toast.success("Opportunity closed");
    } catch {
      toast.error("Could not close. Try again.");
    }
    setShowMenu(false);
  };

  const applicantCount = opp.responses_count ?? opp.applications_count ?? 0;
  const salary = salaryLabel();
  const tc = typeConfig[opp.type] || { bg: "var(--surface-2)", color: "var(--text-2)" };

  const expiryBadge = (() => {
    if (!opp.is_open) return { label: "Closed", urgent: false, closed: true };
    const exp = opp.expires_at || (opp.deadline ? opp.deadline + "T23:59:59Z" : null);
    if (!exp) return null;
    const days = Math.ceil((new Date(exp).getTime() - Date.now()) / 86400000);
    if (days < 0) return { label: "Expired", urgent: false, closed: true };
    if (days === 0) return { label: "Closes today", urgent: true, closed: false };
    if (days <= 3) return { label: `${days}d left`, urgent: true, closed: false };
    if (days <= 14) return { label: `${days}d left`, urgent: false, closed: false };
    return null;
  })();

  const handleRefer = () => {
    if (onRefer) { onRefer(opp); return; }
    setShowRefer(true);
  };

  /* ── action button shared style ── */
  const actionBtn = (active = false) => ({
    display: "flex", alignItems: "center", gap: 6,
    padding: "6px 8px", borderRadius: 8,
    fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer",
    background: "none",
    color: active ? "#FF5A1F" : "var(--text-3)",
    transition: "background 120ms, color 120ms",
  });

  return (
    <div
      id={`opportunity-${opp.id}`}
      className="glass-card w-full overflow-hidden"
      style={{ borderRadius: 16 }}
    >
      {/* Header */}
      <div style={{ padding: "14px 14px 12px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          {/* Left: logo + title */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0, flex: 1 }}>
            <AvatarSquare src={company?.logo_url} name={company?.name || "Company"} size={44} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>
                  {company?.name || "Unknown Company"}
                </span>
                {isFollowingOrg && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
                    background: "rgba(13,148,136,0.10)", color: "#0D9488",
                  }}>Following</span>
                )}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", margin: "3px 0 0", lineHeight: "1.3" }}>
                {opp.title}
              </h3>
            </div>
          </div>

          {/* Right: Apply button + 3-dot menu */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {!isOwn && (
              <button
                type="button"
                onClick={handleApply}
                disabled={applying || applied || !opp.is_open}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "11px 16px", borderRadius: 10, minHeight: 44,
                  fontSize: 13, fontWeight: 700, border: "none", cursor: applying || applied || !opp.is_open ? "default" : "pointer",
                  ...(applied
                    ? { background: "rgba(52,199,89,0.10)", color: "#34C759" }
                    : !opp.is_open
                    ? { background: "var(--surface-2)", color: "var(--text-3)" }
                    : { background: "#FF5A1F", color: "#fff" }),
                }}
              >
                {applying ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : applied ? (
                  <><CheckCircle size={13} /> Applied</>
                ) : !opp.is_open ? (
                  "Closed"
                ) : (
                  "Apply →"
                )}
              </button>
            )}

            {(isOwn || user?.id === opp.poster_id) && (
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setShowMenu(!showMenu)}
                  style={{
                    width: 44, height: 44, borderRadius: 8, display: "flex", alignItems: "center",
                    justifyContent: "center", background: "var(--surface-2)", border: "none",
                    color: "var(--text-3)", cursor: "pointer",
                  }}
                >
                  <MoreHorizontal size={15} />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div style={{
                      position: "absolute", right: 0, top: 36, zIndex: 20,
                      minWidth: 192, borderRadius: 12, padding: "4px 0",
                      background: "var(--bg-card)", border: "1px solid var(--border-glass)",
                      boxShadow: "var(--shadow-lg)",
                    }}>
                      <button type="button"
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", fontSize: 13, color: "var(--text-1)", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                        onClick={() => { navigate(`/app/opportunities/${opp.id}/edit`); setShowMenu(false); }}>
                        <Edit2 size={14} /> Edit opportunity
                      </button>
                      <button type="button"
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", fontSize: 13, color: "var(--text-1)", background: "none", border: "none", cursor: "pointer", textAlign: "left", opacity: !opp.is_open ? 0.4 : 1 }}
                        onMouseEnter={e => { if (opp.is_open) (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                        onClick={handleCloseOpportunity}
                        disabled={!opp.is_open}>
                        <X size={14} /> Close opportunity
                      </button>
                      <button type="button"
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", fontSize: 13, color: "var(--text-1)", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                        onClick={() => { navigate(`/app/opportunities/${opp.id}/applications`); setShowMenu(false); }}>
                        <Users size={14} /> View applications
                      </button>
                      <div style={{ height: 1, background: "var(--border-subtle)", margin: "4px 0" }} />
                      <button type="button"
                        disabled={applicantCount > 0}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", fontSize: 13, color: "#EF4444", background: "none", border: "none", cursor: applicantCount > 0 ? "default" : "pointer", textAlign: "left", opacity: applicantCount > 0 ? 0.4 : 1 }}
                        onMouseEnter={e => { if (!applicantCount) (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.06)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                        onClick={handleDelete}>
                        <Trash2 size={14} /> {applicantCount > 0 ? "Delete unavailable" : "Delete"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tags row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
            background: tc.bg, color: tc.color, textTransform: "capitalize",
          }}>
            <Briefcase size={10} />{opp.type.replace(/_/g, " ")}
          </span>
          {opp.location && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-3)" }}>
              <MapPin size={10} /> {opp.location}
            </span>
          )}
          {opp.is_remote && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
              background: "rgba(13,148,136,0.10)", color: "#0D9488",
            }}>
              <Wifi size={10} /> Remote
            </span>
          )}
          {salary && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
              background: "rgba(22,101,52,0.10)", color: "#166534",
            }}>{salary}</span>
          )}
          {expiryBadge && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
              ...(expiryBadge.closed
                ? { background: "var(--surface-2)", color: "var(--text-3)" }
                : expiryBadge.urgent
                ? { background: "rgba(239,68,68,0.10)", color: "#EF4444" }
                : { background: "rgba(217,119,6,0.10)", color: "#D97706" }),
            }}>
              <Clock size={9} /> {expiryBadge.label}
            </span>
          )}
        </div>

        {/* Description */}
        {opp.description && (
          <p style={{
            fontSize: 13, color: "var(--text-2)", marginTop: 12, lineHeight: "1.6",
            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {opp.description}
          </p>
        )}

        {/* Skills */}
        {opp.skills_required && opp.skills_required.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {opp.skills_required.slice(0, 5).map(skill => (
              <span key={skill} style={{
                fontSize: 11, padding: "2px 9px", borderRadius: 999,
                background: "var(--surface-2)", color: "var(--text-2)",
              }}>{skill}</span>
            ))}
            {opp.skills_required.length > 5 && (
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>+{opp.skills_required.length - 5} more</span>
            )}
          </div>
        )}
      </div>

      {/* Actions row */}
      <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "2px 10px", display: "flex", alignItems: "center", gap: 2 }}>
        <button type="button" onClick={handleLike} style={actionBtn(liked)}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,90,31,0.08)"; (e.currentTarget as HTMLElement).style.color = "#FF5A1F"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = liked ? "#FF5A1F" : "var(--text-3)"; }}>
          <Heart size={15} style={liked ? { fill: "#FF5A1F", color: "#FF5A1F" } : {}} />
          {likeCount > 0 ? likeCount : "Like"}
        </button>
        <button type="button" onClick={() => setShowComments(!showComments)} style={actionBtn(showComments)}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,90,31,0.08)"; (e.currentTarget as HTMLElement).style.color = "#FF5A1F"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = showComments ? "#FF5A1F" : "var(--text-3)"; }}>
          <MessageCircle size={15} />
          {commentCount > 0 ? commentCount : "Comment"}
        </button>
        <button type="button" onClick={handleRefer} style={actionBtn()}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,90,31,0.08)"; (e.currentTarget as HTMLElement).style.color = "#FF5A1F"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; }}>
          <Users size={15} />
          Refer
        </button>
        <button type="button" style={actionBtn()}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,90,31,0.08)"; (e.currentTarget as HTMLElement).style.color = "#FF5A1F"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; }}
          onClick={async () => {
            await navigator.clipboard.writeText(`${window.location.origin}/app/opportunities?opp=${opp.id}`);
            toast.success("Link copied!");
          }}>
          <Share2 size={15} />
          Share
        </button>
      </div>

      {/* Comments panel */}
      {showComments && (
        <OpportunityCommentPanel
          opportunityId={opp.id}
          onCountChange={(delta) => setCommentCount((count) => Math.max(0, count + delta))}
        />
      )}

      {/* Footer: applicant count + deadline */}
      <div style={{
        borderTop: "1px solid var(--border-subtle)", padding: "9px 14px",
        display: "flex", alignItems: "center", gap: 12,
        fontSize: 11, color: "var(--text-3)",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Users size={11} />
          {applicantCount} applicant{applicantCount !== 1 ? "s" : ""}
          {opp.positions_available ? ` · ${opp.positions_available} open` : ""}
        </span>
        {opp.deadline && (
          <>
            <span>·</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={11} />
              Due {new Date(opp.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          </>
        )}
        {opp.expires_at && !opp.deadline && (
          <>
            <span>·</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={11} />
              Expires {new Date(opp.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          </>
        )}
      </div>

      {showRefer && (
        <SendJDModal open={showRefer} onClose={() => setShowRefer(false)} opportunity={opp} />
      )}
    </div>
  );
}
