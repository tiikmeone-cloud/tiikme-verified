import { useState } from "react";
import { Heart, Lightbulb, Sparkles, MessageSquare, Repeat2, Share2, MoreHorizontal, Flag, ChevronDown, ChevronUp, Send, Image, Users, TrendingUp, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import NewPostModal from "@/components/NewPostModal";

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
  { id: "1", author: { name: "Riya Sharma", initials: "RS", role: "Student", roleColor: "#4F46E5" }, type: "Collab", borderColor: "#4F46E5", content: "Looking for a backend developer to join our capstone project — building a telemedicine app for rural India. React Native + Supabase stack.", time: "2h ago", reactions: { insightful: 4, useful: 12, inspiring: 2 }, comments: 8 },
  { id: "2", author: { name: "Dr. Manoj Patil", initials: "MP", role: "Doctor", roleColor: "#0E7490" }, type: "", borderColor: "", content: "Completed a 3-day health camp in Gadchiroli district. Screened 450+ patients for diabetes and hypertension.", time: "4h ago", reactions: { insightful: 18, useful: 6, inspiring: 31 }, comments: 14 },
  { id: "3", author: { name: "Sunita Devi", initials: "SD", role: "Skilled Trade", roleColor: "#C2410C" }, type: "", borderColor: "#C2410C", content: "Just finished rewiring an entire 3BHK flat in Dwarka. Complete with MCB panel upgrade. Client verified the work.", time: "6h ago", reactions: { insightful: 7, useful: 22, inspiring: 15 }, comments: 5 },
  { id: "4", author: { name: "Kavita Rao", initials: "KR", role: "HR / Recruiter", roleColor: "#6B21A8" }, type: "Opportunity", borderColor: "#6B21A8", content: "Build a dashboard that tracks real-time hiring pipeline for startups. Best solution gets ₹15,000.", time: "8h ago", reactions: { insightful: 24, useful: 18, inspiring: 9 }, comments: 22 },
];

