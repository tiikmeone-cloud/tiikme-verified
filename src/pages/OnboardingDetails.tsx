import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingShell from "@/components/onboarding/OnboardingShell";

// ═══ CONSTANTS ═══

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli","Daman & Diu","Delhi (NCT)",
  "Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry","Outside India"
];

const DEGREES = [
  "── ENGINEERING & TECHNOLOGY ──",
  "B.Tech / B.E.","B.Tech Lateral Entry","B.Sc Engineering","BCA","B.Sc IT / Computer Science",
  "Diploma in Engineering (Polytechnic)","Integrated B.Tech + M.Tech","B.Tech + MBA (Dual degree)",
  "── MEDICAL & HEALTHCARE ──",
  "MBBS","BDS","BAMS","BHMS","BUMS","BNYS","B.Pharm","D.Pharm","B.Sc Nursing","GNM","ANM",
  "BPT","BOT","B.Sc Medical Lab Technology","B.Sc Radiology","B.Sc Optometry","BMLT",
  "B.Sc Anesthesia Technology","B.Sc Dialysis Technology","B.Sc Cardiac Technology",
  "BASLP","BVSc & AH",
  "── SCIENCE ──",
  "B.Sc","B.Sc (Hons.)","Integrated B.Sc + M.Sc","B.Sc Agriculture","B.Sc Horticulture",
  "B.Sc Forestry","B.Sc Home Science","B.Sc Food Technology","B.Sc Microbiology",
  "B.Sc Genetics","B.Sc Environmental Science",
  "── COMMERCE & MANAGEMENT ──",
  "B.Com","B.Com (Hons.)","BBA","BMS","BBA LLB","BBM","BAF","BFM","BBI",
  "── ARTS & HUMANITIES ──",
  "BA","BA (Hons.)","BA LLB","BSW","B.Lib.I.Sc",
  "── LAW ──",
  "LLB (3 yrs)","BA LLB (5 yrs)","BBA LLB (5 yrs)","B.Com LLB (5 yrs)","BSc LLB (5 yrs)",
  "── DESIGN & CREATIVE ARTS ──",
  "B.Des","BFA","B.Sc Interior Design","B.Arch","B.Plan","BMMMC","BA Journalism",
  "B.Sc Animation & Multimedia","BFA (Visual / Performing Arts)",
  "── EDUCATION ──",
  "B.Ed","D.El.Ed","B.P.Ed","B.El.Ed",
  "── COMPUTER & IT ──",
  "BCA","B.Sc Computer Science","B.Sc Data Science","B.Sc AI & ML","B.Sc Cybersecurity",
  "── VOCATIONAL / DIPLOMA ──",
  "Polytechnic Diploma","ITI","Diploma in Hotel Management","Diploma in Fashion Design",
  "── POSTGRADUATE ──",
  "M.Tech / M.E.","M.Sc","MBA","MCA","MA","M.Com","MD","MS (Surgery)","MDS","M.Pharm",
  "M.Sc Nursing","MPT","LLM","M.Arch","M.Des","M.Ed","MSW","MHA","M.Plan",
  "── SUPER SPECIALIZATION ──",
  "DM","M.Ch","Fellowship",
  "── RESEARCH ──",
  "PhD","Integrated PhD","MS by Research","M.Phil",
  "── INTERNATIONAL ──",
  "Associate Degree","Bachelor's (BA/BS/BEng)","Honours Degree (UK)","Master's (MA/MSc/MBA)",
  "PG Certificate / Diploma","Doctoral (PhD/DPhil/EdD)",
  "Other"
];

const BTECH_BRANCHES = [
  "Computer Science & Engineering (CSE)","Information Technology (IT)","CSE (AI & ML)",
  "CSE (Data Science)","CSE (Cybersecurity)","Electronics & Communication (ECE)",
  "Electrical Engineering (EEE)","Mechanical Engineering","Civil Engineering",
  "Chemical Engineering","Aerospace Engineering","Automobile Engineering",
  "Biomedical Engineering","Biotechnology Engineering","Environmental Engineering",
  "Industrial & Production Engineering","Mining Engineering","Petroleum Engineering",
  "Textile Engineering","Agricultural Engineering","Food Technology","Marine Engineering",
  "Instrumentation Engineering","Robotics & Automation","Other"
];

const MBBS_BRANCHES = [
  "General Medicine","Surgery","Paediatrics","Obstetrics & Gynaecology","Orthopaedics",
  "Dermatology","Ophthalmology","ENT","Radiology","Anesthesiology","Pathology",
  "Microbiology","Pharmacology","Psychiatry","Forensic Medicine","Community Medicine","Other"
];

