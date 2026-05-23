// src/components/org/CompanyBrain.tsx
// Company Brain tab — works for ALL org types with renamed labels
// Tech, Hospital, College, BCCI, Railways/TGNPDCL, NGO, YouTube, Restaurant

import React, { useState, useEffect } from "react";
import { Star, TrendingUp, DollarSign, HelpCircle, Plus, Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface BrainConfig {
  ratingLabels: string[];
  insightsLabel: string;
  insightsDescription: string;
  qaPlaceholder: string;
  showSalary: boolean;
  salaryUnit: string;
}

const BRAIN_CONFIGS: Record<string, BrainConfig> = {
  tech: {
    ratingLabels: ["Work-Life Balance", "Career Growth", "Management", "Compensation", "Culture"],
    insightsLabel: "Salary Insights",
    insightsDescription: "Anonymous salary data from verified employees",
    qaPlaceholder: "Ask about WFH policy, interview process, team culture, benefits...",
    showSalary: true,
    salaryUnit: "LPA",
  },
  startup: {
    ratingLabels: ["Work-Life Balance", "Career Growth", "Management", "Equity/Comp", "Culture"],
    insightsLabel: "Salary & Equity",
    insightsDescription: "Salary and equity ranges from verified employees",
    qaPlaceholder: "Ask about equity, culture, growth trajectory, interview process...",
    showSalary: true,
    salaryUnit: "LPA",
  },
  hospital: {
    ratingLabels: ["Patient Care Culture", "Staff Support", "Work Hours", "Compensation", "Management"],
    insightsLabel: "Staff Insights",
    insightsDescription: "Pay and conditions by role from verified staff",
    qaPlaceholder: "Ask about OPD timing, staff facilities, duty hours, transfer policy...",
    showSalary: true,
    salaryUnit: "LPA",
  },
  college: {
    ratingLabels: ["Academics", "Placements", "Faculty Quality", "Infrastructure", "Campus Life"],
    insightsLabel: "Placement Insights",
    insightsDescription: "Placement stats by branch and year from verified alumni",
    qaPlaceholder: "Ask about placements, hostel, faculty, fees, campus life...",
    showSalary: true,
    salaryUnit: "LPA",
  },
  school: {
    ratingLabels: ["Teaching Quality", "Management", "Facilities", "Extracurriculars", "Fee Value"],
    insightsLabel: "Staff Pay",
    insightsDescription: "Staff salary ranges from verified employees",
    qaPlaceholder: "Ask about admissions, teachers, facilities, curriculum...",
    showSalary: false,
    salaryUnit: "LPA",
  },
  sports: {
    ratingLabels: ["Training Quality", "Coaching Staff", "Facilities", "Team Culture", "Opportunities"],
    insightsLabel: "Contract & Stipend Info",
    insightsDescription: "Pay and contract info from verified athletes",
    qaPlaceholder: "Ask about trials, selection process, training schedule, facilities...",
    showSalary: true,
    salaryUnit: "LPA",
  },
  government: {
    ratingLabels: ["Work Environment", "Job Security", "Growth Opportunities", "Leadership", "Compensation"],
    insightsLabel: "Pay Scale Insights",
    insightsDescription: "Government pay scale data by grade/cadre from verified employees",
    qaPlaceholder: "Ask about transfer policy, promotions, workload, departmental culture...",
    showSalary: true,
    salaryUnit: "LPA",
  },
  ngo: {
    ratingLabels: ["Impact Culture", "Team Support", "Leadership", "Work Flexibility", "Mission Alignment"],
    insightsLabel: "Volunteer Opportunities",
    insightsDescription: "What volunteers and staff say about their experience",
    qaPlaceholder: "Ask about volunteer roles, causes, operations, how to join...",
    showSalary: false,
    salaryUnit: "LPA",
  },
  creator: {
    ratingLabels: [],
    insightsLabel: "Collaboration Info",
    insightsDescription: "What collaborators say about working with this creator",
    qaPlaceholder: "Ask about upload schedule, brand deal rates, collaboration opportunities...",
    showSalary: false,
    salaryUnit: "LPA",
  },
  food: {
    ratingLabels: ["Work Environment", "Pay & Tips", "Growth", "Management", "Schedule Flexibility"],
    insightsLabel: "Salary Insights",
    insightsDescription: "Pay info by role from verified staff",
    qaPlaceholder: "Ask about shifts, kitchen culture, benefits, training...",
    showSalary: true,
    salaryUnit: "LPA",
  },
};

const getConfig = (orgType?: string | null): BrainConfig => {
  if (!orgType) return BRAIN_CONFIGS.tech;
  const t = orgType.toLowerCase();
  if (t.includes("hospital") || t.includes("clinic") || t.includes("health")) return BRAIN_CONFIGS.hospital;
  if (t.includes("college") || t.includes("university") || t.includes("iit") || t.includes("iim")) return BRAIN_CONFIGS.college;
  if (t.includes("school")) return BRAIN_CONFIGS.school;
  if (t.includes("sport") || t.includes("club") || t.includes("team") || t.includes("bcci") || t.includes("isl")) return BRAIN_CONFIGS.sports;
  if (t.includes("govt") || t.includes("government") || t.includes("ministry") || t.includes("railways") || t.includes("npdcl") || t.includes("ias") || t.includes("psu")) return BRAIN_CONFIGS.government;
  if (t.includes("ngo") || t.includes("foundation") || t.includes("trust") || t.includes("volunteer")) return BRAIN_CONFIGS.ngo;
  if (t.includes("creator") || t.includes("youtube") || t.includes("channel") || t.includes("media")) return BRAIN_CONFIGS.creator;
  if (t.includes("food") || t.includes("restaurant") || t.includes("cafe")) return BRAIN_CONFIGS.food;
  if (t.includes("startup")) return BRAIN_CONFIGS.startup;
  return BRAIN_CONFIGS.tech;
};

interface RatingSummary {
  rating_overall: number;
  rating_work_life: number;
  rating_growth: number;
  rating_management: number;
  rating_compensation: number;
  rating_culture: number;
  total: number;
}

interface SalaryInsight {
  job_title: string;
  salary_min: number;
  salary_max: number;
  count: number;
}

interface FAQ {
  id: string;
  question: string;
  answer: string | null;
  is_official_answer: boolean;
  upvote_count: number;
  created_at: string;
}

interface CompanyBrainProps {
  orgId: string;
  orgType?: string | null;
  orgName: string;
  isAdmin?: boolean;
}

export function CompanyBrain({ orgId, orgType, orgName, isAdmin }: CompanyBrainProps) {
  const { user } = useAuth();
  const config = getConfig(orgType);
  const [activeTab, setActiveTab] = useState<"overview" | "salaries" | "qa">("overview");
  const [ratings, setRatings] = useState<RatingSummary | null>(null);
  const [salaries, setSalaries] = useState<SalaryInsight[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showAskModal, setShowAskModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      // Load culture ratings summary
      const { data: ratingData } = await supabase
        .from("org_culture_ratings")
        .select("rating_overall, rating_work_life, rating_growth, rating_management, rating_compensation, rating_culture")
        .eq("org_id", orgId)
        .eq("status", "approved");

      // Load salary insights (group by job title)
      const { data: salaryData } = await supabase
        .from("org_salary_insights")
        .select("job_title, salary_min, salary_max")
        .eq("org_id", orgId)
        .eq("status", "approved");

      // Load FAQs
      const { data: faqData } = await supabase
        .from("org_faqs")
        .select("id, question, answer, is_official_answer, upvote_count, created_at")
        .eq("org_id", orgId)
        .neq("status", "removed")
        .order("upvote_count", { ascending: false })
        .limit(20);

      if (!cancelled) {
        // Aggregate ratings
        if (ratingData && ratingData.length > 0) {
          const avg = (key: string) =>
            Number((ratingData.reduce((sum, r: any) => sum + (r[key] || 0), 0) / ratingData.length).toFixed(1));
          setRatings({
            rating_overall: avg("rating_overall"),
            rating_work_life: avg("rating_work_life"),
            rating_growth: avg("rating_growth"),
            rating_management: avg("rating_management"),
            rating_compensation: avg("rating_compensation"),
            rating_culture: avg("rating_culture"),
            total: ratingData.length,
          });
        }

        // Group salaries by job title
        if (salaryData && salaryData.length > 0) {
          const byTitle: Record<string, { mins: number[]; maxes: number[]; count: number }> = {};
          salaryData.forEach((s: any) => {
            if (!byTitle[s.job_title]) byTitle[s.job_title] = { mins: [], maxes: [], count: 0 };
            byTitle[s.job_title].mins.push(s.salary_min);
            byTitle[s.job_title].maxes.push(s.salary_max);
            byTitle[s.job_title].count++;
          });
          setSalaries(
            Object.entries(byTitle)
              .filter(([, v]) => v.count >= 1)
              .map(([title, v]) => ({
                job_title: title,
                salary_min: Math.min(...v.mins),
                salary_max: Math.max(...v.maxes),
                count: v.count,
              }))
              .sort((a, b) => b.count - a.count)
          );
        }

        if (faqData) setFaqs(faqData as FAQ[]);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [orgId]);

  const askQuestion = async () => {
    if (!user) { toast.error("Sign in to ask a question"); return; }
    const q = newQuestion.trim();
    if (!q) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("org_faqs").insert({
        org_id: orgId,
        question: q,
        asked_by: user.id,
        is_anonymous: false,
        status: "open",
      });
      if (error) throw error;
      setNewQuestion("");
      setShowAskModal(false);
      toast.success("Question posted!");
      // Reload FAQs
      const { data } = await supabase.from("org_faqs")
        .select("id, question, answer, is_official_answer, upvote_count, created_at")
        .eq("org_id", orgId).neq("status", "removed")
        .order("upvote_count", { ascending: false }).limit(20);
      if (data) setFaqs(data as FAQ[]);
    } catch {
      toast.error("Could not post question. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatLPA = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
    return `₹${n}`;
  };

  const getRatingLabel = (index: number) => config.ratingLabels[index] || `Rating ${index + 1}`;

  const ratingValues = ratings
    ? [
        ratings.rating_work_life,
        ratings.rating_growth,
        ratings.rating_management,
        ratings.rating_compensation,
        ratings.rating_culture,
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base">Company Brain</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Powered by verified members · All data is anonymized
          </p>
        </div>
        <div className="flex gap-2">
          {user && config.ratingLabels.length > 0 && (
            <button
              onClick={() => setShowRateModal(true)}
              className="flex items-center gap-1.5 text-xs text-[#E8733A] hover:bg-[#FFF3EC] px-3 py-1.5 rounded-lg border border-[#E8733A]/30"
            >
              <Star size={12} /> Rate
            </button>
          )}
          {user && config.showSalary && (
            <button
              onClick={() => setShowSalaryModal(true)}
              className="flex items-center gap-1.5 text-xs text-[#E8733A] hover:bg-[#FFF3EC] px-3 py-1.5 rounded-lg border border-[#E8733A]/30"
            >
              <DollarSign size={12} /> Add salary
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-100">
        {(["overview", ...(config.showSalary ? ["salaries"] : []), "qa"] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t as any)}
            className={`px-4 py-2.5 text-sm capitalize transition-colors border-b-2 -mb-[1px] ${
              activeTab === t
                ? "text-[#E8733A] border-[#E8733A] font-medium"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            {t === "qa" ? "Q&A" : t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {ratings && ratings.total > 0 && config.ratingLabels.length > 0 ? (
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-[#E8733A]">{ratings.rating_overall}</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={12} className={i <= Math.round(ratings.rating_overall) ? "fill-[#E8733A] text-[#E8733A]" : "text-gray-300"} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{ratings.total} ratings</p>
                </div>
                <div className="flex-1 space-y-2">
                  {ratingValues.map((val, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-28 flex-shrink-0 truncate">{getRatingLabel(i)}</span>
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#E8733A] rounded-full"
                          style={{ width: `${(val / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 w-6 text-right">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Star size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm">No ratings yet</p>
              <p className="text-xs mt-1">
                {user ? "Be the first to rate" : "Sign in to rate this organization"}
              </p>
              {user && config.ratingLabels.length > 0 && (
                <button
                  onClick={() => setShowRateModal(true)}
                  className="mt-3 text-xs text-[#E8733A] hover:underline"
                >
                  Add rating →
                </button>
              )}
            </div>
          )}

          {/* Quick Q&A preview */}
          {faqs.filter(f => f.answer).length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Recent Q&A</p>
              {faqs.filter(f => f.answer).slice(0, 2).map(faq => (
                <div key={faq.id} className="bg-white border border-gray-100 rounded-xl p-3 mb-2">
                  <p className="text-sm font-medium text-gray-800">{faq.question}</p>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                    {faq.answer}
                    {faq.is_official_answer && (
                      <span className="ml-1 text-[#E8733A] font-medium">— {orgName} (official)</span>
                    )}
                  </p>
                </div>
              ))}
              <button
                onClick={() => setActiveTab("qa")}
                className="text-xs text-[#E8733A] hover:underline"
              >
                View all Q&A →
              </button>
            </div>
          )}

          {/* Verification note */}
          <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
            <Lock size={12} className="flex-shrink-0 mt-0.5" />
            <p>All culture ratings and salary data come from TiikVerified employees and members only. Individual responses are never shown — only aggregated, anonymized insights.</p>
          </div>
        </div>
      )}

      {/* Salaries tab */}
      {activeTab === "salaries" && config.showSalary && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{config.insightsLabel}</p>
              <p className="text-xs text-gray-400 mt-0.5">{config.insightsDescription}</p>
            </div>
            {user && (
              <button
                onClick={() => setShowSalaryModal(true)}
                className="text-xs text-[#E8733A] hover:bg-[#FFF3EC] px-3 py-1.5 rounded-lg border border-[#E8733A]/30"
              >
                + Add yours
              </button>
            )}
          </div>

          {salaries.length > 0 ? (
            <div className="space-y-2">
              {salaries.map(s => (
                <div key={s.job_title} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.job_title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.count} submission{s.count !== 1 ? "s" : ""}</p>
                  </div>
                  <p className="text-sm font-semibold text-[#E8733A]">
                    {formatLPA(s.salary_min)}–{formatLPA(s.salary_max)}{" "}
                    <span className="text-xs font-normal text-gray-400">{config.salaryUnit}</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <TrendingUp size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm">No salary data yet</p>
              <p className="text-xs mt-1">Min 3 submissions needed to show data</p>
              {user && (
                <button
                  onClick={() => setShowSalaryModal(true)}
                  className="mt-3 text-xs text-[#E8733A] hover:underline"
                >
                  Be the first to contribute →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Q&A tab */}
      {activeTab === "qa" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Community Q&A — anyone can ask, verified members answer</p>
            {user && (
              <button
                onClick={() => setShowAskModal(true)}
                className="flex items-center gap-1.5 text-xs text-[#E8733A] hover:bg-[#FFF3EC] px-3 py-1.5 rounded-lg border border-[#E8733A]/30"
              >
                <Plus size={12} /> Ask
              </button>
            )}
          </div>

          {faqs.length > 0 ? (
            faqs.map(faq => (
              <div key={faq.id} className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-800">{faq.question}</p>
                {faq.answer ? (
                  <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-600 leading-relaxed">{faq.answer}</p>
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      {faq.is_official_answer
                        ? <span className="text-[#E8733A] font-medium">{orgName} (Official Response)</span>
                        : "TiikVerified member"}
                    </p>
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="text-xs text-gray-400 italic">No answer yet</p>
                    {user && isAdmin && (
                      <button className="mt-1 text-xs text-[#E8733A] hover:underline">
                        Answer as {orgName}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <HelpCircle size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm">No questions yet</p>
              <p className="text-xs mt-1">{config.qaPlaceholder}</p>
              {user && (
                <button
                  onClick={() => setShowAskModal(true)}
                  className="mt-3 text-xs text-[#E8733A] hover:underline"
                >
                  Ask the first question →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Ask question modal */}
      {showAskModal && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowAskModal(false)} />
          <div className="fixed inset-x-4 top-32 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[480px] bg-white rounded-2xl shadow-xl z-50 border border-gray-100 p-5">
            <h3 className="font-semibold mb-3">Ask a question about {orgName}</h3>
            <textarea
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              placeholder={config.qaPlaceholder}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#E8733A] resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 justify-end mt-3">
              <button onClick={() => setShowAskModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
                Cancel
              </button>
              <button
                onClick={askQuestion}
                disabled={!newQuestion.trim() || submitting}
                className="px-4 py-2 text-sm bg-[#E8733A] text-white rounded-xl hover:bg-[#d4632e] disabled:opacity-40 flex items-center gap-1.5"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Post question
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
