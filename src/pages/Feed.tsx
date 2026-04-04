import { useState, useEffect, useRef } from "react";
import { Heart, Lightbulb, Sparkles, MessageSquare, Repeat2, Share2, MoreHorizontal, Flag, Send, FileText, ChevronDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import NewPostModal from "@/components/NewPostModal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ImageGrid from "@/components/feed/ImageGrid";
import PdfCarousel from "@/components/feed/PdfCarousel";
import MentionText from "@/components/feed/MentionText";
import ActivityScoreRing from "@/components/ActivityScoreRing";
import SkeletonCard from "@/components/SkeletonCard";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const getComposePlaceholder = (role: string) => {
  switch (role) {
    case "student": return "Share a milestone, update, or thought...";
    case "doctor": return "Share a case, insight, or health tip...";
    case "government": return "Share something from your work today...";
    case "skilled_trade": return "Share a job you completed or a skill...";
    case "hr": return "Share a hiring insight or opportunity...";
    default: return "Share a milestone, update, or thought...";
  }
};

const getQuickActions = (role: string) => {
  switch (role) {
    case "student": return [{ label: "Project update", type: "work" }, { label: "Opportunity", type: "opportunity" }, { label: "Collaborator", type: "collab" }, { label: "PDF", type: "pdf" }];
    case "hr": return [{ label: "Job opening", type: "opportunity" }, { label: "Insight", type: "thought" }, { label: "PDF", type: "pdf" }];
    default: return [{ label: "Project update", type: "work" }, { label: "Opportunity", type: "opportunity" }, { label: "PDF", type: "pdf" }];
  }
};

const trendingTopics = ["#AgriTech", "#HealthTech", "#GovtJobs", "#UPSC", "#StartupIndia", "#SkilledTrade", "#TeacherLife", "#BankingCareers"];

// Fallback mock data shown when no DB posts exist yet
const mockPosts = [
  { id: "1", author: { name: "Riya Sharma", initials: "RS", role: "Student", roleColor: "#4F46E5" }, type: "Collab", topBorder: "var(--open-green)", content: "Looking for a backend developer to join our capstone project — building a telemedicine app for rural India. React Native + Supabase stack. cc @arjunkumar", time: "2h ago", reactions: { insightful: 4, useful: 12, inspiring: 2 }, comments: 8, reactedBy: { insightful: ["Arjun", "Priya", "4 others"], useful: ["Dr. Manoj", "Sunita", "10 others"], inspiring: ["Kavita", "1 other"] }, images: ["/placeholder.svg", "/placeholder.svg"], pdf: null },
  { id: "2", author: { name: "Dr. Manoj Patil", initials: "MP", role: "Doctor", roleColor: "#0E7490" }, type: "", topBorder: "", content: "Completed a 3-day health camp in Gadchiroli district. Screened 450+ patients for diabetes and hypertension. Early detection saves lives. @priyamenon helped coordinate.", time: "4h ago", reactions: { insightful: 18, useful: 6, inspiring: 31 }, comments: 14, reactedBy: { insightful: ["Rahul", "Prof. Sharma", "16 others"], useful: ["Riya", "5 others"], inspiring: ["Arjun", "Priya", "29 others"] }, images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"], pdf: null },
  { id: "3", author: { name: "Sunita Devi", initials: "SD", role: "Skilled Trade", roleColor: "#C2410C" }, type: "", topBorder: "", content: "Just finished rewiring an entire 3BHK flat in Dwarka. Complete with MCB panel upgrade. Client verified the work on Tiikme.", time: "6h ago", reactions: { insightful: 7, useful: 22, inspiring: 15 }, comments: 5, reactedBy: { insightful: ["Mohan", "6 others"], useful: ["Arjun", "Kavita", "20 others"], inspiring: ["Dr. Neha", "14 others"] }, images: [], pdf: { name: "Wiring_Report_Dwarka.pdf", pages: 14 } },
  { id: "4", author: { name: "Kavita Rao", initials: "KR", role: "HR / Recruiter", roleColor: "#6B21A8" }, type: "Opportunity", topBorder: "#F59E0B", content: "Build a dashboard that tracks real-time hiring pipeline for startups. Best solution gets Rs 15,000 and a 3-month internship.", time: "8h ago", reactions: { insightful: 24, useful: 18, inspiring: 9 }, comments: 22, reactedBy: { insightful: ["Riya", "Rahul", "22 others"], useful: ["Sunita", "17 others"], inspiring: ["Prof. Verma", "8 others"] }, images: ["/placeholder.svg"], pdf: null },
];

const mockComments = [
  { name: "Rahul K.", initials: "RK", color: "#0369A1", text: "This sounds amazing! I'd love to join. @riyasharma", time: "1h ago" },
  { name: "Priya M.", initials: "PM", color: "#92400E", text: "Great initiative. Shared with my students.", time: "2h ago" },
];

const reactionConfig = [
  { key: "insightful", icon: Heart, label: "Insightful" },
  { key: "useful", icon: Lightbulb, label: "Useful" },
  { key: "inspiring", icon: Sparkles, label: "Inspiring" },
];

const roleColorMap: Record<string, string> = {
  student: "#4F46E5",
  professional: "#0369A1",
  doctor: "#0E7490",
  government: "#166534",
  skilled_trade: "#C2410C",
  hr: "#6B21A8",
};

/* ─── LIVE POST CARD (from DB) ─── */
const LivePostCard = ({ post }: { post: any }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [reacted, setReacted] = useState<Record<string, boolean>>({});
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const { user } = useAuth();

  const reactions = post.reactions || { insightful: 0, useful: 0, inspiring: 0 };
  useEffect(() => { setReactionCounts({ ...reactions }); }, []);

  const author = post.author;
  const name = author?.full_name || author?.username || "Unknown";
  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const role = author?.role || "user";
  const roleColor = roleColorMap[role] || "#6B7280";
  const timeAgo = post.created_at
    ? getTimeAgo(new Date(post.created_at))
    : "";

  return (
    <article className="glass-liquid glass-liquid-hover rounded-2xl md:rounded-3xl mb-3 overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-4 pb-1">
        <Link to="/app/profile">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-bold text-white shrink-0 transition-transform duration-200 hover:scale-105" style={{ backgroundColor: roleColor }}>
            {author?.avatar_url ? <img src={author.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : initials}
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/app/profile" className="text-[14px] font-bold hover:underline transition-colors" style={{ color: "var(--text-1)" }}>{name}</Link>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: `${roleColor}1A`, color: roleColor, border: `1px solid ${roleColor}33` }}>{role}</span>
            {post.type && post.type !== "thought" && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)" }}>{post.type}</span>}
          </div>
          <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{timeAgo}</span>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-lg transition-all duration-150 cursor-pointer" style={{ color: "var(--text-3)" }}><MoreHorizontal className="w-4 h-4" /></button>
          {showMenu && (
            <div className="absolute right-0 top-8 glass-liquid rounded-xl p-1 min-w-[160px] z-10">
              <button onClick={() => { toast.info("Following"); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg transition-all duration-150 cursor-pointer" style={{ color: "var(--text-2)" }}>Follow this person</button>
              <button onClick={() => { toast.info("Report submitted"); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg transition-all duration-150 cursor-pointer" style={{ color: "var(--text-2)" }}><Flag className="w-3 h-3" /> Report</button>
              <button onClick={() => { navigator.clipboard.writeText("https://tiikme.in/post/" + post.id); toast.success("Link copied"); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg transition-all duration-150 cursor-pointer" style={{ color: "var(--text-2)" }}>Copy link</button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-2.5 post-body" style={{ fontSize: "14px", lineHeight: 1.75, color: "var(--text-2)" }}>
        <MentionText text={post.content} />
      </div>

      {post.pdf_url && (
        <div className="mx-4 mb-3">
          <div className="flex items-center gap-3 glass-liquid rounded-xl p-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(220,38,38,0.1)" }}>
              <FileText className="w-5 h-5" style={{ color: "#DC2626" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>Attached PDF</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 px-4 py-2">
        {reactionConfig.map(r => {
          const count = (reactionCounts[r.key] || 0);
          const active = reacted[r.key];
          return (
            <button
              key={r.key}
              onClick={async () => {
                const isSame = reacted[r.key];
                setReacted(p => ({ ...p, [r.key]: !isSame }));
                setReactionCounts(p => ({ ...p, [r.key]: isSame ? Math.max(0, (p[r.key] || 0) - 1) : (p[r.key] || 0) + 1 }));
                if (user) {
                  if (isSame) {
                    await supabase.from("post_reactions").delete().eq("post_id", post.id).eq("user_id", user.id);
                  } else {
                    await supabase.from("post_reactions").upsert({ post_id: post.id, user_id: user.id, reaction_type: r.key }, { onConflict: "post_id,user_id" } as any);
                  }
                }
              }}
              className="h-7 px-2.5 rounded-full text-[12px] font-semibold flex items-center gap-1 transition-all duration-200 cursor-pointer active:scale-95"
              style={{
                background: active ? "var(--brand-dim)" : "var(--surface-2)",
                border: active ? "1px solid var(--brand)" : "1px solid var(--border)",
                color: active ? "var(--brand)" : "var(--text-3)",
                boxShadow: active ? "0 0 8px var(--brand-glow)" : "none",
              }}
            >
              <r.icon className="w-3.5 h-3.5" /> {r.label} · {count}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-0.5 px-4 py-2" style={{ borderTop: "1px solid var(--border)" }}>
        <button onClick={() => setShowComments(!showComments)} className="h-9 px-3 rounded-xl text-[13px] font-medium flex items-center gap-1.5 transition-all duration-150 cursor-pointer hover:bg-[var(--brand-dim)]" style={{ color: "var(--text-2)" }}>
          <MessageSquare className="w-4 h-4" /> {post.comment_count || 0} <ChevronDown className={`w-3 h-3 transition-transform ${showComments ? "rotate-180" : ""}`} />
        </button>
        <button onClick={() => toast.success("Reposted")} className="h-9 px-3 rounded-xl text-[13px] font-medium flex items-center gap-1.5 transition-all duration-150 cursor-pointer hover:bg-[var(--brand-dim)]" style={{ color: "var(--text-2)" }}>
          <Repeat2 className="w-4 h-4" />
        </button>
        <button onClick={() => { navigator.clipboard.writeText("https://tiikme.in/post/" + post.id); toast.success("Link copied!"); }} className="h-9 px-3 rounded-xl text-[13px] font-medium flex items-center gap-1.5 transition-all duration-150 cursor-pointer hover:bg-[var(--brand-dim)]" style={{ color: "var(--text-2)" }}>
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {showComments && (
        <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
          {mockComments.map((c, i) => (
            <div key={i} className="flex items-start gap-2">
              <Link to="/app/profile">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 hover:scale-105 transition-transform" style={{ backgroundColor: c.color }}>{c.initials}</div>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link to="/app/profile" className="text-[13px] font-bold hover:underline" style={{ color: "var(--text-1)" }}>{c.name}</Link>
                  <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{c.time}</span>
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}><MentionText text={c.text} /></p>
                <button className="text-[11px] font-semibold mt-0.5 cursor-pointer" style={{ color: "var(--brand)" }}>Reply</button>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: "var(--brand)" }}>AK</div>
            <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment..."
              className="flex-1 h-9 rounded-xl px-3 text-[13px] outline-none transition-all duration-150"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
              onKeyDown={e => { if (e.key === "Enter" && commentText.trim()) { toast.success("Comment posted"); setCommentText(""); } }} />
            <button onClick={() => { if (commentText.trim()) { toast.success("Comment posted"); setCommentText(""); } }}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-95"
              style={{ background: commentText.trim() ? "var(--brand)" : "var(--surface-2)" }}>
              <Send className="w-3.5 h-3.5" style={{ color: commentText.trim() ? "white" : "var(--text-3)" }} />
            </button>
          </div>
        </div>
      )}
    </article>
  );
};

/* ─── MOCK POST CARD (original static) ─── */
const MockPostCard = ({ post }: { post: typeof mockPosts[0] }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [reacted, setReacted] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  return (
    <article
      className="glass-liquid glass-liquid-hover rounded-2xl md:rounded-3xl mb-3 overflow-hidden"
      style={{ borderTop: post.topBorder ? `3px solid ${post.topBorder}` : undefined }}
    >
      <div className="flex items-center gap-3 px-4 pt-4 pb-1">
        <Link to="/app/profile">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-bold text-white shrink-0 transition-transform duration-200 hover:scale-105" style={{ backgroundColor: post.author.roleColor }}>{post.author.initials}</div>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/app/profile" className="text-[14px] font-bold hover:underline transition-colors" style={{ color: "var(--text-1)" }}>{post.author.name}</Link>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: `${post.author.roleColor}1A`, color: post.author.roleColor, border: `1px solid ${post.author.roleColor}33` }}>{post.author.role}</span>
            {post.type && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)" }}>{post.type}</span>}
          </div>
          <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{post.time}</span>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-lg transition-all duration-150 cursor-pointer" style={{ color: "var(--text-3)" }}><MoreHorizontal className="w-4 h-4" /></button>
          {showMenu && (
            <div className="absolute right-0 top-8 glass-liquid rounded-xl p-1 min-w-[160px] z-10">
              <button onClick={() => { toast.info("Following"); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg transition-all duration-150 cursor-pointer" style={{ color: "var(--text-2)" }}>Follow this person</button>
              <button onClick={() => { toast.info("Report submitted"); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg transition-all duration-150 cursor-pointer" style={{ color: "var(--text-2)" }}><Flag className="w-3 h-3" /> Report</button>
              <button onClick={() => { navigator.clipboard.writeText("https://tiikme.in/post/" + post.id); toast.success("Link copied"); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg transition-all duration-150 cursor-pointer" style={{ color: "var(--text-2)" }}>Copy link</button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-2.5 post-body" style={{ fontSize: "14px", lineHeight: 1.75, color: "var(--text-2)" }}>
        <MentionText text={post.content} />
      </div>

      {post.images.length > 0 && (
        <div className="px-4 pb-2">
          <div className="rounded-xl overflow-hidden">
            <ImageGrid images={post.images} />
          </div>
        </div>
      )}

      {post.pdf && (
        <div className="mx-4 mb-3">
          <div className="flex items-center gap-3 glass-liquid rounded-xl p-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(220,38,38,0.1)" }}>
              <FileText className="w-5 h-5" style={{ color: "#DC2626" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{post.pdf.name}</p>
              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{post.pdf.pages} pages</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 px-4 py-2">
        {reactionConfig.map(r => {
          const count = (post.reactions as any)[r.key] + (reacted[r.key] ? 1 : 0);
          const active = reacted[r.key];
          const people = (post.reactedBy as any)[r.key] as string[];
          return (
            <Tooltip key={r.key}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setReacted(p => ({ ...p, [r.key]: !p[r.key] }))}
                  className="h-7 px-2.5 rounded-full text-[12px] font-semibold flex items-center gap-1 transition-all duration-200 cursor-pointer active:scale-95"
                  style={{
                    background: active ? "var(--brand-dim)" : "var(--surface-2)",
                    border: active ? "1px solid var(--brand)" : "1px solid var(--border)",
                    color: active ? "var(--brand)" : "var(--text-3)",
                    boxShadow: active ? "0 0 8px var(--brand-glow)" : "none",
                  }}
                >
                  <r.icon className="w-3.5 h-3.5" /> {r.label} · {count}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[11px] max-w-[200px]">
                {people.join(", ")} found this {r.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <div className="flex items-center gap-0.5 px-4 py-2" style={{ borderTop: "1px solid var(--border)" }}>
        <button onClick={() => setShowComments(!showComments)} className="h-9 px-3 rounded-xl text-[13px] font-medium flex items-center gap-1.5 transition-all duration-150 cursor-pointer hover:bg-[var(--brand-dim)]" style={{ color: "var(--text-2)" }}>
          <MessageSquare className="w-4 h-4" /> {post.comments} <ChevronDown className={`w-3 h-3 transition-transform ${showComments ? "rotate-180" : ""}`} />
        </button>
        <button onClick={() => toast.success("Reposted")} className="h-9 px-3 rounded-xl text-[13px] font-medium flex items-center gap-1.5 transition-all duration-150 cursor-pointer hover:bg-[var(--brand-dim)]" style={{ color: "var(--text-2)" }}>
          <Repeat2 className="w-4 h-4" />
        </button>
        <button onClick={() => { navigator.clipboard.writeText("https://tiikme.in/post/" + post.id); toast.success("Link copied!"); }} className="h-9 px-3 rounded-xl text-[13px] font-medium flex items-center gap-1.5 transition-all duration-150 cursor-pointer hover:bg-[var(--brand-dim)]" style={{ color: "var(--text-2)" }}>
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {showComments && (
        <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
          {mockComments.map((c, i) => (
            <div key={i} className="flex items-start gap-2">
              <Link to="/app/profile">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 hover:scale-105 transition-transform" style={{ backgroundColor: c.color }}>{c.initials}</div>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link to="/app/profile" className="text-[13px] font-bold hover:underline" style={{ color: "var(--text-1)" }}>{c.name}</Link>
                  <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{c.time}</span>
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}><MentionText text={c.text} /></p>
                <button className="text-[11px] font-semibold mt-0.5 cursor-pointer" style={{ color: "var(--brand)" }}>Reply</button>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: "var(--brand)" }}>AK</div>
            <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment..."
              className="flex-1 h-9 rounded-xl px-3 text-[13px] outline-none transition-all duration-150"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
              onKeyDown={e => { if (e.key === "Enter" && commentText.trim()) { toast.success("Comment posted"); setCommentText(""); } }} />
            <button onClick={() => { if (commentText.trim()) { toast.success("Comment posted"); setCommentText(""); } }}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-95"
              style={{ background: commentText.trim() ? "var(--brand)" : "var(--surface-2)" }}>
              <Send className="w-3.5 h-3.5" style={{ color: commentText.trim() ? "white" : "var(--text-3)" }} />
            </button>
          </div>
        </div>
      )}
    </article>
  );
};

/* ─── HELPERS ─── */
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ─── RIGHT RAIL WIDGETS ─── */
const ActivityWidget = () => (
  <aside className="glass-liquid rounded-2xl p-5 mb-4">
    <p className="micro-label mb-4">ACTIVITY THIS QUARTER</p>
    <div className="flex justify-center">
      <ActivityScoreRing score={78} size={100} strokeWidth={7} trend="+5 this week" percentile="Top 15% in your domain" />
    </div>
  </aside>
);

const RecruiterWidget = () => (
  <aside className="glass-liquid rounded-2xl p-5 mb-4">
    <p className="micro-label mb-3">WHO SAW YOUR WORK</p>
    <p className="text-[13px] mb-3" style={{ color: "var(--text-2)" }}>3 recruiters viewed your work this week</p>
    <div className="flex -space-x-2 mb-3">
      {[{ i: "ZP", c: "#6B21A8" }, { i: "RA", c: "#0369A1" }, { i: "TC", c: "#C2410C" }, { i: "MK", c: "#166534" }, { i: "SJ", c: "#92400E" }].map((a, idx) => (
        <div key={idx} className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: a.c, border: "2px solid var(--surface)" }}>{a.i}</div>
      ))}
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: "var(--surface-2)", border: "2px solid var(--surface)", color: "var(--text-3)" }}>+2</div>
    </div>
    <Link to="/app/teams" className="text-[13px] font-semibold flex items-center gap-1" style={{ color: "var(--brand)" }}>See full activity <ArrowUpRight className="w-3 h-3" /></Link>
  </aside>
);

const OpportunitiesWidget = () => (
  <aside className="glass-liquid rounded-2xl p-5 mb-4">
    <p className="micro-label mb-3">OPEN OPPORTUNITIES</p>
    <div className="space-y-0">
      {[{ title: "Rural Water Monitoring IoT", reward: "₹25,000", days: "12d" }, { title: "AI Crop Disease Detection", reward: "₹50,000", days: "20d" }, { title: "E-Governance Portal Redesign", reward: "₹30,000", days: "8d" }].map((ch, i) => (
        <Link key={ch.title} to="/app/opportunities" className="flex items-start gap-2.5 py-2.5 cursor-pointer" style={{ borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: "#F59E0B" }} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{ch.title}</p>
            <div className="flex gap-1.5 text-[11px]" style={{ color: "var(--text-3)" }}>
              <span className="font-bold" style={{ color: "#F59E0B" }}>{ch.reward}</span>
              <span>·</span><span>{ch.days}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
    <Link to="/app/opportunities" className="text-[13px] font-semibold mt-2 flex items-center gap-1" style={{ color: "var(--brand)" }}>View all <ArrowUpRight className="w-3 h-3" /></Link>
  </aside>
);

const SuggestedWidget = () => (
  <aside className="glass-liquid rounded-2xl p-5">
    <p className="micro-label mb-3">SUGGESTED CONNECTIONS</p>
    <div className="space-y-3">
      {[{ name: "Priya M.", role: "Faculty", initials: "PM", color: "#92400E", context: "Teaches at DTU" }, { name: "Rahul K.", role: "Professional", initials: "RK", color: "#0369A1", context: "Worked at Zepto" }, { name: "Dr. Neha S.", role: "Doctor", initials: "NS", color: "#0E7490", context: "Alumni of DTU" }].map(s => (
        <div key={s.name} className="flex items-center gap-2.5">
          <Link to="/app/profile">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white hover:scale-105 transition-transform" style={{ backgroundColor: s.color }}>{s.initials}</div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link to="/app/profile" className="text-[13px] font-bold truncate block hover:underline" style={{ color: "var(--text-1)" }}>{s.name}</Link>
            <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{s.context}</p>
          </div>
          <Button variant="secondary" size="xs" className="active:scale-95 transition-all duration-200" onClick={() => toast.success("Request sent")}>Connect</Button>
        </div>
      ))}
    </div>
    <Link to="/app/explore" className="text-[13px] font-semibold mt-3 flex items-center gap-1" style={{ color: "var(--brand)" }}>Find more <ArrowUpRight className="w-3 h-3" /></Link>
  </aside>
);

/* ─── FEED PAGE ─── */
const Feed = () => {
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postModalType, setPostModalType] = useState<string | undefined>();
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const { posts: livePosts, loading, loadingMore, hasMore, loadMore } = useFeedPosts();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { profile, initials } = useAuth();
  const userRole = profile?.role || "student";
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const { posts: livePosts, loading, loadingMore, hasMore, loadMore } = useFeedPosts();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  const openCompose = (type?: string) => { setPostModalType(type); setPostModalOpen(true); };
  const quickActions = getQuickActions(userRole);

  const hasLivePosts = livePosts.length > 0;

  return (
    <main className="max-w-[960px] mx-auto px-4 md:px-6 py-7">
      <div className="flex gap-6">
        {/* Feed column */}
        <div className="flex-1 min-w-0 max-w-[660px]">
          {/* Compose box */}
          <div className="glass-liquid rounded-2xl md:rounded-3xl p-3 mb-4">
           <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 overflow-hidden" style={{ backgroundColor: "var(--brand)" }}>
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
              </div>
              <button onClick={() => openCompose()} className="flex-1 text-left text-[13px] h-10 glass-input px-4 cursor-pointer" style={{ color: "var(--text-3)" }}>
                {getComposePlaceholder(userRole)}
              </button>
            </div>
            <div className="flex items-center gap-1.5 ml-12 pt-2 mt-2" style={{ borderTop: "1px solid var(--border)" }}>
              {quickActions.map(item => (
                <button key={item.label} onClick={() => openCompose(item.type)}
                  className="h-7 px-2.5 rounded-full text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all duration-200 active:scale-95 hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trending */}
          <div className="mb-4">
            <p className="micro-label px-1 mb-2">TRENDING</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {trendingTopics.map(t => (
                <button key={t} onClick={() => setActiveTopic(activeTopic === t ? null : t)}
                  className="whitespace-nowrap text-[11px] font-semibold h-7 px-2.5 rounded-full transition-all duration-200 shrink-0 cursor-pointer active:scale-95"
                  style={{
                    background: activeTopic === t ? "var(--brand)" : "var(--surface-2)",
                    border: `1px solid ${activeTopic === t ? "var(--brand)" : "var(--border)"}`,
                    color: activeTopic === t ? "white" : "var(--text-2)",
                  }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Today divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-[11px] font-semibold px-4 py-1.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
              Today · {hasLivePosts ? livePosts.length : mockPosts.length} posts
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          {/* Loading skeleton */}
          {loading && <SkeletonCard count={3} />}

          {/* Live posts from DB */}
          {!loading && hasLivePosts && livePosts.map(post => (
            <LivePostCard key={post.id} post={post} />
          ))}

          {/* Fallback mock posts when DB is empty */}
          {!loading && !hasLivePosts && mockPosts.map(post => (
            <MockPostCard key={post.id} post={post} />
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />

          {loadingMore && <SkeletonCard count={2} />}

          {!loading && !hasMore && (
            <div className="flex items-center justify-center py-8">
              <span className="text-[12px] font-medium px-5 py-2 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)" }}>You're caught up ✓</span>
            </div>
          )}

          {/* Show caught up for mock posts too */}
          {!loading && !hasLivePosts && (
            <div className="flex items-center justify-center py-8">
              <span className="text-[12px] font-medium px-5 py-2 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)" }}>You're caught up ✓</span>
            </div>
          )}
        </div>

        {/* Right rail — desktop only */}
        <aside className="hidden lg:block w-[280px] shrink-0 sticky top-7 self-start space-y-0">
          <ActivityWidget />
          <RecruiterWidget />
          <OpportunitiesWidget />
          <SuggestedWidget />
        </aside>
      </div>

      <NewPostModal open={postModalOpen} onClose={() => setPostModalOpen(false)} defaultType={postModalType} />
    </main>
  );
};

export default Feed;