const BSC_BRANCHES = ["Physics","Chemistry","Mathematics","Biology / Zoology / Botany","Biotechnology","Microbiology","Computer Science","Electronics","Statistics","Other"];
const MBA_BRANCHES = ["Marketing","Finance","HR","Operations","IT / Systems","Healthcare","International Business","Entrepreneurship","Other"];
const BA_BRANCHES = ["Economics","History","Political Science","Sociology","Psychology","Philosophy","English","Hindi","Regional Language","Geography","Other"];

const YEAR_OF_STUDY = ["1st Year","2nd Year","3rd Year","4th Year","5th Year","6th Year (MBBS)","Postgraduate 1st Year","Postgraduate 2nd Year","PhD / Research","Alumni / Graduated"];

const INDUSTRIES = [
  "Information Technology (IT) & Software","Product & SaaS","Consulting & Advisory","Banking & Financial Services",
  "Insurance","Investment & Wealth Management","Manufacturing (Automotive)","Manufacturing (Electronics)",
  "Manufacturing (FMCG)","Manufacturing (Chemicals)","Manufacturing (Metals & Mining)",
  "Manufacturing (Textiles)","Manufacturing (Heavy / Defence)","Healthcare & Hospitals",
  "Pharmaceuticals & Biotech","Medical Devices","Retail & E-Commerce","Real Estate & Construction",
  "Infrastructure & Urban Development","Oil & Gas / Energy","Renewable Energy",
  "Telecom & Networking","Media, Advertising & PR","Entertainment, Film & OTT",
  "Publishing & Journalism","Education & EdTech","Research & Development",
  "Agriculture & Agri-tech","Food & Beverage","Logistics, Supply Chain & Warehousing",
  "Aviation & Aerospace","Shipping & Maritime","Railways & Transportation",
  "Government & Public Sector (Central)","Government & Public Sector (State)",
  "Defence & Armed Forces","Law Enforcement","Legal & Compliance","Non-Profit / NGO",
  "Hospitality & Tourism","Events & Entertainment","Fashion & Lifestyle",
  "Design & Creative Studio","Digital Marketing Agency","Accounting & Audit Firm",
  "Staffing & Recruitment","Freelancing / Independent","Other"
];

const COMPANY_TYPES = ["MNC","Indian Startup","Indian Enterprise","Public Sector / PSU","Family Business / SME","Agency / Studio / Firm","Freelancer / Self-employed","NGO / Non-profit"];
const EXPERIENCE_LEVELS = ["Less than 1 year","1–2 years","3–5 years","5–8 years","8–12 years","12+ years"];
const DESIGNATION_LEVELS = ["Intern / Trainee","Junior / Associate (0–2 yrs)","Mid-level / IC (2–5 yrs)","Senior / Specialist (5–10 yrs)","Lead / Principal","Manager / Team Lead","Senior Manager","Director / VP / AVP","C-Suite (CXO)","Founder / Co-founder"];

const DOCTOR_SPECIALISATIONS = [
  "General Physician (MBBS)","General Surgeon","Cardiologist","Neurologist","Orthopaedic Surgeon",
  "Paediatrician","Gynaecologist","Dermatologist","Psychiatrist","Radiologist",
  "Anesthesiologist","Gastroenterologist","Pulmonologist","Nephrologist","Oncologist",
  "Endocrinologist","Rheumatologist","Ophthalmologist","ENT Specialist","Pathologist",
  "Dentist / BDS","Oral & Maxillofacial Surgeon","Orthodontist","Ayurvedic Physician",
  "Homeopathic Physician","Physiotherapist","Pharmacist","Nutritionist / Dietitian",
  "Veterinary Doctor","Public Health Specialist","Hospital Administrator","Medical Research","Other"
];
const DOCTOR_DEGREES = ["MBBS","BDS","BAMS","BHMS","BUMS","BNYS","BPT","MD","MS","MDS","DM","M.Ch","FICS / FRCS / Fellowship","PhD","Other"];
const HOSPITAL_TYPES = ["Government / Public Hospital","Private Hospital","Medical College Hospital","Clinic / Polyclinic","Telemedicine / Online","Research Institution","Other"];

const GOVT_DESIGNATIONS = [
  "IAS Officer","IPS Officer","IFS (Foreign Service)","IRS","IFoS","Section Officer",
  "Under Secretary","Deputy Secretary","Joint Secretary","Additional Secretary","Secretary",
  "SDM / SDO","DM / District Collector","Commissioner","BDO","Tahsildar","Revenue Inspector",
  "Municipal Commissioner","GST Inspector","Customs Officer","SEBI / RBI / NABARD Officer",
  "Bank PO / Manager (PSU)","LIC Officer","Sub-Inspector (Police)","DSP / SP / DIG / IG / DGP",
  "Army Officer","Navy Officer","Air Force Officer","BSF / CRPF / CISF Officer",
  "Forest Officer","Postal Inspector","ASHA / ANM Health Worker","Government Teacher",
  "Professor (Central University)","Scientist (DRDO / ISRO / CSIR)","Other"
];
const GOVT_MINISTRIES = [
  "Ministry of Finance","Ministry of Home Affairs","Ministry of External Affairs","Ministry of Defence",
  "Ministry of Education","Ministry of Health","Ministry of Agriculture","Ministry of Commerce",
  "Ministry of Railways","Ministry of Road Transport","Ministry of Petroleum","Ministry of Power",
  "Ministry of Environment","Ministry of Jal Shakti","Ministry of Rural Development",
  "Ministry of Electronics & IT (MeitY)","State Government","Armed Forces","Judiciary","Other"
];

