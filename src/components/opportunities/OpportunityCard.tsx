// src/components/opportunities/OpportunityCard.tsx
// Fixed: full-width, Apply Now at bottom, applicant count at bottom-left,
// working like/comment/refer, edit/delete for own opportunities

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
import { formatRelativeTime } from "@/utils/time";
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
  onApply?: (opp: OpportunityCardProps["opp"]) => void;
  onRefer?: (opp: OpportunityCardProps["opp"]) => void;
  onDelete?: (oppId: string) => void;
}

export function OpportunityCard({
  opp,
  company,
  isLikedByMe,
  hasApplied,
  initialLikeCount = 0,
  initialCommentCount = 0,
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

  const typeColor: Record<string, string> = {
    job: "bg-blue-50 text-blue-700",
    internship: "bg-purple-50 text-purple-700",
    freelance: "bg-green-50 text-green-700",
    hackathon: "bg-orange-50 text-orange-700",
    volunteer: "bg-pink-50 text-pink-700",
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
    if (onApply) {
      onApply(opp);
      return;
    }
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
        setApplied(true); // already applied
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
  const handleRefer = () => {
    if (onRefer) {
      onRefer(opp);
      return;
    }
    setShowRefer(true);
  };

  return (
    <div id={`opportunity-${opp.id}`} className="bg-white rounded-2xl border border-gray-100 w-full overflow-hidden hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Company logo */}
            <AvatarSquare
              src={company?.logo_url}
              name={company?.name || "Company"}
              size={44}
            />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">
                {company?.name || "Unknown Company"}
              </p>
              <h3 className="font-semibold text-[15px] text-gray-900 mt-0.5 leading-tight break-words">
                {opp.title}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400">{formatRelativeTime(opp.created_at)}</span>
            {/* Three-dot menu */}
            {(isOwn || user?.id === opp.poster_id) && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
                >
                  <MoreHorizontal size={16} />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-8 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-20 w-48">
                      <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => { navigate(`/app/opportunities/${opp.id}/edit`); setShowMenu(false); }}>
                        <Edit2 size={14} /> Edit opportunity
                      </button>
                      <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={handleCloseOpportunity}
                        disabled={!opp.is_open}>
                        <X size={14} /> Close opportunity
                      </button>
                      <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => { navigate(`/app/opportunities/${opp.id}/applications`); setShowMenu(false); }}>
                        <Users size={14} /> View applications
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 disabled:text-red-300 disabled:hover:bg-transparent"
                        disabled={applicantCount > 0}
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
        <div className="flex items-center flex-wrap gap-2 mt-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${typeColor[opp.type] || "bg-gray-100 text-gray-600"}`}>
            <Briefcase size={10} className="inline mr-1" />{opp.type}
          </span>
          {opp.location && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin size={10} /> {opp.location}
            </span>
          )}
          {opp.is_remote && (
            <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Wifi size={10} /> Remote
            </span>
          )}
          {salary && (
            <span className="text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
              {salary}
            </span>
          )}
        </div>

        {/* Description */}
        {opp.description && (
          <p className="text-sm text-gray-600 mt-3 leading-relaxed line-clamp-3">
            {opp.description}
          </p>
        )}

        {/* Skills */}
        {opp.skills_required && opp.skills_required.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {opp.skills_required.slice(0, 5).map(skill => (
              <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {skill}
              </span>
            ))}
            {opp.skills_required.length > 5 && (
              <span className="text-xs text-gray-400">+{opp.skills_required.length - 5} more</span>
            )}
          </div>
        )}
      </div>

      {/* Actions row */}
      <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-1">
        <button
          type="button"
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm px-2 py-1.5 rounded-lg transition-colors ${
            liked ? "text-[#E8733A] hover:bg-[#FFF3EC]" : "text-gray-500 hover:text-[#E8733A] hover:bg-[#FFF3EC]"
          }`}
        >
          <Heart size={15} className={liked ? "fill-[#E8733A]" : ""} />
          {likeCount > 0 ? likeCount : "Like"}
        </button>
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#E8733A] hover:bg-[#FFF3EC] px-2 py-1.5 rounded-lg"
        >
          <MessageCircle size={15} />
          {commentCount > 0 ? commentCount : "Comment"}
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#E8733A] hover:bg-[#FFF3EC] px-2 py-1.5 rounded-lg"
          onClick={handleRefer}
        >
          <Users size={15} />
          Refer
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#E8733A] hover:bg-[#FFF3EC] px-2 py-1.5 rounded-lg"
          onClick={async () => {
            await navigator.clipboard.writeText(`${window.location.origin}/app/opportunities?opp=${opp.id}`);
            toast.success("Link copied!");
          }}
        >
          <Share2 size={15} />
          Share
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <OpportunityCommentPanel
          opportunityId={opp.id}
          onCountChange={(delta) => setCommentCount((count) => Math.max(0, count + delta))}
        />
      )}

      {/* Bottom: applicant count + Apply button */}
      <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Users size={13} />
          <span>
            {applicantCount} applicant{applicantCount !== 1 ? "s" : ""}
            {opp.positions_available ? ` · ${opp.positions_available} position${opp.positions_available !== 1 ? "s" : ""}` : ""}
          </span>
          {opp.deadline && (
            <>
              <span>·</span>
              <Clock size={12} />
              <span>Deadline: {new Date(opp.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={applying || applied || !opp.is_open}
          className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-semibold text-sm transition-all ${
            applied
              ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
              : !opp.is_open
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-[#E8733A] text-white hover:bg-[#d4632e] active:scale-95"
          }`}
        >
          {applying ? (
            <Loader2 size={14} className="animate-spin" />
          ) : applied ? (
            <><CheckCircle size={14} /> Applied</>
          ) : !opp.is_open ? (
            "Closed"
          ) : (
            "Apply Now →"
          )}
        </button>
      </div>

      {showRefer && (
        <SendJDModal open={showRefer} onClose={() => setShowRefer(false)} opportunity={opp} />
      )}
    </div>
  );
}
