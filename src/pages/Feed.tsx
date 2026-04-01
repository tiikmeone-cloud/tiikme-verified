import { useState } from "react";
import { Heart, Lightbulb, Sparkles, MessageSquare, Repeat2, Share2, MoreHorizontal, Flag, Send, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import NewPostModal from "@/components/NewPostModal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ImageGrid from "@/components/feed/ImageGrid";
import PdfCarousel from "@/components/feed/PdfCarousel";
import MentionText from "@/components/feed/MentionText";

const currentUser = { name: "Arjun", role: "student" };

const getComposePlaceholder = (role: string) => {
  switch (role) {
    case "student": return `What are you building today, ${currentUser.name}?`;
    case "doctor": return "Share a case, insight, or health tip...";
    case "government": return "Share something from your work today...";
    case "skilled_trade": return "Share a job you completed or a skill...";
    case "hr": return "Share a hiring insight or opportunity...";
    default: return "What's on your mind?";
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

const posts = [
  { id: "1", author: { name: "Riya Sharma", initials: "RS", role: "Student", roleColor: "#4F46E5" }, type: "Collab", borderColor: "#4F46E5", content: "Looking for a backend developer to join our capstone project — building a telemedicine app for rural India. React Native + Supabase stack. cc @arjunkumar", time: "2h ago", reactions: { insightful: 4, useful: 12, inspiring: 2 }, comments: 8, reactedBy: { insightful: ["Arjun", "Priya", "4 others"], useful: ["Dr. Manoj", "Sunita", "10 others"], inspiring: ["Kavita", "1 other"] }, images: ["/placeholder.svg", "/placeholder.svg"], pdf: null },
  { id: "2", author: { name: "Dr. Manoj Patil", initials: "MP", role: "Doctor", roleColor: "#0E7490" }, type: "", borderColor: "", content: "Completed a 3-day health camp in Gadchiroli district. Screened 450+ patients for diabetes and hypertension. Early detection saves lives. @priyamenon helped coordinate.", time: "4h ago", reactions: { insightful: 18, useful: 6, inspiring: 31 }, comments: 14, reactedBy: { insightful: ["Rahul", "Prof. Sharma", "16 others"], useful: ["Riya", "5 others"], inspiring: ["Arjun", "Priya", "29 others"] }, images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"], pdf: null },
  { id: "3", author: { name: "Sunita Devi", initials: "SD", role: "Skilled Trade", roleColor: "#C2410C" }, type: "", borderColor: "#C2410C", content: "Just finished rewiring an entire 3BHK flat in Dwarka. Complete with MCB panel upgrade. Client verified the work on Tiikme.", time: "6h ago", reactions: { insightful: 7, useful: 22, inspiring: 15 }, comments: 5, reactedBy: { insightful: ["Mohan", "6 others"], useful: ["Arjun", "Kavita", "20 others"], inspiring: ["Dr. Neha", "14 others"] }, images: [], pdf: { name: "Wiring_Report_Dwarka.pdf", pages: 14 } },
  { id: "4", author: { name: "Kavita Rao", initials: "KR", role: "HR / Recruiter", roleColor: "#6B21A8" }, type: "Opportunity", borderColor: "#6B21A8", content: "Build a dashboard that tracks real-time hiring pipeline for startups. Best solution gets Rs 15,000 and a 3-month internship.", time: "8h ago", reactions: { insightful: 24, useful: 18, inspiring: 9 }, comments: 22, reactedBy: { insightful: ["Riya", "Rahul", "22 others"], useful: ["Sunita", "17 others"], inspiring: ["Prof. Verma", "8 others"] }, images: ["/placeholder.svg"], pdf: null },
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

const PostCard = ({ post }: { post: typeof posts[0] }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [reacted, setReacted] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  return (
    <div
      className="rounded-2xl mb-3.5 overflow-hidden transition-all duration-200 hover:shadow-md border border-border/30"
      style={{
        background: "var(--surface)",
        borderLeft: post.borderColor ? `4px solid ${post.borderColor}` : undefined,
        boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.02)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-1">
        <Link to="/app/profile">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 transition-transform duration-200 hover:scale-105" style={{ backgroundColor: post.author.roleColor }}>{post.author.initials}</div>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link to="/app/profile" className="text-[14px] font-bold text-t1 hover:text-brand transition-colors">{post.author.name}</Link>
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full opacity-60" style={{ background: `${post.author.roleColor}10`, color: post.author.roleColor }}>{post.author.role}</span>
            {post.type && <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-surface-2 text-t3">{post.type}</span>}
            <span className="text-[11px] text-t3 ml-auto">{post.time}</span>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-lg text-t3 hover:text-t1 hover:bg-surface-2 transition-all duration-200 cursor-pointer"><MoreHorizontal className="w-4 h-4" /></button>
          {showMenu && (
            <div className="absolute right-0 top-8 rounded-xl p-1 min-w-[140px] z-10 border border-border/30 bg-surface-2 shadow-lg">
              <button onClick={() => { toast.info("Report submitted"); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg text-t2 hover:bg-brand-dim hover:text-brand transition-all duration-200 cursor-pointer">
                <Flag className="w-3 h-3" /> Report post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body with @mentions */}
      <p className="text-[15px] leading-[1.8] px-5 py-2.5 text-t1">
        <MentionText text={post.content} />
      </p>

      {/* Image grid */}
      {post.images.length > 0 && <ImageGrid images={post.images} />}

      {/* PDF carousel */}
      {post.pdf && <PdfCarousel fileName={post.pdf.name} totalPages={post.pdf.pages} />}

      {/* Single unified action row */}
      <div className="flex items-center gap-1.5 px-5 py-2 border-t border-border/30">
        {reactionConfig.map(r => {
          const count = (post.reactions as any)[r.key] + (reacted[r.key] ? 1 : 0);
          const active = reacted[r.key];
          const people = (post.reactedBy as any)[r.key] as string[];
          const tooltipText = `${people.join(", ")} found this ${r.label}`;
          return (
            <Tooltip key={r.key}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setReacted(p => ({ ...p, [r.key]: !p[r.key] }))}
                  className="h-7 px-2.5 rounded-full text-[11px] font-medium flex items-center gap-1 transition-all duration-200 cursor-pointer active:scale-95"
                  style={{
                    background: active ? "var(--brand-dim)" : "transparent",
                    color: active ? "var(--brand)" : "var(--text-3)",
                    boxShadow: active ? "0 0 6px var(--brand-glow)" : "none",
                  }}
                >
                  <r.icon className="w-3.5 h-3.5" /> {count}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[11px] max-w-[200px]">
                {tooltipText}
              </TooltipContent>
            </Tooltip>
          );
        })}

        <div className="flex-1" />

        <button onClick={() => setShowComments(!showComments)} className="h-7 px-2.5 rounded-lg text-[12px] font-medium flex items-center gap-1 text-t3 hover:text-t1 hover:bg-surface-2 transition-all duration-200 cursor-pointer active:scale-95">
          <MessageSquare className="w-3.5 h-3.5" /> {post.comments}
        </button>
        <button onClick={() => toast.success("Reposted")} className="h-7 px-2.5 rounded-lg text-[12px] font-medium flex items-center gap-1 text-t3 hover:text-t1 hover:bg-surface-2 transition-all duration-200 cursor-pointer active:scale-95">
          <Repeat2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => { navigator.clipboard.writeText("https://tiikme.in/post/" + post.id); toast.success("Link copied!"); }} className="h-7 px-2.5 rounded-lg text-[12px] font-medium flex items-center gap-1 text-t3 hover:text-t1 hover:bg-surface-2 transition-all duration-200 cursor-pointer active:scale-95">
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Comments with @mentions */}
      {showComments && (
        <div className="px-5 pb-4 pt-2 border-t border-border/30 space-y-3">
          {mockComments.map((c, i) => (
            <div key={i} className="flex items-start gap-2">
              <Link to="/app/profile">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 hover:scale-105 transition-transform" style={{ backgroundColor: c.color }}>{c.initials}</div>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link to="/app/profile" className="text-[12px] font-bold text-t1 hover:text-brand transition-colors">{c.name}</Link>
                  <span className="text-[10px] text-t3">{c.time}</span>
                </div>
                <p className="text-[13px] text-t1 leading-relaxed"><MentionText text={c.text} /></p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment..."
              className="flex-1 h-9 rounded-xl px-3 text-[12px] outline-none bg-surface-2 border border-border/30 text-t1 placeholder:text-t3 focus:border-brand transition-all duration-200"
              onKeyDown={e => { if (e.key === "Enter" && commentText.trim()) { toast.success("Comment posted"); setCommentText(""); } }} />
            <button onClick={() => { if (commentText.trim()) { toast.success("Comment posted"); setCommentText(""); } }} className="p-2 rounded-lg cursor-pointer transition-all duration-200 active:scale-95"><Send className="w-3.5 h-3.5 text-brand" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

const Feed = () => {
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postModalType, setPostModalType] = useState<string | undefined>();
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const openCompose = (type?: string) => { setPostModalType(type); setPostModalOpen(true); };
  const quickActions = getQuickActions(currentUser.role);

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      <div className="flex gap-7">
        {/* Feed column */}
        <div className="flex-1 max-w-[640px] space-y-4">
          {/* Compose */}
          <div className="rounded-2xl border border-border/30 p-4" style={{ background: "var(--surface)", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: "var(--brand)" }}>AK</div>
              <button onClick={() => openCompose()} className="flex-1 text-left text-sm h-[44px] rounded-full px-5 bg-surface-2 border border-border/30 text-t3 hover:border-brand transition-all duration-200 cursor-pointer active:scale-[0.99]">
                {getComposePlaceholder(currentUser.role)}
              </button>
            </div>
            <div className="flex items-center gap-1.5 ml-[52px] pt-3 border-t border-border/30">
              {quickActions.map(item => (
                <button key={item.label} onClick={() => openCompose(item.type)}
                  className="h-7 px-3 rounded-full text-[11px] font-semibold flex items-center gap-1 bg-surface-2 border border-border/30 text-t2 hover:border-brand hover:text-brand hover:bg-brand-dim transition-all duration-200 cursor-pointer active:scale-95">
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trending */}
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-t3 mb-2 px-1">Trending</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {trendingTopics.map(t => (
                <button key={t} onClick={() => setActiveTopic(activeTopic === t ? null : t)}
                  className="whitespace-nowrap text-[11px] font-semibold h-7 px-3 rounded-full transition-all duration-200 shrink-0 border cursor-pointer active:scale-95"
                  style={{
                    background: activeTopic === t ? "var(--brand)" : "var(--surface-2)",
                    borderColor: activeTopic === t ? "var(--brand)" : "var(--border)",
                    color: activeTopic === t ? "white" : "var(--text-2)",
                  }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-surface-2 border border-border/30 text-t3">Today · {posts.length} new</span>
            <div className="flex-1 h-px bg-border/30" />
          </div>

          {posts.map(post => <PostCard key={post.id} post={post} />)}

          <div className="flex items-center justify-center py-6">
            <span className="text-[12px] font-medium px-5 py-2 rounded-full bg-surface-2 border border-border/30 text-t3">You're caught up</span>
          </div>
        </div>

        {/* Right rail */}
        <div className="hidden xl:block w-64 space-y-3 shrink-0">
          <div className="rounded-2xl border border-border/30 p-3.5" style={{ background: "var(--surface)", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
            <p className="text-[9px] font-bold tracking-widest uppercase text-t3 mb-1.5">Activity Signal</p>
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className="text-xl font-extrabold text-brand">78</span>
              <span className="text-[10px] text-t3">/ 100</span>
            </div>
            <div className="flex items-end gap-px h-5">
              {[3,5,7,4,8,6,9,5,7,8,6,9].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{ height: `${h * 10}%`, background: i > 8 ? "var(--brand)" : i > 5 ? "var(--brand-dim)" : "var(--border-2)" }} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/30 p-3.5" style={{ background: "var(--surface)", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
            <p className="text-[9px] font-bold tracking-widest uppercase text-t3 mb-1.5">Recruiter Eyes</p>
            <p className="text-[11px] text-t2 mb-1.5">3 recruiters viewed your work</p>
            <div className="flex -space-x-2 mb-1.5">
              {["ZP", "RA", "TC"].map((i, idx) => <div key={idx} className="w-6 h-6 rounded-full flex items-center justify-center text-[7px] font-bold text-white border-2 border-surface" style={{ backgroundColor: ["#6B21A8", "#0369A1", "#C2410C"][idx] }}>{i}</div>)}
            </div>
            <Link to="/app/alerts" className="text-[10px] font-semibold text-brand hover:underline">See who →</Link>
          </div>

          <div className="rounded-2xl border border-border/30 p-3.5" style={{ background: "var(--surface)", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
            <p className="text-[9px] font-bold tracking-widest uppercase text-t3 mb-1.5">Opportunities</p>
            <div className="space-y-2">
              {[{ title: "Rural Water Monitoring IoT", reward: "₹25,000", days: "12d" }, { title: "AI Crop Disease Detection", reward: "₹50,000", days: "20d" }, { title: "E-Governance Portal Redesign", reward: "₹30,000", days: "8d" }].map(ch => (
                <div key={ch.title} className="pl-2" style={{ borderLeft: "2px solid #F59E0B" }}>
                  <p className="text-[11px] font-bold text-t1 leading-tight">{ch.title}</p>
                  <div className="flex gap-1.5 text-[9px] text-t3"><span className="font-bold" style={{ color: "#F59E0B" }}>{ch.reward}</span><span>·</span><span>{ch.days}</span></div>
                </div>
              ))}
            </div>
            <Link to="/app/opportunities" className="block text-[10px] font-semibold mt-2 text-brand hover:underline">View all →</Link>
          </div>

          <div className="rounded-2xl border border-border/30 p-3.5" style={{ background: "var(--surface)", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
            <p className="text-[9px] font-bold tracking-widest uppercase text-t3 mb-1.5">Suggested</p>
            <div className="space-y-2">
              {[{ name: "Priya M.", role: "Faculty", initials: "PM", color: "#92400E" }, { name: "Rahul K.", role: "Professional", initials: "RK", color: "#0369A1" }, { name: "Dr. Neha S.", role: "Doctor", initials: "NS", color: "#0E7490" }].map(s => (
                <div key={s.name} className="flex items-center gap-2">
                  <Link to="/app/profile">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-bold text-white hover:scale-105 transition-transform" style={{ backgroundColor: s.color }}>{s.initials}</div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to="/app/profile" className="text-[11px] font-bold truncate text-t1 hover:text-brand transition-colors block">{s.name}</Link>
                    <p className="text-[9px] text-t3">{s.role}</p>
                  </div>
                  <Button variant="outline" size="xs" className="text-[10px] h-6 px-2 active:scale-95 transition-all duration-200" onClick={() => toast.success("Request sent")}>Connect</Button>
                </div>
              ))}
            </div>
            <Link to="/app/explore" className="block text-[10px] font-semibold mt-2 text-brand hover:underline">See more →</Link>
          </div>
        </div>
      </div>

      <NewPostModal open={postModalOpen} onClose={() => setPostModalOpen(false)} defaultType={postModalType} />
    </div>
  );
};

export default Feed;
