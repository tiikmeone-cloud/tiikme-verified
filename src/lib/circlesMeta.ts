import { Building2, GraduationCap, Briefcase, MapPin, Users, Hash } from "lucide-react";

export const CIRCLE_TYPE_CONFIG = {
  company: { label: "Company", icon: Building2, color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  college: { label: "College", icon: GraduationCap, color: "#FB923C", bg: "rgba(251,146,60,0.14)" },
  sector: { label: "Sector", icon: Briefcase, color: "#8B5CF6", bg: "rgba(139,92,246,0.14)" },
  city: { label: "City", icon: MapPin, color: "#10B981", bg: "rgba(16,185,129,0.14)" },
  role: { label: "Role", icon: Users, color: "#F59E0B", bg: "rgba(245,158,11,0.14)" },
  topic: { label: "Topic", icon: Hash, color: "#EC4899", bg: "rgba(236,72,153,0.14)" },
} as const;

export const POST_TYPE_CONFIG = {
  discussion: { label: "Discussion", icon: "💬", hint: "Share thoughts, ask for advice" },
  question: { label: "Question", icon: "❓", hint: "Ask something specific" },
  poll: { label: "Poll", icon: "📊", hint: "Get quick votes on an option" },
  salary_share: { label: "Salary share", icon: "💰", hint: "Anonymous comp transparency" },
  company_review: { label: "Company review", icon: "⭐", hint: "Review a company you worked at" },
  link_share: { label: "Link", icon: "🔗", hint: "Share an article or resource" },
} as const;

export const SIGNTYPE_CONFIG = {
  full_profile: { label: "Full profile", hint: "Name, avatar, role visible" },
  verified_employee: { label: "Verified employee", hint: "Company shown, name hidden" },
  verified_alumni: { label: "Verified alumni", hint: "College shown, year hidden" },
  verified_role: { label: "Verified role", hint: "Role shown, company hidden" },
  verified_anonymous: { label: "Anonymous", hint: "Nothing identifying shown" },
} as const;

export type CircleType = keyof typeof CIRCLE_TYPE_CONFIG;
export type PostType = keyof typeof POST_TYPE_CONFIG;
export type Signtype = keyof typeof SIGNTYPE_CONFIG;