const mockComments = [
  { name: "Rahul K.", initials: "RK", color: "#0369A1", text: "This sounds amazing! I'd love to join.", time: "1h ago" },
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
    <div className="t-card" style={{ borderLeft: post.borderColor ? `4px solid ${post.borderColor}` : undefined, marginBottom: 14 }}>
      {/* Header */}
      <div className="flex items-start gap-3 px-[18px] pt-[18px]">
        <Link to="/app/profile">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ backgroundColor: post.author.roleColor }}>{post.author.initials}</div>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/app/profile" className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{post.author.name}</Link>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${post.author.roleColor}1A`, color: post.author.roleColor }}>{post.author.role}</span>
            {post.type && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)" }}>{post.type}</span>}
          </div>
          <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{post.time}</p>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--text-3)" }}><MoreHorizontal className="w-4 h-4" /></button>
          {showMenu && (
            <div className="absolute right-0 top-8 t-card rounded-xl p-1 min-w-[140px] z-10">
              <button onClick={() => { toast.info("Report submitted"); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg transition-colors" style={{ color: "var(--text-2)" }}>
                <Flag className="w-3 h-3" /> Report post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <p className="text-[14px] leading-[1.75] px-[18px] py-2.5" style={{ color: "var(--text-2)" }}>{post.content}</p>

      {/* Reactions */}
      <div className="flex items-center gap-1.5 px-[18px] pb-2 flex-wrap">
        {reactionConfig.map(r => {
          const count = (post.reactions as any)[r.key] + (reacted[r.key] ? 1 : 0);
          const active = reacted[r.key];
          return (
            <button key={r.key} onClick={() => setReacted(p => ({ ...p, [r.key]: !p[r.key] }))}
              className="h-[30px] px-3 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-all"
              style={{
                background: active ? "var(--brand-dim)" : "var(--surface-2)",
                border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
                color: active ? "var(--brand)" : "var(--text-2)",
                boxShadow: active ? "0 0 8px var(--brand-glow)" : "none",
              }}>
              <r.icon className="w-3.5 h-3.5" /> {r.label} · {count}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-[18px] py-2 border-t" style={{ borderColor: "var(--border)" }}>
        <Button variant="ghost" size="sm" className="gap-1.5 text-[13px]" onClick={() => setShowComments(!showComments)}>
          <MessageSquare className="w-3.5 h-3.5" /> {post.comments}
          {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-[13px]" onClick={() => toast.success("Reposted")}>
          <Repeat2 className="w-3.5 h-3.5" /> Repost
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-[13px]" onClick={() => { navigator.clipboard.writeText("https://tiikme.in/post/" + post.id); toast.success("Link copied!"); }}>
          <Share2 className="w-3.5 h-3.5" /> Share
        </Button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-[18px] pb-4 pt-2 border-t space-y-3" style={{ borderColor: "var(--border)" }}>
          {mockComments.map((c, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: c.color }}>{c.initials}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{c.name}</span><span className="text-[10px]" style={{ color: "var(--text-3)" }}>{c.time}</span></div>
                <p className="text-[12px]" style={{ color: "var(--text-2)" }}>{c.text}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment..."
              className="flex-1 h-9 rounded-xl px-3 text-[12px] outline-none"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", color: "var(--text-1)" }}
              onKeyDown={e => { if (e.key === "Enter" && commentText.trim()) { toast.success("Comment posted"); setCommentText(""); } }} />
            <button onClick={() => { if (commentText.trim()) { toast.success("Comment posted"); setCommentText(""); } }} className="p-2 rounded-lg"><Send className="w-3.5 h-3.5" style={{ color: "var(--brand)" }} /></button>
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
          <div className="t-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#4F46E5] flex items-center justify-center text-[11px] font-bold text-white">AK</div>
              <button onClick={() => openCompose()} className="flex-1 text-left text-[14px] h-[46px] rounded-[23px] px-[18px] transition-colors" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-3)" }}>
                {getComposePlaceholder(currentUser.role)}
              </button>
            </div>
            <div className="flex items-center gap-1.5 ml-[52px] pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              {quickActions.map(item => (
                <button key={item.label} onClick={() => openCompose(item.type)}
                  className="h-[30px] px-3 rounded-full text-[12px] font-semibold flex items-center gap-1 transition-all"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", color: "var(--text-2)" }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trending */}
          <div>
            <p className="micro-label mb-2 px-1">TRENDING</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {trendingTopics.map(t => (
                <button key={t} onClick={() => setActiveTopic(activeTopic === t ? null : t)}
                  className="whitespace-nowrap text-[12px] font-semibold h-[30px] px-3 rounded-full transition-all shrink-0"
                  style={{
                    background: activeTopic === t ? "var(--brand)" : "var(--surface-2)",
                    border: `1px solid ${activeTopic === t ? "var(--brand)" : "var(--border)"}`,
                    color: activeTopic === t ? "white" : "var(--text-2)",
                  }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-[11px] font-semibold px-4 py-1 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>Today · {posts.length} new posts</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          {posts.map(post => <PostCard key={post.id} post={post} />)}

          <div className="flex items-center justify-center py-6">
            <span className="text-[13px] font-medium px-6 py-2.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>You're caught up</span>
          </div>
        </div>

        {/* Right rail */}
        <div className="hidden xl:block w-80 space-y-5 shrink-0">
          {/* Activity */}
          <div className="t-card p-5">
            <p className="micro-label mb-3">ACTIVITY SIGNAL</p>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-[36px] font-extrabold" style={{ color: "var(--brand)" }}>78</span>
              <span className="text-[12px]" style={{ color: "var(--text-3)" }}>/ 100 this quarter</span>
            </div>
            <div className="flex items-end gap-1 h-10">
              {[3,5,7,4,8,6,9,5,7,8,6,9].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{ height: `${h * 10}%`, background: i > 8 ? "var(--brand)" : i > 5 ? "var(--brand-dim)" : "var(--border-2)" }} />
              ))}
            </div>
          </div>

          {/* Recruiter */}
          <div className="t-card p-5">
            <p className="micro-label mb-3">RECRUITER EYES</p>
            <p className="text-[13px] mb-3" style={{ color: "var(--text-2)" }}>3 recruiters viewed your work this week</p>
            <div className="flex -space-x-2 mb-3">
              {["ZP", "RA", "TC"].map((i, idx) => <div key={idx} className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: ["#6B21A8", "#0369A1", "#C2410C"][idx], border: "2px solid var(--surface)" }}>{i}</div>)}
            </div>
            <Link to="/app/alerts" className="text-[12px] font-semibold" style={{ color: "var(--brand)" }}>See who →</Link>
          </div>

          {/* Opportunities */}
          <div className="t-card p-5">
            <p className="micro-label mb-3">OPEN OPPORTUNITIES</p>
            <div className="space-y-3">
              {[{ title: "Rural Water Monitoring IoT", reward: "₹25,000", days: "12 days" }, { title: "AI Crop Disease Detection", reward: "₹50,000", days: "20 days" }, { title: "E-Governance Portal Redesign", reward: "₹30,000", days: "8 days" }].map(ch => (
                <div key={ch.title} className="pl-3" style={{ borderLeft: "3px solid #F59E0B" }}>
                  <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{ch.title}</p>
                  <div className="flex gap-2 text-[11px]" style={{ color: "var(--text-3)" }}><span className="font-bold" style={{ color: "#F59E0B" }}>{ch.reward}</span><span>·</span><span>{ch.days} left</span></div>
                </div>
              ))}
            </div>
            <Link to="/app/opportunities" className="block text-[12px] font-semibold mt-3" style={{ color: "var(--brand)" }}>View all →</Link>
          </div>

          {/* Suggested */}
          <div className="t-card p-5">
            <p className="micro-label mb-3">SUGGESTED CONNECTIONS</p>
            <div className="space-y-3">
              {[{ name: "Priya M.", role: "Faculty", initials: "PM", color: "#92400E" }, { name: "Rahul K.", role: "Professional", initials: "RK", color: "#0369A1" }, { name: "Dr. Neha S.", role: "Doctor", initials: "NS", color: "#0E7490" }].map(s => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: s.color }}>{s.initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{s.name}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{s.role}</p>
                  </div>
                  <Button variant="outline" size="xs" onClick={() => toast.success("Request sent")}>Connect</Button>
                </div>
              ))}
            </div>
            <Link to="/app/explore" className="block text-[12px] font-semibold mt-3" style={{ color: "var(--brand)" }}>See more →</Link>
          </div>
        </div>
      </div>

      <NewPostModal open={postModalOpen} onClose={() => setPostModalOpen(false)} defaultType={postModalType} />
    </div>
  );
};

export default Feed;
