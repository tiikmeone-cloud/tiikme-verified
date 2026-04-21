/**
 * Single source of truth for the 9-role taxonomy used by the new
 * /onboarding wizard. Keep this in sync with:
 *   - profiles_role_check  (DB constraint, 9 values)
 *   - src/lib/roleSubtypes.ts (legacy helper still used by Profile edit)
 *
 * The old roles (government, hr, skilled_trade, builder, aspirant) are
 * gone — do NOT add them back here.
 *
 * Every dropdown ends with "Other" → the UI reveals a free-text input and
 * saves the verbatim string into the SAME DB column.
 */

import {
  GraduationCap, Briefcase, Rocket, Wrench, Video,
  Stethoscope, Microscope, BookOpen, Landmark,
  type LucideIcon,
} from "lucide-react";

export type Role =
  | "student" | "professional" | "founder" | "freelancer" | "creator"
  | "doctor" | "researcher" | "faculty" | "investor";

export interface RoleDef {
  id: Role;
  label: string;
  desc: string;
  icon: LucideIcon;
  /** Step 2 dropdown label (exact copy per spec). */
  subtypeLabel: string;
  /** Step 2 dropdown options. Always ends with "Other". */
  subtypes: string[];
}

export const ROLES: RoleDef[] = [
  {
    id: "student", label: "Student",
    desc: "School, college, university, postgrad",
    icon: GraduationCap,
    subtypeLabel: "What are you studying?",
    subtypes: [
      "Undergraduate — BTech/BE", "Undergraduate — BSc", "Undergraduate — BA",
      "Undergraduate — BCom", "Undergraduate — BBA", "Undergraduate — LLB",
      "Undergraduate — MBBS", "Undergraduate — BDS", "Undergraduate — BArch",
      "Undergraduate — BFA", "Undergraduate — BPharm", "Undergraduate — Other",
      "Postgraduate — MTech/ME", "Postgraduate — MSc", "Postgraduate — MA",
      "Postgraduate — MCom", "Postgraduate — MBA", "Postgraduate — LLM",
      "Postgraduate — MD/MS", "Postgraduate — MDS", "Postgraduate — MCA",
      "Postgraduate — MFA", "Postgraduate — Other",
      "PhD / Doctorate", "Post-doc",
      "Diploma / Polytechnic", "Certificate course", "Coding bootcamp",
      "Preparing for — UPSC", "Preparing for — CAT", "Preparing for — GATE",
      "Preparing for — GRE", "Preparing for — GMAT", "Preparing for — NEET",
      "Preparing for — JEE", "Preparing for — CLAT", "Preparing for — CA",
      "Preparing for — CFA", "Preparing for — Banking", "Preparing for — SSC",
      "Preparing for — TNPSC/state PSC", "Preparing for — Other exam",
      "Gap year", "Self-taught", "Other",
    ],
  },
  {
    id: "professional", label: "Professional",
    desc: "Employed, full-time or part-time",
    icon: Briefcase,
    subtypeLabel: "What field?",
    subtypes: [
      "Software Engineering — Frontend", "Software Engineering — Backend",
      "Software Engineering — Full-stack", "Software Engineering — Mobile",
      "Software Engineering — DevOps/SRE", "Software Engineering — ML/AI",
      "Software Engineering — Data",
      "Product Management", "Product Design", "UX Research", "UI Design",
      "Brand Design", "Motion Design", "Illustration",
      "Data Analytics", "Data Science", "Data Engineering", "Business Intelligence",
      "Marketing — Growth", "Marketing — Performance", "Marketing — Content",
      "Marketing — Brand", "Marketing — SEO", "Marketing — Social media",
      "Marketing — Community",
      "Sales — Inside sales", "Sales — Field sales", "Sales — Enterprise",
      "Sales — Solutions", "Business Development",
      "Operations", "Supply chain", "Logistics", "Manufacturing", "Quality", "Procurement",
      "Finance — Accounting", "Finance — FP&A", "Finance — Treasury",
      "Finance — Audit", "Tax",
      "HR — Generalist", "HR — Talent acquisition", "HR — L&D", "HR — People ops",
      "Legal — Corporate", "Legal — Litigation", "Legal — IP", "Company Secretary",
      "Consulting — Strategy", "Consulting — Management", "Consulting — Tech",
      "Customer Success", "Customer Support", "Technical Support",
      "Content — Editorial", "Content — Copywriting", "Content — Scriptwriting", "Translation",
      "Healthcare — Nursing", "Healthcare — Pharmacist", "Healthcare — Lab tech", "Healthcare — Admin",
      "Education — School teacher", "Education — College lecturer",
      "Education — Coaching", "Education — EdTech",
      "Government — Civil services", "Government — PSU", "Government — Defence",
      "Government — Policy/think-tank",
      "Hospitality", "Retail", "Real estate", "Media & Journalism", "Advertising",
      "Architecture", "Civil engineering", "Mechanical engineering",
      "Electrical engineering", "Chemical engineering", "Agriculture",
      "Social work / NGO", "Other",
    ],
  },
  {
    id: "founder", label: "Founder",
    desc: "Building or running a company, any stage",
    icon: Rocket,
    subtypeLabel: "Stage",
    subtypes: [
      "Idea", "Building MVP", "Launched (pre-revenue)",
      "Pre-seed", "Seed", "Series A", "Series B", "Series C+",
      "Growth", "Profitable / Bootstrapped",
      "Acquired", "Shut down", "Other",
    ],
  },
  {
    id: "freelancer", label: "Freelancer / Independent",
    desc: "Contractor, consultant, self-employed",
    icon: Wrench,
    subtypeLabel: "Primary service",
    subtypes: [
      "Web design", "Web development", "Mobile app development",
      "Backend/API development", "DevOps",
      "UI/UX design", "Brand & logo design", "Graphic design",
      "Illustration", "3D / motion", "Animation",
      "Video editing", "Cinematography", "Photography", "Sound design", "Podcasting",
      "Copywriting", "Content writing", "Technical writing",
      "Translation", "Subtitling", "Editing & proofreading",
      "Marketing strategy", "SEO", "Social media management",
      "Paid ads management", "Email marketing", "Community management",
      "Consulting — Business", "Consulting — Product", "Consulting — Tech",
      "Consulting — HR", "Consulting — Legal", "Consulting — Finance",
      "Accounting & bookkeeping", "Tax filing", "CA services", "CS services",
      "Legal drafting", "Contract review",
      "Tutoring — Academic", "Tutoring — Test prep", "Tutoring — Language",
      "Tutoring — Music", "Tutoring — Dance", "Tutoring — Sports",
      "Voice-over", "Acting", "Modelling", "Event management",
      "Wedding planning", "Interior design", "Architecture services",
      "Data entry", "Transcription", "Virtual assistance", "Customer support", "Other",
    ],
  },
  {
    id: "creator", label: "Creator",
    desc: "Content, media, design, writing, video",
    icon: Video,
    subtypeLabel: "Primary platform",
    subtypes: [
      "YouTube — Long-form", "YouTube — Shorts",
      "Instagram — Reels", "Instagram — Posts/Static", "Instagram — Stories",
      "LinkedIn — Posts", "LinkedIn — Newsletter",
      "X / Twitter", "Threads", "Bluesky",
      "Substack", "Ghost", "Medium", "Personal blog",
      "Podcast — Audio", "Podcast — Video",
      "TikTok", "Moj", "Chingari",
      "Twitch", "Kick", "Discord",
      "Snapchat", "Pinterest", "Reddit",
      "Multi-platform", "Other",
    ],
  },
  {
    id: "doctor", label: "Doctor / Medical",
    desc: "Practicing clinician, intern, resident",
    icon: Stethoscope,
    subtypeLabel: "Specialty",
    subtypes: [
      "General Physician (MBBS)", "Internal Medicine", "Family Medicine",
      "Paediatrics", "Neonatology", "Geriatrics",
      "General Surgery", "Orthopaedics", "Neurosurgery",
      "Cardiothoracic surgery", "Plastic surgery", "Vascular surgery",
      "Obstetrics & Gynaecology", "IVF & Fertility",
      "Cardiology", "Neurology", "Nephrology", "Pulmonology",
      "Gastroenterology", "Endocrinology", "Hepatology", "Hematology",
      "Oncology (Medical)", "Oncology (Radiation)", "Oncology (Surgical)",
      "Dermatology", "Cosmetology", "Trichology",
      "Psychiatry", "Psychology", "Child psychiatry",
      "Ophthalmology", "ENT",
      "Dentistry — General", "Dentistry — Orthodontics", "Dentistry — Endodontics",
      "Dentistry — Periodontics", "Dentistry — Prosthodontics", "Dentistry — Oral surgery",
      "Radiology", "Pathology", "Anesthesiology", "Emergency medicine", "Critical care",
      "Ayurveda", "Homeopathy", "Unani", "Siddha", "Naturopathy", "Physiotherapy",
      "Intern", "Resident", "Fellow", "Consultant", "Super-specialist", "Other",
    ],
  },
  {
    id: "researcher", label: "Researcher",
    desc: "PhD, post-doc, lab, think-tank",
    icon: Microscope,
    subtypeLabel: "Field",
    subtypes: [
      "Computer Science", "Biology / Life Sciences", "Physics", "Chemistry",
      "Mathematics", "Statistics", "Astronomy", "Geology", "Oceanography",
      "Economics", "Social Sciences", "Humanities", "Public Policy",
      "Medical Research", "Climate / Environment",
      "Archaeology", "Linguistics", "Philosophy", "Theology",
      "Architecture research", "Urban studies", "Other",
    ],
  },
  {
    id: "faculty", label: "Faculty / Educator",
    desc: "Teacher, professor, trainer",
    icon: BookOpen,
    subtypeLabel: "Level",
    subtypes: [
      "Pre-school / Kindergarten", "Primary School", "Secondary / High School",
      "Special education",
      "Coaching / Test-prep", "College Lecturer", "University Professor",
      "Corporate Trainer",
      "Music school", "Dance school", "Sports coach",
      "Yoga instructor", "Driving instructor", "Other",
    ],
  },
  {
    id: "investor", label: "Investor",
    desc: "Angel, VC, PE, family office",
    icon: Landmark,
    subtypeLabel: "Type",
    subtypes: [
      "Angel", "Scout", "Solo GP", "Syndicate",
      "Micro VC", "VC", "PE",
      "SPV", "Rolling fund",
      "Family office", "Corporate VC",
      "Accelerator", "Accelerator partner",
      "Sovereign fund", "Pension fund", "Hedge fund", "Prop desk", "Crypto fund",
      "Other",
    ],
  },
];

