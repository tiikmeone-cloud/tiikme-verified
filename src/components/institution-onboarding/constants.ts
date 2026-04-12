export const PERSONAL_DOMAINS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
  "rediffmail.com", "proton.me", "icloud.com", "live.com",
  "aol.com", "zoho.com", "ymail.com",
];

export const ORG_TYPES = [
  { id: "company", emoji: "🏢", label: "Company / Business", desc: "Startups, SMEs, corporates" },
  { id: "education", emoji: "🎓", label: "Educational Institution", desc: "Schools, colleges, universities" },
  { id: "hospital", emoji: "🏥", label: "Hospital / Healthcare", desc: "Hospitals, clinics, labs" },
  { id: "government", emoji: "🏛️", label: "Government Body", desc: "Ministries, departments, PSUs" },
  { id: "ngo", emoji: "🤝", label: "NGO / Non-Profit", desc: "Trusts, societies, social enterprises" },
  { id: "individual", emoji: "👤", label: "Individual Business", desc: "Freelancers, consultants" },
] as const;

export const ROLE_OPTIONS: Record<string, string[]> = {
  company: ["Founder / CEO", "Co-founder", "CTO", "CFO", "CMO", "CXO", "COO", "HR Manager", "Recruiter", "Director", "Manager", "Employee"],
  education: ["Principal", "Vice-Principal", "Director", "Dean", "HOD", "Professor / Faculty", "Administrator", "Registrar", "Student Council"],
  hospital: ["Director / CEO", "Medical Superintendent", "HOD", "Doctor", "Nurse", "Administrator", "HR"],
  government: ["Secretary", "Director", "Deputy Director", "Officer", "Staff"],
  ngo: ["Founder", "Director", "Manager", "Coordinator", "Volunteer Lead"],
  individual: ["Owner", "Founder", "Consultant"],
};

export const SIZE_OPTIONS = ["1–10", "11–50", "51–200", "201–1000", "1000–5000", "5000+"];

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal",
];

export const inputStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1.5px solid #E5E7EB",
  borderRadius: 8,
  color: "#1A1A1A",
  height: 48,
  fontSize: 14,
};

export const cardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 12,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
  padding: 40,
};
