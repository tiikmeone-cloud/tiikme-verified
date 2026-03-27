import { motion } from "framer-motion";
import { Image, MessageSquare, Repeat2, Bookmark, BarChart3, Zap, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock data
const posts = [
  {
    id: "1",
    author: { name: "Riya Sharma", initials: "RS", role: "Student", roleColor: "bg-electric/20 text-electric" },
    type: "Collab",
    typeColor: "text-electric",
    borderClass: "border-l-4 border-l-electric",
    content: "Looking for a backend developer to join our capstone project — building a telemedicine app for rural India. React Native + Supabase stack. 4th year CSE preferred.",
    time: "2h ago",
    reactions: { insightful: 4, useful: 12, inspiring: 2 },
    comments: 8,
  },
  {
    id: "2",
    author: { name: "Dr. Manoj Patil", initials: "MP", role: "Doctor", roleColor: "bg-teal/20 text-teal" },
    type: "Update",
    typeColor: "text-muted-foreground",
    borderClass: "",
    content: "Completed a 3-day health camp in Gadchiroli district. Screened 450+ patients for diabetes and hypertension. Partnering with local ANMs for follow-up. Adding this to my verified project log.",
    time: "4h ago",
    reactions: { insightful: 18, useful: 6, inspiring: 31 },
    comments: 14,
  },
  {
    id: "3",
    author: { name: "Sunita Devi", initials: "SD", role: "Skilled Trade", roleColor: "bg-warm-orange/20 text-warm-orange" },
    type: "Update",
    typeColor: "text-muted-foreground",
    borderClass: "border-l-4 border-l-amber",
    content: "Just finished rewiring an entire 3BHK flat in Dwarka. Complete with MCB panel upgrade and earthing. Client verified the work — photos on my project page.",
    time: "6h ago",
    reactions: { insightful: 7, useful: 22, inspiring: 15 },
    comments: 5,
  },
];

const PostCard = ({ post }: { post: typeof posts[0] }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`glass-card rounded-2xl p-5 ${post.borderClass}`}
  >
    {/* Header */}
    <div className="flex items-start gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
        {post.author.initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{post.author.name}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${post.author.roleColor}`}>
            {post.author.role}
          </span>
          {post.type !== "Update" && (
            <span className={`text-[10px] font-semibold ${post.typeColor}`}>
              {post.type}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{post.time}</p>
      </div>
    </div>

    {/* Content */}
    <p className="text-sm text-foreground/85 leading-relaxed mb-4">{post.content}</p>

    {/* Reactions */}
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      {Object.entries(post.reactions).map(([key, val]) => (
        <button
          key={key}
          className="text-xs px-3 py-1.5 rounded-full glass-card hover:bg-muted transition-all active:scale-[0.97] capitalize text-muted-foreground hover:text-foreground"
        >
          {key} · {val}
        </button>
      ))}
    </div>

    {/* Actions */}
    <div className="flex items-center gap-1 border-t border-border pt-3">
      <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
        <MessageSquare className="w-3.5 h-3.5" /> {post.comments}
      </Button>
      <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
        <Repeat2 className="w-3.5 h-3.5" /> Repost
      </Button>
      <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
        <Bookmark className="w-3.5 h-3.5" /> Save
      </Button>
    </div>
  </motion.div>
);

const Feed = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        {/* Main feed */}
        <div className="flex-1 max-w-2xl space-y-5">
          {/* Compose */}
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-electric/30 flex items-center justify-center text-xs font-bold text-electric">
                AK
              </div>
              <button className="flex-1 text-left text-sm text-muted-foreground bg-muted rounded-xl px-4 py-3 hover:bg-muted/80 transition-colors">
                What are you building today?
              </button>
            </div>
            <div className="flex items-center gap-2 ml-[52px]">
              {["Update", "Challenge", "Collab", "Photo"].map((type) => (
                <button
                  key={type}
                  className="text-xs px-3 py-1.5 rounded-full glass-card hover:bg-muted transition-all active:scale-[0.97] text-muted-foreground hover:text-foreground"
                >
                  {type === "Photo" && <Image className="w-3 h-3 inline mr-1" />}
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center">
            <span className="text-xs text-muted-foreground glass-card px-4 py-1.5 rounded-full">
              Today · {posts.length} new posts
            </span>
          </div>

          {/* Posts */}
          {posts.map((post, i) => (
            <PostCard key={post.id} post={{ ...post }} />
          ))}

          {/* Caught up */}
          <div className="flex items-center justify-center py-6">
            <span className="text-sm text-muted-foreground glass-card px-6 py-2 rounded-full">
              You're all caught up
            </span>
          </div>
        </div>

        {/* Right rail (desktop) */}
        <div className="hidden xl:block w-80 space-y-5 shrink-0">
          {/* Recruiter activity */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-coral" />
              <h3 className="text-sm font-semibold">Recruiter Activity</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">3 recruiters viewed your profile this week</p>
            <div className="flex -space-x-2">
              {["TCS", "INF", "WIP"].map((c) => (
                <div key={c} className="w-8 h-8 rounded-full bg-coral/20 border-2 border-background flex items-center justify-center text-[10px] font-bold text-coral">
                  {c}
                </div>
              ))}
            </div>
          </div>

          {/* Activity Score */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-electric" />
              <h3 className="text-sm font-semibold">Activity Score</h3>
              <span className="ml-auto text-lg font-display font-bold text-electric">72</span>
            </div>
            <div className="flex items-end gap-1 h-16">
              {[30, 45, 55, 40, 60, 50, 72, 65, 70, 68, 72, 72].map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${v}%` }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className={`flex-1 rounded-t ${i === 11 ? "bg-electric" : "bg-muted"}`}
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Last 12 weeks</p>
          </div>

          {/* Open Challenges */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber" />
              <h3 className="text-sm font-semibold">Open Challenges</h3>
            </div>
            <div className="space-y-3">
              {[
                { title: "Rural Water Monitoring IoT", reward: "₹25,000", deadline: "12 days" },
                { title: "AI-based Crop Disease Detection", reward: "₹50,000", deadline: "20 days" },
              ].map((ch) => (
                <div key={ch.title} className="text-sm">
                  <p className="font-medium text-foreground/90">{ch.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="text-amber font-semibold">{ch.reward}</span>
                    <span>·</span>
                    <span>{ch.deadline} left</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Strands */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-neon" />
              <h3 className="text-sm font-semibold">Suggested Strands</h3>
            </div>
            <div className="space-y-3">
              {[
                { name: "Priya M.", role: "Faculty", initials: "PM", color: "bg-amber/20 text-amber" },
                { name: "Rahul K.", role: "Professional", initials: "RK", color: "bg-liquid-blue/20 text-liquid-blue" },
              ].map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${s.color} flex items-center justify-center text-[10px] font-bold`}>
                    {s.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground">{s.role}</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs h-7 px-3">Connect</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;
