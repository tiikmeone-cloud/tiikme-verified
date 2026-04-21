/**
 * Single source of truth for the 9-role taxonomy used by the new
 * /onboarding wizard. Keep this in sync with:
 *   - profiles_role_check  (DB constraint, 9 values)
 *   - src/lib/roleSubtypes.ts (legacy helper still used by Profile edit)
 *
 * The old roles (government, hr, skilled_trade, builder, aspirant) are
 * gone — do NOT add them back here.
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
      "School (Class 9–12)", "Undergraduate", "Postgraduate (Masters)",
      "PhD", "Diploma / Certificate",
      "Preparing for exams (UPSC/CAT/GATE/GRE/NEET/etc.)",
      "Gap year", "Other",
    ],
  },
  {
    id: "professional", label: "Professional",
    desc: "Employed, full-time or part-time",
    icon: Briefcase,
    subtypeLabel: "What field?",
    subtypes: [
      "Engineering / Software", "Product", "Design", "Data / Analytics",
      "Marketing / Growth", "Sales / BD", "Operations",
      "Finance / Accounting", "HR / People", "Legal", "Consulting",
      "Customer Success", "Content / Editorial", "Supply Chain",
      "Manufacturing", "Healthcare (non-clinical)",
      "Education (non-faculty)", "Government / Policy",
      "Hospitality", "Retail", "Other",
    ],
  },
  {
    id: "founder", label: "Founder",
    desc: "Building or running a company, any stage",
    icon: Rocket,
    subtypeLabel: "Stage",
    subtypes: [
      "Idea", "Pre-seed", "Seed", "Series A", "Series B+",
      "Bootstrapped & profitable", "Acquired", "Closed", "Other",
    ],
  },
  {
    id: "freelancer", label: "Freelancer / Independent",
    desc: "Contractor, consultant, self-employed",
    icon: Wrench,
    subtypeLabel: "Primary service",
    subtypes: [
      "Design", "Development", "Writing / Editing", "Video / Photo",
      "Marketing", "Consulting", "Legal", "Finance",
      "Translation", "Tutoring", "Other",
    ],
  },
  {
    id: "creator", label: "Creator",
    desc: "Content, media, design, writing, video",
    icon: Video,
    subtypeLabel: "Primary platform",
    subtypes: [
      "YouTube", "Instagram", "LinkedIn", "X / Twitter",
      "Substack / Newsletter", "Podcast", "TikTok", "Twitch",
      "Blog", "Multi-platform", "Other",
    ],
  },
  {
    id: "doctor", label: "Doctor / Medical",
    desc: "Practicing clinician, intern, resident",
    icon: Stethoscope,
    subtypeLabel: "Specialty",
    subtypes: [
      "General Physician", "Surgery", "Paediatrics", "Gynaecology",
      "Cardiology", "Dermatology", "Psychiatry", "Dentistry",
      "Ayurveda", "Homeopathy", "Intern", "Resident", "Other",
    ],
  },
  {
    id: "researcher", label: "Researcher",
    desc: "PhD, post-doc, lab, think-tank",
    icon: Microscope,
    subtypeLabel: "Field",
    subtypes: [
      "Computer Science", "Biology / Life Sciences", "Physics", "Chemistry",
      "Economics", "Social Sciences", "Humanities", "Public Policy",
      "Medical Research", "Climate / Environment", "Other",
    ],
  },
  {
    id: "faculty", label: "Faculty / Educator",
    desc: "Teacher, professor, trainer",
    icon: BookOpen,
    subtypeLabel: "Level",
    subtypes: [
      "Primary School", "Secondary / High School", "Coaching / Test-prep",
      "College Lecturer", "University Professor", "Corporate Trainer", "Other",
    ],
  },
  {
    id: "investor", label: "Investor",
    desc: "Angel, VC, PE, family office",
    icon: Landmark,
    subtypeLabel: "Type",
    subtypes: [
      "Angel", "Syndicate", "VC", "PE", "Family office",
      "Corporate VC", "Accelerator", "Other",
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
];

/** Founder/Investor sector list — shared. */
export const SECTORS = [
  "SaaS", "Fintech", "E-commerce", "D2C", "Healthtech", "Edtech",
  "AI/ML", "Climate", "Deeptech", "Agritech", "Media", "Gaming",
  "Mobility", "Spacetech", "Other",
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
