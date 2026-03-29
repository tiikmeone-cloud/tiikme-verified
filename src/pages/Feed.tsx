import { useState } from "react";
import { motion } from "framer-motion";
import { Image, MessageSquare, Repeat2, Bookmark, BarChart3, Zap, Users, TrendingUp, MoreHorizontal, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import NewPostModal from "@/components/NewPostModal";

const posts = [
  {
    id: "1",
    author: { name: "Riya Sharma", initials: "RS", role: "Student", roleColor: "#7C6FFF" },
    type: "Collab",
    borderColor: "#7C6FFF",
    content: "Looking for a backend developer to join our capstone project — building a telemedicine app for rural India. React Native + Supabase stack. 4th year CSE preferred.",
    time: "2h ago",
    reactions: { insightful: 4, useful: 12, inspiring: 2 },
    comments: 8,
  },
  {
    id: "2",
    author: { name: "Dr. Manoj Patil", initials: "MP", role: "Doctor", roleColor: "#26C6DA" },
    type: "Update",
    borderColor: "",
    content: "Completed a 3-day health camp in Gadchiroli district. Screened 450+ patients for diabetes and hypertension. Partnering with local ANMs for follow-up. Adding this to my verified project log.",
    time: "4h ago",
    reactions: { insightful: 18, useful: 6, inspiring: 31 },
    comments: 14,
  },
  {
    id: "3",
    author: { name: "Sunita Devi", initials: "SD", role: "Skilled Trade", roleColor: "#FFA726" },
    type: "Update",
    borderColor: "#FFB547",
    content: "Just finished rewiring an entire 3BHK flat in Dwarka. Complete with MCB panel upgrade and earthing. Client verified the work — photos on my project page.",
    time: "6h ago",
    reactions: { insightful: 7, useful: 22, inspiring: 15 },
    comments: 5,
  },
  {
    id: "4",
    author: { name: "Kavita Rao", initials: "KR", role: "HR / Recruiter", roleColor: "#FF6B6B" },
    type: "Challenge",
    borderColor: "#FF6B6B",
    content: "Posting a challenge: Build a dashboard that tracks real-time hiring pipeline for startups. Best solution gets ₹15,000 and a chance to join our product team.",
    time: "8h ago",
    reactions: { insightful: 24, useful: 18, inspiring: 9 },
    comments: 22,
  },
];

const PostCard = ({ post }: { post: typeof posts[0] }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [reacted, setReacted] = useState<Record<string, boolean>>({});

  const handleReaction = (key: string) => {
    setReacted(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5"
      style={{ borderLeft: post.borderColor ? `3px solid ${post.borderColor}` : undefined }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: post.author.roleColor }}>
          {post.author.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold">{post.author.name}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${post.author.roleColor}22`, color: post.author.roleColor }}>
              {post.author.role}
            </span>
            {post.type !== "Update" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full glass-card" style={{ color: post.borderColor }}>
                {post.type}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{post.time}</p>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors">
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 glass-card rounded-xl p-1 min-w-[140px] z-10">
              <button
                onClick={() => { toast.info("Report submitted"); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-[rgba(255,255,255,0.06)] rounded-lg transition-colors"
              >
                <Flag className="w-3 h-3" /> Report post
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm leading-[1.7] mb-4">{post.content}</p>

      {/* Reactions — toggleable */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {Object.entries(post.reactions).map(([key, val]) => (
          <button
            key={key}
            onClick={() => handleReaction(key)}
            className="text-xs px-3 py-1.5 rounded-full transition-all duration-200 active:scale-[0.97] capitalize"
            style={{
              background: reacted[key] ? "rgba(124,111,255,0.2)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${reacted[key] ? "#7C6FFF" : "rgba(255,255,255,0.12)"}`,
              color: reacted[key] ? "#F0F0FF" : "rgba(240,240,255,0.6)",
              boxShadow: reacted[key] ? "0 0 12px rgba(124,111,255,0.3)" : "none",
            }}
          >
            {key} · {val + (reacted[key] ? 1 : 0)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 border-t border-border pt-3">
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <MessageSquare className="w-3.5 h-3.5" /> {post.comments}
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => toast.success("Reposted")}>
          <Repeat2 className="w-3.5 h-3.5" /> Repost
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => toast.success("Saved")}>
          <Bookmark className="w-3.5 h-3.5" /> Save
        </Button>
      </div>
    </motion.div>
  );
};

const Feed = () => {
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postModalType, setPostModalType] = useState<string | undefined>();

  const openCompose = (type?: string) => {
    setPostModalType(type);
    setPostModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-[28px] font-bold mb-6">Feed</h1>
      <div className="flex gap-6">
        <div className="flex-1 max-w-2xl space-y-5">
          {/* Compose */}
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#7C6FFF] flex items-center justify-center text-xs font-bold text-white">
                AK
              </div>
              <button onClick={() => openCompose()} className="flex-1 text-left text-sm text-muted-foreground bg-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 hover:bg-[rgba(255,255,255,0.08)] transition-colors">
                What are you building today, Arjun?
              </button>
            </div>
            <div className="flex items-center gap-2 ml-[52px]">
              {[
                { label: "Project update", type: "Project update" },
                { label: "Challenge", type: "Challenge" },
                { label: "Need collaborator", type: "Seek collaborator" },
                { label: "Photo", type: "Photo" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => openCompose(item.type)}
                  className="text-xs px-3 py-1.5 rounded-full glass-card hover:bg-[rgba(255,255,255,0.08)] transition-all active:scale-[0.97] text-muted-foreground hover:text-foreground"
                >
                  {item.label === "Photo" && <Image className="w-3 h-3 inline mr-1" />}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <span className="text-xs text-muted-foreground glass-card px-4 py-1.5 rounded-full">
              Today · {posts.length} new posts
            </span>
          </div>

          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          <div className="flex items-center justify-center py-6">
            <span className="text-sm text-muted-foreground glass-card px-6 py-2.5 rounded-full">
              You're caught up · Showing older posts
            </span>
          </div>
        </div>

        {/* Right rail */}
        <div className="hidden xl:block w-80 space-y-5 shrink-0">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-coral" />
              <h3 className="text-sm font-bold">Recruiter Activity</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">3 recruiters viewed your profile this week</p>
            <div className="flex -space-x-2">
              {["TCS", "INF", "WIP"].map((c) => (
                <div key={c} className="w-8 h-8 rounded-full bg-[rgba(255,107,107,0.2)] border-2 border-background flex items-center justify-center text-[10px] font-bold text-coral">
                  {c}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <p className="micro-label text-muted-foreground/50 mb-2">Activity Score</p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-neon">78</span>
              <span className="text-xs text-muted-foreground">/ 100 this quarter</span>
            </div>
            <div className="flex items-end gap-1 h-16 mb-2">
              {[30, 45, 55, 40, 60, 50, 72, 65, 70, 68, 75, 78].map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${v}%` }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className={`flex-1 rounded-t ${v >= 70 ? "bg-neon" : v >= 50 ? "bg-electric" : "bg-[rgba(255,255,255,0.1)]"}`}
                />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">12-week rolling score</p>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber" />
              <h3 className="text-sm font-bold">Open Opportunities</h3>
            </div>
            <div className="space-y-3">
              {[
                { title: "Rural Water Monitoring IoT", reward: "₹25,000", deadline: "12 days" },
                { title: "AI Crop Disease Detection", reward: "₹50,000", deadline: "20 days" },
              ].map((ch) => (
                <div key={ch.title} className="text-sm">
                  <p className="font-medium">{ch.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="text-amber font-bold">{ch.reward}</span>
                    <span>·</span>
                    <span>{ch.deadline} left</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-neon" />
              <h3 className="text-sm font-bold">Suggested Strands</h3>
            </div>
            <div className="space-y-3">
              {[
                { name: "Priya M.", role: "Faculty", initials: "PM", color: "#FFB547" },
                { name: "Rahul K.", role: "Professional", initials: "RK", color: "#4FC3F7" },
              ].map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: s.color }}>
                    {s.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground">{s.role}</p>
                  </div>
                  <Button variant="outline" size="xs" onClick={() => toast.success("Connection request sent")}>Connect</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <NewPostModal open={postModalOpen} onClose={() => setPostModalOpen(false)} defaultType={postModalType} />
    </div>
  );
};

export default Feed;