const FACULTY_INST_TYPES = [
  "IIT","NIT","IIM","AIIMS / Medical College","Central University","State University",
  "Deemed University","Private Engineering College","Private Medical College",
  "Government Degree College","Private College","Polytechnic / Diploma Institute",
  "School (Class 1–12)","International School","Research Institute (CSIR / DRDO)",
  "Law School","Design Institute (NID / NIFT)","Other"
];
const FACULTY_DEPTS = [
  "Computer Science","IT","AI & ML","Data Science","Electronics & Communication","Electrical",
  "Mechanical","Civil","Chemical","Aerospace","Biotechnology","Physics","Chemistry","Mathematics",
  "Statistics","Biology","Medicine","Surgery","Nursing","Pharmacy","Commerce","Management",
  "Economics","History","Political Science","Sociology","Psychology","English","Hindi",
  "Law","Architecture","Design","Agriculture","Education","Journalism","Environmental Science","Other"
];
const FACULTY_DESIGNATIONS = [
  "Lecturer (ad-hoc)","Assistant Professor","Associate Professor","Professor",
  "Professor of Practice","Visiting Professor","Research Associate","Postdoctoral Fellow",
  "Senior Research Fellow","Junior Research Fellow","HOD","Principal / Vice-Principal",
  "Director / VC","Dean","School Teacher (PGT / TGT / PRT)","Other"
];

const BUILDER_STAGES = ["💡 Idea Stage","🔨 Building","🚀 Launched","📈 Scaling"];
const BUILDER_ROLES = ["Founder (Solo)","Co-founder (Technical)","Co-founder (Business)","Founding Engineer","Founding Designer","CTO","CEO","CPO","COO","CMO"];
const TEAM_SIZES = ["Solo","2–5","6–20","21–50","50+"];
const FUNDED_OPTIONS = ["Bootstrapped","Pre-seed","Seed","Series A+","Grant / Government funded"];

const HR_TITLES = ["HR Executive","HR Associate","HR Manager","HR Business Partner","Talent Acquisition Specialist","Technical Recruiter","Campus Recruiter","L&D Manager","Comp & Benefits Manager","HR Director","VP HR","CHRO"];

const TRADE_TYPES = [
  "── Electrical ──","Electrician (Domestic)","Electrician (Industrial)","Wireman","Lineman",
  "── Plumbing ──","Plumber","Pipe Fitter",
  "── Construction ──","Mason / Bricklayer","Carpenter","Painter","Welder","Fabricator","Tile / Marble Fitter",
  "── AC & Appliances ──","AC / Refrigeration Technician","Appliance Repair","Solar Panel Technician",
  "── Automotive ──","Motor Mechanic","Auto Electrician","Two-Wheeler Mechanic",
  "── Beauty & Wellness ──","Barber / Hair Stylist","Beautician / Makeup Artist",
  "── Food ──","Chef / Cook (Home)","Chef / Cook (Hotel)","Baker",
  "── Textiles ──","Tailor","Embroidery Artist",
  "── Digital Skilled ──","Graphic Design (Self-taught)","Video Editing","Photography",
  "── Transport ──","Driver (Private)","Driver (Commercial)","Cab Driver",
  "Other"
];

const ASPIRANT_EXAMS = [
  "── Civil Services ──","UPSC Civil Services (IAS/IPS/IFS)","State PSC",
  "── Police & Defence ──","NDA","CDS","CAPF","State Police SI / Constable","SSC GD",
  "── Banking ──","IBPS PO / Clerk","SBI PO / Clerk","RBI Grade B","NABARD Grade A","LIC ADO / AAO",
  "── SSC ──","SSC CGL","SSC CHSL","SSC CPO","SSC MTS","SSC JE",
  "── Railway ──","RRB NTPC","RRB ALP","RRB JE","RRB Group D",
  "── Teaching ──","CTET / STET","KVS / NVS Recruitment",
  "── Engineering ──","GATE","IES / ESE","PSU Exams",
  "── Medical ──","NEET UG","NEET PG","FMGE",
  "── Legal ──","CLAT","AIBE","Judicial Services",
  "── Management ──","CAT","XAT / GMAT / NMAT","CA (ICAI)","CMA (ICMAI)","CS (ICSI)",
  "── Academic ──","JEE Main / Advanced","CUET","UGC NET / JRF",
  "Other"
];