export const ROLE_BY_ID = Object.fromEntries(ROLES.map(r => [r.id, r])) as Record<Role, RoleDef>;

/** Step 6 — interest tags (3–8 required). */
export const INTERESTS: string[] = [
  "Startups", "Product", "Design", "Engineering", "AI / ML", "Data",
  "Marketing", "Finance / Investing", "Careers & Hiring", "Freelancing",
  "Creator economy", "Media", "Policy", "Climate", "Healthcare",
  "Education", "Research", "Sports", "Culture", "Books",
  "Cinema", "Music", "Travel", "Food", "Fashion",
  "Gaming", "Fitness", "Spirituality", "Politics", "Indian startups", "Web3",
  // Expanded coverage
  "SaaS", "B2B", "B2C", "D2C", "Consumer tech", "Enterprise tech",
  "Deep tech", "Robotics", "Quantum", "Biotech", "Spacetech", "Drones",
  "Defence tech", "Supply chain", "Manufacturing", "Real estate",
  "Insurance", "Mutual funds", "Personal finance", "Crypto", "Stocks",
  "Mental health", "Nutrition", "Productivity", "Career growth",
  "Leadership", "Public speaking", "Writing", "Philosophy", "History",
  "Geography", "Astronomy", "Photography",
  "Cinema — World", "Cinema — Indian", "Regional languages",
  "Comedy", "Stand-up", "Theatre", "Dance", "Yoga", "Meditation",
  "Minimalism", "Sustainability", "Parenting", "Relationships",
  "Self-help", "Productivity tools", "No-code", "Open source",
];

