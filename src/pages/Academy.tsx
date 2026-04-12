import { useState, useEffect } from "react";
import { GraduationCap, Clock, Zap, CheckCircle, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { awardPower } from "@/lib/power";

const modules = [
  {
    id: "profile-hired",
    number: "01",
    title: "Build a Profile That Gets You Hired",
    duration: "8 min read",
    reward: 20,
    content: `## What HR Actually Looks For on Tiikme

When a recruiter opens your Tiikme profile, they spend an average of 12 seconds before deciding to dig deeper — or move on. Here's what catches their eye:

### 1. Your Headline (80 Characters That Matter)
Your headline appears everywhere: search results, post cards, Strand requests. Make it count.

**Bad:** "Student at DTU"
**Good:** "Final year CSE @ DTU · Building HealthTech apps for rural India"

The formula: **[Role] + [Context] + [What you're building/doing]**

### 2. Work Items vs Profile Bio
Your bio is the "who you are." Your Work Items are the "what you've done." Recruiters care more about Work Items — they're proof.

### 3. Activity Score
Your Activity Score (0–100) tells recruiters how active you are. A score above 60 means you're regularly building, posting, and engaging. Below 40? You look inactive.

### 4. Tiik Approved Badge
This is the gold standard. When your professor or manager verifies your work, it gets a gold shield badge. HR filters by this.`,
    quiz: [
      { q: "What's the ideal headline length?", options: ["20 chars", "80 chars", "200 chars", "No limit"], answer: 1 },
      { q: "What does Tiik Approved mean?", options: ["Self-verified", "Verified by institution head", "Paid feature", "Auto-generated"], answer: 1 },
      { q: "What score range shows you're active?", options: ["0-20", "20-40", "Above 60", "Exactly 100"], answer: 2 },
    ],
  },
  {
    id: "tiik-approved",
    number: "02",
    title: "How to Get Tiik Approved",
    duration: "6 min read",
    reward: 20,
    content: `## What Tiik Approval Means to Employers

The Tiik Approved badge (gold shield 🛡️) is the highest trust signal on Tiikme. It means a verified authority — your professor, manager, or institution head — has confirmed your work is genuine.

### How to Request Approval
1. Add a Work Item to your profile
2. Click "Get Tiik Approved" on the work item card
3. Enter your verifier's name and send them the verification link
4. They review and approve (or suggest edits)

### What Happens After Approval
- Gold shield badge appears on the work item
- Your Activity Score gets +25 points
- Your work appears first in HR search results
- Your profile gets the "Tiik Approved by [Institution]" chip

### Tips for Getting Approved
- Be specific about your contribution ("Led frontend development" not "Worked on project")
- Include links to live demos or repos
- Tag the right verifier — they should know your work firsthand`,
    quiz: [
      { q: "Who can give Tiik Approval?", options: ["Anyone", "Only students", "Verified authority (professor/manager)", "Tiikme staff"], answer: 2 },
      { q: "How many power points for Tiik Approved?", options: ["+5", "+10", "+25", "+50"], answer: 2 },
      { q: "Where does the gold badge appear?", options: ["Only on profile", "Only in search", "On the work item card", "Nowhere visible"], answer: 2 },
    ],
  },
  {
    id: "work-items",
    number: "03",
    title: "Writing Work Items That Get Noticed",
    duration: "10 min read",
    reward: 20,
    content: `## The 3-Sentence Formula

Every great work item description follows this pattern:
1. **What** — What did you build/do?
2. **How** — What tech/skills did you use?
3. **Impact** — What was the result?

**Example:** "Built a telemedicine platform for rural clinics using React Native and Supabase. Integrated AI triage to prioritise patients. Deployed to 12 clinics serving 4,000+ patients monthly."

### Which Projects to List First
- Most recent and relevant to your target role
- Projects with Tiik Approval get priority
- Active projects show you're currently building

### Domain Tags and Skills
Tag your work with the right domain (HealthTech, FinTech, EdTech, etc.) and tech stack. HR filters by these.

### The Visibility Toggle
- **Public**: Everyone can see it, including recruiters
- **Connections**: Only your Strands can see
- **Private**: Only you can see (drafts)`,
    quiz: [
      { q: "What's the 3-sentence formula?", options: ["Name, Date, Link", "What, How, Impact", "Title, Description, Tags", "Who, Where, When"], answer: 1 },
      { q: "Which projects should be listed first?", options: ["Oldest", "Most recent and relevant", "Alphabetical", "Random"], answer: 1 },
      { q: "What visibility shows work to recruiters?", options: ["Private", "Connections", "Public", "Hidden"], answer: 2 },
    ],
  },
  {
    id: "hr-perspective",
    number: "04",
    title: "How Companies Search Tiikme",
    duration: "7 min read",
    reward: 20,
    content: `## The HR Perspective

When a recruiter opens Tiikme Explore, here's their typical workflow:

### 1. Filter by Role + Domain
They select "Professional" or "Student" and pick a domain like "Engineering" or "Finance."

### 2. Sort by Signal Strength
Results are sorted by:
- Power level (Diamond → Builder)
- Activity Score
- Tiik Approved items count
- Profile completeness

### 3. Quick Scan
For each profile, they look at:
- Headline (does it match the role?)
- Top work item (is it relevant?)
- Tiik Approved badge (trust signal)
- Activity Score (is this person active?)

### How to Get Found
- Complete your profile (all fields)
- Add at least 2 work items
- Get at least 1 Tiik Approved
- Post weekly to keep Activity Score up
- Use relevant domain tags`,
    quiz: [
      { q: "What do HR filter by first?", options: ["Name", "Role + Domain", "Photo", "Bio length"], answer: 1 },
      { q: "What's the strongest trust signal?", options: ["High post count", "Many strands", "Tiik Approved badge", "Premium account"], answer: 2 },
      { q: "How often should you post to stay visible?", options: ["Daily", "Weekly", "Monthly", "Never"], answer: 1 },
    ],
  },
  {
    id: "workspaces",
    number: "05",
    title: "Workspaces — Build Your Team's Proof of Work",
    duration: "8 min read",
    reward: 20,
    content: `## Why Your Team Needs a Workspace

A Workspace is your team's shared profile on Tiikme. It's where projects, achievements, and discussions live together.

### How Workspace Achievements Link to Profiles
When your Workspace earns an achievement (e.g., "Won Smart India Hackathon"), it appears on every member's individual profile too. Collective wins = individual credibility.

### What to Post in Workspaces
- **Achievements**: "We won X" or "We shipped Y"
- **Updates**: Progress reports, sprint summaries
- **Discussions**: Technical debates, brainstorms

### Workspace Posts → Public Feed
When you toggle "Share to Feed," workspace posts appear in the public feed with your workspace name. This gets your team visibility.

### Types of Workspaces
- **Project**: For a specific project (capstone, startup, research)
- **Club**: For college clubs, communities
- **Department**: For institutional departments`,
    quiz: [
      { q: "What happens when a Workspace earns an achievement?", options: ["Nothing", "Only admin sees it", "It appears on all members' profiles", "It's deleted"], answer: 2 },
      { q: "How do workspace posts reach the public feed?", options: ["Automatically", "Toggle 'Share to Feed'", "Pay for promotion", "They can't"], answer: 1 },
      { q: "What are the workspace types?", options: ["Free, Premium, Enterprise", "Project, Club, Department", "Small, Medium, Large", "Public, Private"], answer: 1 },
    ],
  },
];

const Academy = () => {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from("academy_progress" as any).select("module_id").eq("user_id", user.id).eq("completed", true);
      if (data) setCompleted(new Set((data as any[]).map(d => d.module_id)));
    };
    load();
  }, []);

  const mod = modules.find(m => m.id === activeModule);

  const handleQuizSubmit = async () => {
    if (!mod || !userId) return;
    const correct = mod.quiz.filter((q, i) => quizAnswers[i] === q.answer).length;
    if (correct >= 2) {
      await supabase.from("academy_progress" as any).upsert({
        user_id: userId,
        module_id: mod.id,
        completed: true,
        score: correct,
        completed_at: new Date().toISOString(),
      }, { onConflict: "user_id,module_id" });
      await awardPower(userId, mod.reward, `Completed Academy: ${mod.title}`, mod.id, "academy");
      setCompleted(prev => new Set([...prev, mod.id]));
      toast.success(`+${mod.reward} power earned! Module complete ✓`);
      setActiveModule(null);
      setShowQuiz(false);
      setQuizAnswers([]);
    } else {
      toast.error(`${correct}/3 correct. You need 2/3 to pass. Try again!`);
    }
  };

  const totalCompleted = completed.size;
  const totalPowerEarned = totalCompleted * 20;

  if (mod) {
    return (
      <main className="max-w-[720px] mx-auto px-4 md:px-6 py-7">
        <button type="button" onClick={() => { setActiveModule(null); setShowQuiz(false); setQuizAnswers([]); }}
          className="text-[13px] font-semibold mb-4 cursor-pointer flex items-center gap-1" style={{ color: "var(--brand)" }}>
          ← Back to Academy
        </button>
        <div className="t-card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>Module {mod.number}</span>
            <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-3)" }}><Clock className="w-3 h-3" />{mod.duration}</span>
            <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: "#F59E0B" }}><Zap className="w-3 h-3" />+{mod.reward}</span>
          </div>
          <h1 className="text-[24px] font-extrabold mb-6" style={{ color: "var(--text-1)" }}>{mod.title}</h1>

          {!showQuiz ? (
            <>
              <div className="prose max-w-none text-[14px] leading-[1.8]" style={{ color: "var(--text-2)" }}>
                {mod.content.split("\n").map((line, i) => {
                  if (line.startsWith("## ")) return <h2 key={i} className="text-[18px] font-extrabold mt-6 mb-3" style={{ color: "var(--text-1)" }}>{line.slice(3)}</h2>;
                  if (line.startsWith("### ")) return <h3 key={i} className="text-[15px] font-bold mt-4 mb-2" style={{ color: "var(--text-1)" }}>{line.slice(4)}</h3>;
                  if (line.startsWith("**Bad:**")) return <p key={i} className="px-3 py-2 rounded-lg mb-1" style={{ background: "rgba(220,38,38,0.08)", color: "var(--text-2)" }}>{line}</p>;
                  if (line.startsWith("**Good:**")) return <p key={i} className="px-3 py-2 rounded-lg mb-1" style={{ background: "rgba(16,185,129,0.08)", color: "var(--text-2)" }}>{line}</p>;
                  if (line.startsWith("**Example:**")) return <p key={i} className="px-3 py-2 rounded-lg mb-2 italic" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>{line}</p>;
                  if (line.startsWith("- ")) return <p key={i} className="ml-4 mb-1">• {line.slice(2)}</p>;
                  if (line.trim() === "") return <br key={i} />;
                  return <p key={i} className="mb-2">{line}</p>;
                })}
              </div>
              {completed.has(mod.id) ? (
                <div className="mt-8 p-4 rounded-xl flex items-center gap-3" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <CheckCircle className="w-5 h-5" style={{ color: "#10B981" }} />
                  <span className="text-[14px] font-bold" style={{ color: "#10B981" }}>Module completed ✓</span>
                </div>
              ) : (
                <Button className="mt-8 w-full" size="lg" onClick={() => setShowQuiz(true)}>
                  Complete this module <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <h2 className="text-[18px] font-extrabold" style={{ color: "var(--text-1)" }}>Quick Quiz (2/3 to pass)</h2>
              {mod.quiz.map((q, qi) => (
                <div key={qi} className="p-4 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <p className="text-[14px] font-bold mb-3" style={{ color: "var(--text-1)" }}>{qi + 1}. {q.q}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <button type="button" key={oi} onClick={() => { const a = [...quizAnswers]; a[qi] = oi; setQuizAnswers(a); }}
                        className="w-full text-left px-3 py-2.5 rounded-lg text-[13px] cursor-pointer transition-all"
                        style={{
                          background: quizAnswers[qi] === oi ? "var(--brand-dim)" : "transparent",
                          border: quizAnswers[qi] === oi ? "1px solid var(--brand)" : "1px solid var(--border)",
                          color: quizAnswers[qi] === oi ? "var(--brand)" : "var(--text-2)",
                          fontWeight: quizAnswers[qi] === oi ? 700 : 400,
                        }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <Button className="w-full" size="lg" onClick={handleQuizSubmit}
                disabled={quizAnswers.filter(a => a !== undefined).length < 3}>
                Submit answers
              </Button>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[960px] mx-auto px-4 md:px-6 py-7">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--brand-dim)" }}>
          <GraduationCap className="w-8 h-8" style={{ color: "var(--brand)" }} />
        </div>
        <h1 className="text-[28px] font-extrabold mb-2" style={{ color: "var(--text-1)" }}>Tiikme Academy</h1>
        <p className="text-[14px]" style={{ color: "var(--text-2)" }}>Learn how to stand out. Earn power. Get noticed.</p>
        <p className="text-[13px] font-semibold mt-1" style={{ color: "#F59E0B" }}>Complete a module to earn +20 power ⚡</p>
      </div>

      {/* Progress bar */}
      <div className="t-card p-4 mb-6 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{totalCompleted} of {modules.length} completed</span>
            <span className="text-[12px] font-bold" style={{ color: "#F59E0B" }}>{totalPowerEarned} power earned</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(totalCompleted / modules.length) * 100}%`, background: "var(--brand)" }} />
          </div>
        </div>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map(m => {
          const done = completed.has(m.id);
          return (
            <button type="button" key={m.id} onClick={() => setActiveModule(m.id)}
              className="t-card t-card-hover p-5 text-left cursor-pointer active:scale-[0.98] transition-all"
              style={{ borderTop: done ? "3px solid #10B981" : "3px solid var(--brand)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[32px] font-extrabold" style={{ color: "var(--brand)", opacity: 0.15 }}>{m.number}</span>
                {done ? (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>
                    <CheckCircle className="w-3 h-3" /> Done
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
                    <Zap className="w-3 h-3" /> +{m.reward}
                  </span>
                )}
              </div>
              <h3 className="text-[14px] font-bold mb-1" style={{ color: "var(--text-1)" }}>{m.title}</h3>
              <p className="text-[12px] flex items-center gap-1" style={{ color: "var(--text-3)" }}>
                <Clock className="w-3 h-3" /> {m.duration}
              </p>
            </button>
          );
        })}
      </div>
    </main>
  );
};

export default Academy;