const currentYear = new Date().getFullYear();
const yearRange = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => String(start + i));

// ═══ HELPERS ═══

const inputStyle: React.CSSProperties = {
  background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 14,
  color: "#111827", height: 48, width: "100%", padding: "0 14px", fontSize: 14,
  outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif",
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6, display: "block" };

const SearchableSelect = ({ options, value, onChange, placeholder }: { options: string[]; value: string; onChange: (v: string) => void; placeholder: string }) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = options.filter(o => !o.startsWith("──") || true).filter(o =>
    o.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="relative">
      <input
        value={open ? search : value || ""}
        onChange={e => { setSearch(e.target.value); if (!open) setOpen(true); }}
        onFocus={() => { setOpen(true); setSearch(""); }}
        placeholder={placeholder}
        style={inputStyle}
      />
      {value && !open && (
        <button onClick={() => { onChange(""); setOpen(true); setSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "#9CA3AF" }}>
          <X className="w-4 h-4" />
        </button>
      )}
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-xl border bg-white shadow-lg" style={{ borderColor: "#E5E7EB" }}>
          {filtered.map((o, i) => {
            if (o.startsWith("──")) return <div key={i} className="px-3 py-1.5 text-[11px] font-bold" style={{ color: "#9CA3AF", background: "#F9FAFB" }}>{o}</div>;
            return (
              <button key={i} onClick={() => { onChange(o); setOpen(false); setSearch(""); }}
                className="w-full text-left px-3 py-2 text-[13px] hover:bg-orange-50 cursor-pointer transition-colors"
                style={{ color: "#111827" }}
              >{o}</button>
            );
          })}
          {filtered.length === 0 && <div className="px-3 py-2 text-[13px]" style={{ color: "#9CA3AF" }}>No results</div>}
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
};

// ═══ MAIN COMPONENT ═══