/** Founder/Investor sector list — shared. */
export const SECTORS = [
  "SaaS — Horizontal", "SaaS — Vertical",
  "Fintech — Payments", "Fintech — Lending", "Fintech — WealthTech",
  "Fintech — InsurTech", "Fintech — Neobank",
  "E-commerce — D2C brand", "E-commerce — Marketplace",
  "E-commerce — Social commerce", "Q-commerce",
  "Healthtech", "Medtech", "BioTech", "Pharma",
  "Edtech — K-12", "Edtech — Higher-ed", "Edtech — Test prep", "Edtech — Upskilling",
  "AI / ML — Foundation models", "AI / ML — Applied",
  "AI / ML — Infra", "AI / ML — Vertical SaaS",
  "Deeptech — Hardware", "Deeptech — Robotics",
  "Deeptech — Spacetech", "Deeptech — Defence",
  "Climate — Clean energy", "Climate — Mobility",
  "Climate — Agritech", "Climate — Circular economy",
  "Gaming", "Media / Entertainment", "Creator tools", "Audio", "Streaming",
  "Mobility — Ride-hail", "Mobility — EV", "Mobility — Logistics",
  "Real estate / PropTech", "Travel / TravelTech",
  "Food — Cloud kitchen", "Food — FoodTech", "Food — Agri",
  "Manufacturing", "Supply chain", "B2B marketplace",
  "Legal tech", "HR tech", "Sales tech", "Marketing tech",
  "Web3 — Infra", "Web3 — Apps", "Web3 — DeFi", "Web3 — Gaming", "Other",
];

export const YEARS_EXP_BUCKETS = ["<1", "1–2", "3–5", "6–10", "11–15", "16+"];
export const TEAM_SIZES = ["<5", "5–20", "21–50", "51–200", "200+"];
export const AUDIENCE_SIZES = ["<1k", "1k–10k", "10k–100k", "100k–1M", "1M+"];
export const CHECK_SIZES = ["<₹10L", "₹10–50L", "₹50L–2Cr", "₹2–10Cr", "₹10Cr+"];
export const FOCUS_STAGES = ["Idea", "Pre-seed", "Seed", "Series A", "Series A+"];
export const CREATOR_NICHES = [
  "Tech", "Business", "Finance", "Lifestyle", "Education",
  "Comedy", "News", "Sports", "Fashion", "Food", "Travel",
  "Gaming", "Music", "Other",
];
export const FOUNDER_TITLES = ["Founder", "Co-founder", "CEO", "CTO", "CMO", "CFO", "COO", "Other"];