export default function OnboardingDetails() {
  const navigate = useNavigate();
  const { user, refetchProfile } = useAuth();
  const role = sessionStorage.getItem("ob_role") || "student";
  const [submitting, setSubmitting] = useState(false);

  // Block A: Identity
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  // Block B: Location
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Block C: Role-specific
  const [rd, setRd] = useState<Record<string, string>>({});
  const u = (k: string, v: string) => setRd(p => ({ ...p, [k]: v }));

  // Block D: Headline
  const [headline, setHeadline] = useState("");

  // Auto-generate username
  useEffect(() => {
    if (!firstName && !lastName) return;
    const base = (firstName + lastName).toLowerCase().replace(/[^a-z0-9]/g, "");
    const suffix = user?.id?.slice(0, 6) || "000000";
    setUsername(base + "-" + suffix);
  }, [firstName, lastName, user?.id]);

  // Check username availability
  useEffect(() => {
    if (!username || username.length < 3) { setUsernameStatus("idle"); return; }
    const timer = setTimeout(async () => {
      setUsernameStatus("checking");
      const { data } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
      if (data && data.id !== user?.id) setUsernameStatus("taken");
      else setUsernameStatus("available");
    }, 500);
    return () => clearTimeout(timer);
  }, [username, user?.id]);

  const getTitle = () => {
    const map: Record<string, string> = {
      student: "Tell us about your studies", professional: "Tell us about your work",
      doctor: "Tell us about your practice", government: "Tell us about your service",
      faculty: "Tell us about your institution", builder: "Tell us about what you're building",
      hr: "Tell us about your company", skilled_trade: "Tell us about your trade",
      aspirant: "Tell us about your goals",
    };
    return map[role] || "Tell us about yourself";
  };

  const getHeadlinePlaceholder = () => {
    const map: Record<string, string> = {
      student: "B.Tech CSE student at IIT Delhi | Interested in AI",
      professional: "Senior Product Manager at Infosys | 6 years in FinTech",
      doctor: "MBBS, MD Cardiology | Cardiologist at Apollo Hyderabad",
      government: "IAS Officer | District Collector, Nalgonda, Telangana",
      faculty: "Assistant Professor, CSE | IIT Bombay | ML Researcher",
      builder: "Building Krishify — social platform for Indian farmers",
      hr: "Talent Acquisition Lead at Wipro | IIT Campus Recruiting",
      skilled_trade: "Certified Electrician | 10 years | Industrial & Domestic",
      aspirant: "UPSC CSE aspirant | Mains 2025 | Sociology optional",
    };
    return map[role] || "What do you do?";
  };

  const getBranchOptions = () => {
    const d = rd.degree || "";
    if (d.includes("B.Tech") || d.includes("B.E.") || d.includes("M.Tech")) return BTECH_BRANCHES;
    if (d.includes("MBBS") || d.includes("MD") || d.includes("MS (Surgery)")) return MBBS_BRANCHES;
    if (d.includes("B.Sc")) return BSC_BRANCHES;
    if (d.includes("MBA") || d.includes("BBA") || d.includes("BMS")) return MBA_BRANCHES;
    if (d.includes("BA")) return BA_BRANCHES;
    return [...BTECH_BRANCHES, ...BSC_BRANCHES];
  };

  const handleComplete = async () => {
    if (!firstName.trim() || !lastName.trim()) { toast.info("First and last name are required"); return; }
    if (!city.trim() || !state) { toast.info("City and state are required"); return; }
    if (!user) { toast.error("Not authenticated"); return; }

    setSubmitting(true);
    const roleMetadata: Record<string, any> = {};

    // Copy all rd fields into roleMetadata
    Object.entries(rd).forEach(([k, v]) => { if (v) roleMetadata[k] = v; });

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: `${firstName.trim()} ${lastName.trim()}`,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      username: username.trim().toLowerCase(),
      role,
      headline: headline || "",
      location_city: city.trim(),
      location_state: state,
      institution_name: rd.institution || rd.company || rd.hospital || "",
      department: rd.branch || rd.department || "",
      designation: rd.jobTitle || rd.designation || rd.faculty_designation || "",
      sector: rd.industry || "",
      role_metadata: roleMetadata as any,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    } as any, { onConflict: "id" });

    setSubmitting(false);
    if (error) { toast.error("Failed to save profile"); console.error(error); return; }

    sessionStorage.removeItem("ob_role");
    sessionStorage.removeItem("ob_email");
    await refetchProfile();
    navigate("/onboarding/welcome");
  };

  const handleSkip = async () => {
    if (!user) { navigate("/app/feed"); return; }
    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: `${firstName.trim()} ${lastName.trim()}`.trim() || user.email?.split("@")[0] || "User",
      username: username || (user.email?.split("@")[0]?.replace(/[^a-z0-9]/g, "") + "-" + user.id.slice(0, 6)),
      role,
      onboarding_complete: false,
      updated_at: new Date().toISOString(),
    } as any, { onConflict: "id" });
    sessionStorage.removeItem("ob_role");
    navigate("/app/feed");
  };

  // ═══ ROLE-SPECIFIC FIELD RENDERERS ═══

  const renderStudent = () => (
    <>
      <div><label style={labelStyle}>College / University name *</label><input value={rd.institution || ""} onChange={e => u("institution", e.target.value)} placeholder="e.g. IIT Delhi" style={inputStyle} /></div>
      <div><label style={labelStyle}>Degree / Program *</label><SearchableSelect options={DEGREES} value={rd.degree || ""} onChange={v => u("degree", v)} placeholder="Search degree..." /></div>
      <div><label style={labelStyle}>Branch / Specialisation *</label><SearchableSelect options={getBranchOptions()} value={rd.branch || ""} onChange={v => u("branch", v)} placeholder="Select branch..." /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label style={labelStyle}>Year of Study *</label><select value={rd.yearOfStudy || ""} onChange={e => u("yearOfStudy", e.target.value)} style={selectStyle}><option value="">Select</option>{YEAR_OF_STUDY.map(y => <option key={y}>{y}</option>)}</select></div>
        <div><label style={labelStyle}>Graduation Year</label><select value={rd.gradYear || ""} onChange={e => u("gradYear", e.target.value)} style={selectStyle}><option value="">Select</option>{yearRange(2010, 2035).map(y => <option key={y}>{y}</option>)}</select></div>
      </div>
      <div><label style={labelStyle}>Student Email (optional)</label><input value={rd.studentEmail || ""} onChange={e => u("studentEmail", e.target.value)} placeholder="you@college.ac.in" style={inputStyle} /><p className="text-[11px] mt-1" style={{ color: "#9CA3AF" }}>Your @college.edu or .ac.in email for instant verification</p></div>
    </>
  );

  const renderProfessional = () => (
    <>
      <div><label style={labelStyle}>Company / Organisation Name *</label><input value={rd.company || ""} onChange={e => u("company", e.target.value)} placeholder="e.g. Infosys" style={inputStyle} /></div>
      <div><label style={labelStyle}>Job Title / Designation *</label><input value={rd.jobTitle || ""} onChange={e => u("jobTitle", e.target.value)} placeholder="e.g. Senior Software Engineer" style={inputStyle} /></div>
      <div><label style={labelStyle}>Industry *</label><SearchableSelect options={INDUSTRIES} value={rd.industry || ""} onChange={v => u("industry", v)} placeholder="Search industry..." /></div>
      <div><label style={labelStyle}>Company Type</label><select value={rd.companyType || ""} onChange={e => u("companyType", e.target.value)} style={selectStyle}><option value="">Select</option>{COMPANY_TYPES.map(c => <option key={c}>{c}</option>)}</select></div>
      <div><label style={labelStyle}>Work Email (optional)</label><input value={rd.workEmail || ""} onChange={e => u("workEmail", e.target.value)} placeholder="you@company.com" style={inputStyle} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label style={labelStyle}>Working Since *</label><select value={rd.workingSince || ""} onChange={e => u("workingSince", e.target.value)} style={selectStyle}><option value="">Year</option>{yearRange(1980, currentYear).reverse().map(y => <option key={y}>{y}</option>)}</select></div>
        <div><label style={labelStyle}>Total Experience *</label><select value={rd.experience || ""} onChange={e => u("experience", e.target.value)} style={selectStyle}><option value="">Select</option>{EXPERIENCE_LEVELS.map(e => <option key={e}>{e}</option>)}</select></div>
      </div>
      <div><label style={labelStyle}>Designation Level *</label><select value={rd.designationLevel || ""} onChange={e => u("designationLevel", e.target.value)} style={selectStyle}><option value="">Select</option>{DESIGNATION_LEVELS.map(d => <option key={d}>{d}</option>)}</select></div>
    </>
  );

  const renderDoctor = () => (
    <>
      <div><label style={labelStyle}>Hospital / Clinic / Institution *</label><input value={rd.hospital || ""} onChange={e => u("hospital", e.target.value)} placeholder="e.g. Apollo Hospitals" style={inputStyle} /></div>
      <div><label style={labelStyle}>Specialisation *</label><SearchableSelect options={DOCTOR_SPECIALISATIONS} value={rd.specialisation || ""} onChange={v => u("specialisation", v)} placeholder="Search..." /></div>
      <div><label style={labelStyle}>Degree *</label><select value={rd.medicalDegree || ""} onChange={e => u("medicalDegree", e.target.value)} style={selectStyle}><option value="">Select</option>{DOCTOR_DEGREES.map(d => <option key={d}>{d}</option>)}</select></div>
      <div><label style={labelStyle}>Registration Number (optional)</label><input value={rd.regNumber || ""} onChange={e => u("regNumber", e.target.value)} placeholder="NMC / State Medical Council" style={inputStyle} /></div>
      <div><label style={labelStyle}>Practising Since *</label><select value={rd.practicingSince || ""} onChange={e => u("practicingSince", e.target.value)} style={selectStyle}><option value="">Year</option>{yearRange(1970, currentYear).reverse().map(y => <option key={y}>{y}</option>)}</select></div>
      <div><label style={labelStyle}>Hospital Type</label><select value={rd.hospitalType || ""} onChange={e => u("hospitalType", e.target.value)} style={selectStyle}><option value="">Select</option>{HOSPITAL_TYPES.map(h => <option key={h}>{h}</option>)}</select></div>
    </>
  );

  const renderGovernment = () => (
    <>
      <div><label style={labelStyle}>Ministry / Department / Organisation *</label><input value={rd.institution || ""} onChange={e => u("institution", e.target.value)} placeholder="e.g. Ministry of Finance" style={inputStyle} /></div>
      <div><label style={labelStyle}>Designation / Post *</label><SearchableSelect options={GOVT_DESIGNATIONS} value={rd.designation || ""} onChange={v => u("designation", v)} placeholder="Search..." /></div>
      <div><label style={labelStyle}>Ministry / Sector *</label><SearchableSelect options={GOVT_MINISTRIES} value={rd.ministry || ""} onChange={v => u("ministry", v)} placeholder="Search..." /></div>
      <div><label style={labelStyle}>Service / Cadre</label><select value={rd.cadre || ""} onChange={e => u("cadre", e.target.value)} style={selectStyle}><option value="">Select</option><option>All India Services (IAS/IPS/IFoS)</option><option>Central Services (Group A/B/C)</option><option>State Civil Services</option><option>Police Services</option><option>Armed Forces</option><option>PSU Employee</option><option>Other</option></select></div>
      <div><label style={labelStyle}>Official Email (optional)</label><input value={rd.officialEmail || ""} onChange={e => u("officialEmail", e.target.value)} placeholder="you@gov.in" style={inputStyle} /><p className="text-[11px] mt-1" style={{ color: "#9CA3AF" }}>Add .gov.in or .nic.in email for instant verification</p></div>
      <div><label style={labelStyle}>Serving Since *</label><select value={rd.servingSince || ""} onChange={e => u("servingSince", e.target.value)} style={selectStyle}><option value="">Year</option>{yearRange(1970, currentYear).reverse().map(y => <option key={y}>{y}</option>)}</select></div>
    </>
  );

  const renderFaculty = () => (
    <>
      <div><label style={labelStyle}>Institution Name *</label><input value={rd.institution || ""} onChange={e => u("institution", e.target.value)} placeholder="e.g. IIT Bombay" style={inputStyle} /></div>
      <div><label style={labelStyle}>Type of Institution</label><select value={rd.instType || ""} onChange={e => u("instType", e.target.value)} style={selectStyle}><option value="">Select</option>{FACULTY_INST_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
      <div><label style={labelStyle}>Department *</label><SearchableSelect options={FACULTY_DEPTS} value={rd.department || ""} onChange={v => u("department", v)} placeholder="Search..." /></div>
      <div><label style={labelStyle}>Designation *</label><select value={rd.faculty_designation || ""} onChange={e => u("faculty_designation", e.target.value)} style={selectStyle}><option value="">Select</option>{FACULTY_DESIGNATIONS.map(d => <option key={d}>{d}</option>)}</select></div>
      <div><label style={labelStyle}>Teaching Since *</label><select value={rd.teachingSince || ""} onChange={e => u("teachingSince", e.target.value)} style={selectStyle}><option value="">Year</option>{yearRange(1970, currentYear).reverse().map(y => <option key={y}>{y}</option>)}</select></div>
      <div><label style={labelStyle}>Institution Email (optional)</label><input value={rd.instEmail || ""} onChange={e => u("instEmail", e.target.value)} placeholder="you@college.ac.in" style={inputStyle} /></div>
    </>
  );

  const renderBuilder = () => (
    <>
      <div><label style={labelStyle}>Startup / Company Name</label><input value={rd.company || ""} onChange={e => u("company", e.target.value)} placeholder="Optional" style={inputStyle} /></div>
      <div><label style={labelStyle}>What are you building? *</label><input value={rd.whatBuilding || ""} onChange={e => u("whatBuilding", e.target.value.slice(0, 100))} placeholder="e.g. An AI-powered crop disease detection app" maxLength={100} style={inputStyle} /><p className="text-[11px] text-right mt-1" style={{ color: "#9CA3AF" }}>{(rd.whatBuilding || "").length}/100</p></div>
      <div><label style={labelStyle}>Stage *</label><select value={rd.stage || ""} onChange={e => u("stage", e.target.value)} style={selectStyle}><option value="">Select</option>{BUILDER_STAGES.map(s => <option key={s}>{s}</option>)}</select></div>
      <div><label style={labelStyle}>Industry / Domain *</label><SearchableSelect options={INDUSTRIES} value={rd.industry || ""} onChange={v => u("industry", v)} placeholder="Search..." /></div>
      <div><label style={labelStyle}>Role in the startup *</label><select value={rd.builderRole || ""} onChange={e => u("builderRole", e.target.value)} style={selectStyle}><option value="">Select</option>{BUILDER_ROLES.map(r => <option key={r}>{r}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label style={labelStyle}>Team size</label><select value={rd.teamSize || ""} onChange={e => u("teamSize", e.target.value)} style={selectStyle}><option value="">Select</option>{TEAM_SIZES.map(t => <option key={t}>{t}</option>)}</select></div>
        <div><label style={labelStyle}>Funded?</label><select value={rd.funded || ""} onChange={e => u("funded", e.target.value)} style={selectStyle}><option value="">Select</option>{FUNDED_OPTIONS.map(f => <option key={f}>{f}</option>)}</select></div>
      </div>
    </>
  );

  const renderHR = () => (
    <>
      <div><label style={labelStyle}>Company Name *</label><input value={rd.company || ""} onChange={e => u("company", e.target.value)} style={inputStyle} /></div>
      <div><label style={labelStyle}>Job Title *</label><select value={rd.hrTitle || ""} onChange={e => u("hrTitle", e.target.value)} style={selectStyle}><option value="">Select</option>{HR_TITLES.map(t => <option key={t}>{t}</option>)}</select></div>
      <div><label style={labelStyle}>Industry *</label><SearchableSelect options={INDUSTRIES} value={rd.industry || ""} onChange={v => u("industry", v)} placeholder="Search..." /></div>
      <div><label style={labelStyle}>Company Type</label><select value={rd.companyType || ""} onChange={e => u("companyType", e.target.value)} style={selectStyle}><option value="">Select</option>{COMPANY_TYPES.map(c => <option key={c}>{c}</option>)}</select></div>
      <div><label style={labelStyle}>Work Email (optional)</label><input value={rd.workEmail || ""} onChange={e => u("workEmail", e.target.value)} placeholder="you@company.com" style={inputStyle} /></div>
      <div><label style={labelStyle}>Working Since *</label><select value={rd.workingSince || ""} onChange={e => u("workingSince", e.target.value)} style={selectStyle}><option value="">Year</option>{yearRange(1980, currentYear).reverse().map(y => <option key={y}>{y}</option>)}</select></div>
    </>
  );

  const renderTrade = () => (
    <>
      <div><label style={labelStyle}>Trade / Skill Type *</label><SearchableSelect options={TRADE_TYPES} value={rd.tradeType || ""} onChange={v => u("tradeType", v)} placeholder="Search..." /></div>
      <div><label style={labelStyle}>Working in this trade since *</label><select value={rd.tradeSince || ""} onChange={e => u("tradeSince", e.target.value)} style={selectStyle}><option value="">Year</option>{yearRange(1970, currentYear).reverse().map(y => <option key={y}>{y}</option>)}</select></div>
    </>
  );

  const renderAspirant = () => (
    <>
      <div><label style={labelStyle}>Target Exam / Goal *</label><SearchableSelect options={ASPIRANT_EXAMS} value={rd.targetExam || ""} onChange={v => u("targetExam", v)} placeholder="Search..." /></div>
      <div><label style={labelStyle}>Currently preparing at</label><input value={rd.prepCentre || ""} onChange={e => u("prepCentre", e.target.value)} placeholder="Coaching centre or college (optional)" style={inputStyle} /></div>
      <div><label style={labelStyle}>Preparation Started Since *</label><select value={rd.prepSince || ""} onChange={e => u("prepSince", e.target.value)} style={selectStyle}><option value="">Year</option>{yearRange(2010, currentYear).reverse().map(y => <option key={y}>{y}</option>)}</select></div>
    </>
  );

  const roleRenderers: Record<string, () => JSX.Element> = {
    student: renderStudent, professional: renderProfessional, doctor: renderDoctor,
    government: renderGovernment, faculty: renderFaculty, builder: renderBuilder,
    hr: renderHR, skilled_trade: renderTrade, aspirant: renderAspirant,
  };

  return (
    <OnboardingShell step={4} showBack backTo="/onboarding/role">
      <div className="rounded-3xl p-6 sm:p-8" style={{ background: "#fff", border: "1px solid #F3F4F6", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <h1 className="text-[24px] sm:text-[28px] font-extrabold text-center mb-1" style={{ color: "#111827" }}>{getTitle()}</h1>
        <p className="text-center text-[13px] mb-7" style={{ color: "#6B7280" }}>This helps your community know who you are. You can edit this anytime.</p>

        <div className="space-y-5">
          {/* Block A: Identity */}
          <div className="pb-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-4" style={{ color: "#E8580A" }}>Your Identity</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label style={labelStyle}>First name *</label><input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Sai" style={inputStyle} /></div>
              <div><label style={labelStyle}>Last name *</label><input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Pudhari" style={inputStyle} /></div>
            </div>
            <div>
              <label style={labelStyle}>@username *</label>
              <div className="relative">
                <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30))} placeholder="your-username" style={inputStyle} />
                {usernameStatus === "available" && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#10B981" }} />}
                {usernameStatus === "taken" && <X className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#DC2626" }} />}
              </div>
              <p className="text-[11px] mt-1" style={{ color: usernameStatus === "taken" ? "#DC2626" : "#9CA3AF" }}>
                {usernameStatus === "taken" ? "Username taken" : `Your profile: tiikme.in/${username || "..."}`}
              </p>
            </div>
          </div>

          {/* Block B: Location */}
          <div className="pb-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-4" style={{ color: "#E8580A" }}>Location</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label style={labelStyle}>City *</label><input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Hyderabad" style={inputStyle} /></div>
              <div><label style={labelStyle}>State *</label><SearchableSelect options={INDIAN_STATES} value={state} onChange={setState} placeholder="Search state..." /></div>
            </div>
          </div>

          {/* Block C: Role-specific */}
          <div className="pb-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-4" style={{ color: "#E8580A" }}>
              {role === "student" ? "Education" : role === "professional" ? "Work" : role === "doctor" ? "Practice" : role === "government" ? "Service" : role === "faculty" ? "Teaching" : role === "builder" ? "Venture" : role === "hr" ? "Hiring" : role === "skilled_trade" ? "Trade" : "Preparation"}
            </p>
            <div className="space-y-4">
              {(roleRenderers[role] || renderStudent)()}
            </div>
          </div>

          {/* Block D: Headline */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-4" style={{ color: "#E8580A" }}>Profile Headline</p>
            <label style={labelStyle}>Short bio / Headline (optional)</label>
            <input value={headline} onChange={e => setHeadline(e.target.value.slice(0, 80))} placeholder={getHeadlinePlaceholder()} maxLength={80} style={inputStyle} />
            <p className="text-[11px] text-right mt-1" style={{ color: "#9CA3AF" }}>{headline.length}/80</p>
          </div>
        </div>

        <button
          onClick={handleComplete} disabled={submitting}
          className="w-full h-12 rounded-2xl text-[15px] font-bold text-white cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 mt-6 flex items-center justify-center gap-2"
          style={{ background: "#E8580A" }}
        >
          {submitting ? "Saving..." : "Complete profile →"}
        </button>

        <button onClick={handleSkip} className="block mx-auto mt-3 text-[13px] cursor-pointer hover:underline" style={{ color: "#6B7280" }}>
          Skip for now — I'll finish this from my profile
        </button>
      </div>
    </OnboardingShell>
  );
}
