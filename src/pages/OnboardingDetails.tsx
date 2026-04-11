import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingShell from "@/components/onboarding/OnboardingShell";

// ═══ CONSTANTS ═══

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const currentYear = new Date().getFullYear();
const yearRange = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => String(start + i));

const COUNTRIES_TOP = ["India","United States","United Kingdom","UAE","Canada","Australia","Singapore","Germany"];
const COUNTRIES_REST = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Austria","Azerbaijan",
  "Bahrain","Bangladesh","Belarus","Belgium","Bhutan","Bolivia","Bosnia","Brazil","Brunei","Bulgaria",
  "Cambodia","Cameroon","Chile","China","Colombia","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic",
  "Denmark","Dominican Republic","Ecuador","Egypt","Estonia","Ethiopia","Fiji","Finland","France",
  "Georgia","Ghana","Greece","Guatemala","Honduras","Hong Kong","Hungary","Iceland","Indonesia","Iran",
  "Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kuwait",
  "Kyrgyzstan","Laos","Latvia","Lebanon","Libya","Lithuania","Luxembourg","Macau","Malaysia","Maldives",
  "Malta","Mauritius","Mexico","Moldova","Mongolia","Montenegro","Morocco","Mozambique","Myanmar",
  "Nepal","Netherlands","New Zealand","Nicaragua","Nigeria","North Korea","North Macedonia","Norway",
  "Oman","Pakistan","Palestine","Panama","Paraguay","Peru","Philippines","Poland","Portugal","Qatar",
  "Romania","Russia","Rwanda","Saudi Arabia","Senegal","Serbia","South Africa","South Korea","Spain",
  "Sri Lanka","Sudan","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand",
  "Trinidad & Tobago","Tunisia","Turkey","Turkmenistan","Uganda","Ukraine","Uruguay","Uzbekistan",
  "Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];
const ALL_COUNTRIES = [...COUNTRIES_TOP, "──────────", ...COUNTRIES_REST];

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli","Daman & Diu","Delhi (NCT)",
  "Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry"
];

const CITY_SUGGESTIONS: Record<string, string[]> = {
  "Telangana": ["Hyderabad","Warangal","Khammam","Nizamabad","Karimnagar","Nalgonda","Mahbubnagar","Adilabad","Medak","Suryapet","Jagtial","Korutla","Siddipet"],
  "Maharashtra": ["Mumbai","Pune","Nagpur","Nashik","Aurangabad","Thane","Solapur","Kolhapur","Sangli","Satara","Amravati","Nanded"],
  "Karnataka": ["Bengaluru","Mysuru","Mangaluru","Hubli","Dharwad","Belgaum","Gulbarga","Shimoga","Tumkur","Davanagere"],
  "Tamil Nadu": ["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Erode","Tirunelveli","Vellore","Thanjavur"],
  "Delhi (NCT)": ["New Delhi","Dwarka","Rohini","Saket","Janakpuri","Pitampura","Laxmi Nagar"],
  "Uttar Pradesh": ["Lucknow","Noida","Ghaziabad","Agra","Varanasi","Kanpur","Prayagraj","Meerut","Aligarh","Bareilly"],
  "Gujarat": ["Ahmedabad","Surat","Vadodara","Rajkot","Gandhinagar","Bhavnagar","Junagadh","Jamnagar"],
  "Rajasthan": ["Jaipur","Jodhpur","Udaipur","Kota","Ajmer","Bikaner","Alwar","Bharatpur"],
  "West Bengal": ["Kolkata","Howrah","Durgapur","Asansol","Siliguri","Bardhaman","Malda","Kharagpur"],
  "Kerala": ["Thiruvananthapuram","Kochi","Kozhikode","Thrissur","Kannur","Kollam","Alappuzha","Palakkad"],
  "Madhya Pradesh": ["Bhopal","Indore","Jabalpur","Gwalior","Ujjain","Sagar","Rewa","Satna"],
  "Punjab": ["Chandigarh","Ludhiana","Amritsar","Jalandhar","Patiala","Bathinda","Mohali"],
  "Haryana": ["Gurugram","Faridabad","Ambala","Hisar","Panipat","Karnal","Rohtak","Sonipat"],
  "Bihar": ["Patna","Gaya","Muzaffarpur","Bhagalpur","Darbhanga","Purnia","Arrah"],
  "Odisha": ["Bhubaneswar","Cuttack","Rourkela","Berhampur","Sambalpur","Puri"],
  "Andhra Pradesh": ["Visakhapatnam","Vijayawada","Guntur","Nellore","Tirupati","Kurnool","Rajahmundry","Kakinada"],
  "Jharkhand": ["Ranchi","Jamshedpur","Dhanbad","Bokaro","Hazaribagh","Deoghar"],
  "Chhattisgarh": ["Raipur","Bhilai","Bilaspur","Korba","Durg","Rajnandgaon"],
  "Assam": ["Guwahati","Dibrugarh","Silchar","Jorhat","Nagaon","Tezpur"],
};

const DEGREES = [
  "── ENGINEERING & TECHNOLOGY ──",
  "B.Tech / B.E.","B.Tech Lateral Entry","B.Sc Engineering","BCA","B.Sc IT / Computer Science",
  "Diploma in Engineering (Polytechnic)","Integrated B.Tech + M.Tech","B.Tech + MBA (Dual degree)",
  "── MEDICAL & HEALTHCARE ──",
  "MBBS","BDS","BAMS","BHMS","BUMS","BNYS","B.Pharm","D.Pharm","B.Sc Nursing","GNM","ANM",
  "BPT","BOT","B.Sc Medical Lab Technology","B.Sc Radiology","B.Sc Optometry","BMLT",
  "BASLP","BVSc & AH",
  "── SCIENCE ──",
  "B.Sc","B.Sc (Hons.)","Integrated B.Sc + M.Sc","B.Sc Agriculture","B.Sc Horticulture",
  "B.Sc Forestry","B.Sc Home Science","B.Sc Food Technology","B.Sc Microbiology",
  "── COMMERCE & MANAGEMENT ──",
  "B.Com","B.Com (Hons.)","BBA","BMS","BBA LLB","BBM","BAF","BFM","BBI",
  "── ARTS & HUMANITIES ──",
  "BA","BA (Hons.)","BA LLB","BSW","B.Lib.I.Sc",
  "── LAW ──",
  "LLB (3 yrs)","BA LLB (5 yrs)","BBA LLB (5 yrs)","B.Com LLB (5 yrs)",
  "── DESIGN & CREATIVE ARTS ──",
  "B.Des","BFA","B.Arch","B.Plan","BMMMC","BA Journalism","B.Sc Animation",
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
const MBBS_BRANCHES = ["General Medicine","Surgery","Paediatrics","Obstetrics & Gynaecology","Orthopaedics","Dermatology","Ophthalmology","ENT","Radiology","Anesthesiology","Pathology","Microbiology","Pharmacology","Psychiatry","Forensic Medicine","Community Medicine","Other"];
const BSC_BRANCHES = ["Physics","Chemistry","Mathematics","Biology / Zoology / Botany","Biotechnology","Microbiology","Computer Science","Electronics","Statistics","Other"];
const MBA_BRANCHES = ["Marketing","Finance","HR","Operations","IT / Systems","Healthcare","International Business","Entrepreneurship","Other"];
const BA_BRANCHES = ["Economics","History","Political Science","Sociology","Psychology","Philosophy","English","Hindi","Regional Language","Geography","Other"];

const INDUSTRIES = [
  "── TECHNOLOGY & SOFTWARE ──",
  "Software Product (SaaS / Platform)","IT Services & Consulting","Startup / New-age Tech",
  "Semiconductors & Hardware","Cybersecurity","Artificial Intelligence / ML","Cloud Computing",
  "── MEDIA, DESIGN & CREATIVE ──",
  "Digital Media & OTT","Print & Broadcast Media","Advertising & PR Agency",
  "Creative / Design Studio","Film & Television Production","Gaming & Animation",
  "── MANUFACTURING ──",
  "Automotive & EV","Aerospace & Defence Manufacturing","Electronics & Consumer Goods",
  "FMCG & Packaged Goods","Chemicals & Petrochemicals","Textiles & Apparel",
  "Metals, Steel & Mining","Pharmaceuticals Manufacturing","Food Processing & Beverage",
  "Heavy Machinery & Equipment","Rubber & Plastics",
  "── SERVICES ──",
  "Management Consulting","Legal & Compliance Services","Accounting & Audit Firm",
  "Staffing & Recruitment Agency","Market Research & Analytics",
  "── HEALTHCARE ──",
  "Hospitals & Clinics","Diagnostics & Pathology Labs","Medical Devices & Equipment",
  "Pharmaceutical (R&D/Sales)","Telemedicine & Health Tech",
  "── FINANCIAL SERVICES ──",
  "Banking (Public Sector)","Banking (Private Sector)","Insurance",
  "NBFCs & Microfinance","Stock Broking & Wealth Management","Fintech (Payments, Lending, WealthTech)",
  "Venture Capital & Private Equity",
  "── INFRASTRUCTURE & CONSTRUCTION ──",
  "Real Estate & Property Development","Construction & EPC Projects",
  "Roads, Highways & Bridges","Urban Infrastructure & Smart Cities","Water & Sanitation",
  "── ENERGY & UTILITIES ──",
  "Oil & Gas","Power Generation (Thermal / Nuclear)","Renewable Energy (Solar / Wind / Hydro)",
  "EV Infrastructure & Charging","Water Utilities",
  "── GOVERNMENT & PUBLIC SECTOR ──",
  "Central Government Ministries","State Government Departments","Public Sector Enterprises (PSU)",
  "Defence & Armed Forces","Law Enforcement & Paramilitary",
  "── EDUCATION ──",
  "K-12 Schools","Higher Education (Colleges / Universities)","EdTech / Online Learning",
  "Coaching & Test Prep","Vocational Training & Skill Development",
  "── RETAIL & CONSUMER ──",
  "E-Commerce & Marketplace","Retail (Offline Stores / Chains)","D2C Brands","Luxury & Lifestyle",
  "── AGRICULTURE & ENVIRONMENT ──",
  "Agriculture & Agri-tech","Animal Husbandry & Dairy","Horticulture & Floriculture",
  "Forestry & Environment","Fisheries & Aquaculture",
  "── SOCIAL SECTOR ──",
  "NGO / Non-Profit / Trust","Government Welfare Schemes","Social Enterprise",
  "Other"
];

const COMPANY_TYPES = ["MNC","Indian Startup","Indian Enterprise","Public Sector / PSU","Family Business / SME","Agency / Studio / Firm","Freelancer / Self-employed","NGO / Non-profit"];
const EMPLOYMENT_TYPES = ["Full-time","Part-time","Contract","Freelance","Internship"];

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
const DOCTOR_ROLES = ["Junior Resident","Senior Resident","Consultant","Senior Consultant","Professor","HOD","Medical Director","Other"];

const GOVT_CADRES = [
  "── All India Services ──",
  "IAS (Indian Administrative Service)","IPS (Indian Police Service)","IFoS (Indian Forest Service)",
  "── Central Services Group A ──",
  "IRS (Income Tax)","IRS (Customs & Indirect Taxes)","IFS (Foreign Service)","IRAS","IRTS","IRSME",
  "IAAS","IIS","ICAS","IOFS","IPOS","IDES","ITS (Telecom)","IDAS",
  "Indian Statistical Service","Indian Economic Service","CSS / CSSS / CSCS",
  "CBI","Intelligence Bureau","RAW",
  "── Central Services Group B & C ──",
  "SSC CGL recruited","RRB recruited","NDA / CDS recruited",
  "── Armed Forces ──",
  "Indian Army (Officer)","Indian Army (JCO)","Indian Army (OR)",
  "Indian Navy (Officer)","Indian Navy (Sailor)",
  "Indian Air Force (Officer)","Indian Air Force (Airman)",
  "Defence Civilian (DRDO / Ordnance)",
  "── Paramilitary / CAPF ──",
  "BSF","CRPF","CISF","ITBP","SSB","NSG","Assam Rifles",
  "── Police (State) ──",
  "State Police (Constable to DGP)","Home Guard / SPO",
  "── Government Health ──",
  "ASHA Worker","ANM","Staff Nurse (Govt)","Medical Officer",
  "── Government Education ──",
  "Government School Teacher (PRT/TGT/PGT)","KVS / NVS Teacher","Govt College Lecturer / Professor",
  "── Government Banking / Finance ──",
  "SBI / PSU Bank Officer","RBI / NABARD / SEBI Officer","LIC / GIC Officer",
  "── Government Local Bodies ──",
  "Municipal Corporation","Panchayat Development Officer","Gram Sevak / VAO",
  "── PSU ──",
  "ONGC / BPCL / HPCL / IOC / GAIL","NTPC / Power Grid / NHPC","BHEL / BEL / HAL","BSNL / MTNL",
  "Coal India / NALCO / SAIL","AAI / Indian Railways","Other PSU",
  "── Judiciary ──",
  "District Court Staff","High Court Staff","Supreme Court Staff",
  "Other"
];

const GOVT_POSTING_TYPES = ["District HQ","Taluka / Block","Village / Gram Panchayat","State Capital","Central Govt (Delhi)","Field posting"];

const FACULTY_INST_TYPES = ["IIT","NIT","IIM","AIIMS / Medical College","Central University","State University","Deemed University","Private Engineering College","Private Medical College","Government Degree College","Private College","Polytechnic / Diploma Institute","School (Class 1–12)","International School","Research Institute (CSIR / DRDO)","Law School","Design Institute (NID / NIFT)","Other"];
const FACULTY_DEPTS = ["Computer Science","IT","AI & ML","Data Science","Electronics & Communication","Electrical","Mechanical","Civil","Chemical","Aerospace","Biotechnology","Physics","Chemistry","Mathematics","Statistics","Biology","Medicine","Surgery","Nursing","Pharmacy","Commerce","Management","Economics","History","Political Science","Sociology","Psychology","English","Hindi","Law","Architecture","Design","Agriculture","Education","Journalism","Environmental Science","Other"];
const FACULTY_DESIGNATIONS = ["Lecturer (ad-hoc)","Assistant Professor","Associate Professor","Professor","Professor of Practice","Visiting Professor","Research Associate","Postdoctoral Fellow","Senior Research Fellow","Junior Research Fellow","HOD","Principal / Vice-Principal","Director / VC","Dean","School Teacher (PGT / TGT / PRT)","Other"];

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

// ═══ UI HELPERS ═══

const inputStyle: React.CSSProperties = {
  background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 14,
  color: "#111827", height: 48, width: "100%", padding: "0 14px", fontSize: 14,
  outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif",
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6, display: "block" };

const SectionBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="pb-5 mb-5" style={{ borderLeft: "3px solid #E8580A", paddingLeft: 16 }}>
    <p className="text-[11px] font-bold uppercase tracking-wider mb-4" style={{ color: "#E8580A" }}>{title}</p>
    <div className="space-y-4">{children}</div>
  </div>
);

const MonthYearPicker = ({ monthKey, yearKey, rd, u, labelText, yearStart = 1970, yearEnd = currentYear + 10 }: {
  monthKey: string; yearKey: string; rd: Record<string, string>; u: (k: string, v: string) => void;
  labelText: string; yearStart?: number; yearEnd?: number;
}) => (
  <div>
    <label style={labelStyle}>{labelText}</label>
    <div className="grid grid-cols-2 gap-3">
      <select value={rd[monthKey] || ""} onChange={e => u(monthKey, e.target.value)} style={selectStyle}>
        <option value="">Month</option>
        {MONTHS.map((m, i) => <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>)}
      </select>
      <select value={rd[yearKey] || ""} onChange={e => u(yearKey, e.target.value)} style={selectStyle}>
        <option value="">Year</option>
        {yearRange(yearStart, yearEnd).reverse().map(y => <option key={y}>{y}</option>)}
      </select>
    </div>
  </div>
);

const SearchableSelect = ({ options, value, onChange, placeholder }: { options: string[]; value: string; onChange: (v: string) => void; placeholder: string }) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
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

const OtherTextInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div className="mt-2">
    <label style={labelStyle}>Please specify *</label>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
  </div>
);

// ═══ MAIN COMPONENT ═══

export default function OnboardingDetails() {
  const navigate = useNavigate();
  const { user, profile, refetchProfile } = useAuth();
  const role = sessionStorage.getItem("ob_role") || "student";
  const [submitting, setSubmitting] = useState(false);

  // Identity
  const isReturning = !!(profile?.first_name && profile?.onboarding_complete);
  const [firstName, setFirstName] = useState(isReturning ? (profile?.first_name || "") : "");
  const [lastName, setLastName] = useState(isReturning ? (profile?.last_name || "") : "");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  // Location — hierarchical
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [cityManual, setCityManual] = useState(false);

  // Role-specific data
  const [rd, setRd] = useState<Record<string, string>>({});
  const u = (k: string, v: string) => setRd(p => ({ ...p, [k]: v }));

  // Headline
  const [headline, setHeadline] = useState("");

  // Auto-generate username
  useEffect(() => {
    if (!firstName && !lastName) return;
    const base = (firstName + lastName).toLowerCase().replace(/[^a-z0-9]/g, "");
    const suffix = user?.id?.slice(0, 6) || "000000";
    setUsername(base + "-" + suffix);
  }, [firstName, lastName, user?.id]);

  // Check username
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

  // Reset state/city when country changes
  useEffect(() => { setState(""); setCity(""); setCityManual(false); }, [country]);
  useEffect(() => { setCity(""); setCityManual(false); }, [state]);

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

  const citySuggestions = country === "India" && state ? (CITY_SUGGESTIONS[state] || []) : [];

  const handleComplete = async () => {
    if (!firstName.trim() || !lastName.trim()) { toast.info("First and last name are required"); return; }
    if (!country || !state || !city.trim()) { toast.info("Location is required"); return; }
    if (!user) { toast.error("Not authenticated"); return; }

    setSubmitting(true);
    const roleMetadata: Record<string, any> = {};
    Object.entries(rd).forEach(([k, v]) => { if (v) roleMetadata[k] = v; });

    // Check for referrer from invite link
    const referredBy = localStorage.getItem("tiikme-referrer") || null;

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
      role_metadata: { ...roleMetadata, country } as any,
      onboarding_complete: true,
      referred_by: referredBy,
      updated_at: new Date().toISOString(),
    } as any, { onConflict: "id" });

    setSubmitting(false);
    if (error) { toast.error("Failed to save profile"); console.error(error); return; }

    sessionStorage.removeItem("ob_role");
    sessionStorage.removeItem("ob_email");
    if (referredBy) localStorage.removeItem("tiikme-referrer");
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

  // ═══ LOCATION BLOCK ═══
  const renderLocation = () => (
    <>
      <div>
        <label style={labelStyle}>Country *</label>
        <SearchableSelect options={ALL_COUNTRIES} value={country} onChange={setCountry} placeholder="Search country..." />
      </div>
      {country && (
        <div>
          <label style={labelStyle}>State / Province *</label>
          {country === "India" ? (
            <SearchableSelect options={INDIAN_STATES} value={state} onChange={setState} placeholder="Search state..." />
          ) : (
            <input value={state} onChange={e => setState(e.target.value)} placeholder="e.g. California, Ontario..." style={inputStyle} />
          )}
        </div>
      )}
      {state && (
        <div>
          <label style={labelStyle}>City / District / Village *</label>
          {citySuggestions.length > 0 && !cityManual ? (
            <>
              <SearchableSelect
                options={[...citySuggestions, "── My place is not listed ──"]}
                value={city}
                onChange={v => {
                  if (v === "── My place is not listed ──") { setCityManual(true); setCity(""); }
                  else setCity(v);
                }}
                placeholder="Search city or village..."
              />
            </>
          ) : (
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Korutla, Jagtial District" style={inputStyle} />
          )}
          {cityManual && (
            <button onClick={() => setCityManual(false)} className="text-[11px] mt-1 cursor-pointer hover:underline" style={{ color: "#E8580A" }}>← Back to suggestions</button>
          )}
        </div>
      )}
    </>
  );

  // ═══ ROLE-SPECIFIC RENDERERS ═══

  const renderStudent = () => (
    <>
      <div><label style={labelStyle}>College / University name *</label><input value={rd.institution || ""} onChange={e => u("institution", e.target.value)} placeholder="e.g. IIT Delhi" style={inputStyle} /></div>
      <div>
        <label style={labelStyle}>Degree / Program *</label>
        <SearchableSelect options={DEGREES} value={rd.degree || ""} onChange={v => u("degree", v)} placeholder="Search degree..." />
        {rd.degree === "Other" && <OtherTextInput value={rd.degreeOther || ""} onChange={v => u("degreeOther", v)} placeholder="Enter your degree" />}
      </div>
      <div>
        <label style={labelStyle}>Branch / Specialisation *</label>
        <SearchableSelect options={getBranchOptions()} value={rd.branch || ""} onChange={v => u("branch", v)} placeholder="Select branch..." />
        {rd.branch === "Other" && <OtherTextInput value={rd.branchOther || ""} onChange={v => u("branchOther", v)} placeholder="Enter your branch" />}
      </div>
      <MonthYearPicker monthKey="enrollMonth" yearKey="enrollYear" rd={rd} u={u} labelText="Enrolled in *" yearStart={2000} yearEnd={currentYear} />
      <div>
        <div className="flex items-center gap-2 mb-2">
          <input type="checkbox" checked={rd.alreadyGrad === "true"} onChange={e => u("alreadyGrad", e.target.checked ? "true" : "")}
            className="w-4 h-4 accent-[#E8580A] rounded cursor-pointer" id="gradCheck" />
          <label htmlFor="gradCheck" className="text-[13px] cursor-pointer" style={{ color: "#6B7280" }}>Already graduated</label>
        </div>
        {rd.alreadyGrad !== "true" && (
          <MonthYearPicker monthKey="gradMonth" yearKey="gradYear" rd={rd} u={u} labelText="Expected graduation *" yearStart={currentYear} yearEnd={currentYear + 10} />
        )}
      </div>
      <div><label style={labelStyle}>Student Email (optional)</label><input value={rd.studentEmail || ""} onChange={e => u("studentEmail", e.target.value)} placeholder="you@college.ac.in" style={inputStyle} /><p className="text-[11px] mt-1" style={{ color: "#9CA3AF" }}>Your @college.edu or .ac.in email for instant verification</p></div>
    </>
  );

  const renderProfessional = () => (
    <>
      <div><label style={labelStyle}>Company Name *</label><input value={rd.company || ""} onChange={e => u("company", e.target.value)} placeholder="e.g. Infosys" style={inputStyle} /></div>
      <div><label style={labelStyle}>Job Title / Designation *</label><input value={rd.jobTitle || ""} onChange={e => u("jobTitle", e.target.value)} placeholder="e.g. Senior Software Engineer" style={inputStyle} /></div>
      <div>
        <label style={labelStyle}>Industry *</label>
        <SearchableSelect options={INDUSTRIES} value={rd.industry || ""} onChange={v => u("industry", v)} placeholder="Search industry..." />
        {rd.industry === "Other" && <OtherTextInput value={rd.industryOther || ""} onChange={v => u("industryOther", v)} placeholder="Enter your industry" />}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label style={labelStyle}>Employment Type</label><select value={rd.empType || ""} onChange={e => u("empType", e.target.value)} style={selectStyle}><option value="">Select</option>{EMPLOYMENT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
        <div><label style={labelStyle}>Company Type</label><select value={rd.companyType || ""} onChange={e => u("companyType", e.target.value)} style={selectStyle}><option value="">Select</option>{COMPANY_TYPES.map(c => <option key={c}>{c}</option>)}</select></div>
      </div>
      <MonthYearPicker monthKey="startMonth" yearKey="startYear" rd={rd} u={u} labelText="Start date *" yearStart={1980} yearEnd={currentYear} />
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={rd.currentlyHere !== "false"} onChange={e => u("currentlyHere", e.target.checked ? "true" : "false")}
          className="w-4 h-4 accent-[#E8580A] rounded cursor-pointer" id="currentWork" />
        <label htmlFor="currentWork" className="text-[13px] cursor-pointer" style={{ color: "#6B7280" }}>I currently work here</label>
      </div>
      {rd.currentlyHere === "false" && (
        <MonthYearPicker monthKey="endMonth" yearKey="endYear" rd={rd} u={u} labelText="End date" yearStart={1980} yearEnd={currentYear} />
      )}
      <div><label style={labelStyle}>Work Email (optional)</label><input value={rd.workEmail || ""} onChange={e => u("workEmail", e.target.value)} placeholder="you@company.com" style={inputStyle} /></div>
      <p className="text-[11px] p-3 rounded-lg" style={{ background: "#FFF8F2", color: "#9CA3AF", border: "1px dashed #E5E7EB" }}>
        You can add previous companies and experience from your profile after signup →
      </p>
    </>
  );

  const renderDoctor = () => (
    <>
      <div><label style={labelStyle}>Hospital / Clinic Name *</label><input value={rd.hospital || ""} onChange={e => u("hospital", e.target.value)} placeholder="e.g. Apollo Hospitals" style={inputStyle} /></div>
      <div>
        <label style={labelStyle}>Specialisation *</label>
        <SearchableSelect options={DOCTOR_SPECIALISATIONS} value={rd.specialisation || ""} onChange={v => u("specialisation", v)} placeholder="Search..." />
        {rd.specialisation === "Other" && <OtherTextInput value={rd.specOther || ""} onChange={v => u("specOther", v)} placeholder="Enter your specialisation" />}
      </div>
      <div>
        <label style={labelStyle}>Degree *</label>
        <select value={rd.medicalDegree || ""} onChange={e => u("medicalDegree", e.target.value)} style={selectStyle}>
          <option value="">Select</option>{DOCTOR_DEGREES.map(d => <option key={d}>{d}</option>)}
        </select>
        {rd.medicalDegree === "Other" && <OtherTextInput value={rd.degreeOther || ""} onChange={v => u("degreeOther", v)} placeholder="Enter your degree" />}
      </div>
      <div><label style={labelStyle}>Role *</label><select value={rd.doctorRole || ""} onChange={e => u("doctorRole", e.target.value)} style={selectStyle}><option value="">Select</option>{DOCTOR_ROLES.map(r => <option key={r}>{r}</option>)}</select></div>
      <MonthYearPicker monthKey="practiceStartMonth" yearKey="practiceStartYear" rd={rd} u={u} labelText="Start of practice *" yearStart={1970} yearEnd={currentYear} />
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={rd.currentlyPractising !== "false"} onChange={e => u("currentlyPractising", e.target.checked ? "true" : "false")}
          className="w-4 h-4 accent-[#E8580A] rounded cursor-pointer" id="currentPractice" />
        <label htmlFor="currentPractice" className="text-[13px] cursor-pointer" style={{ color: "#6B7280" }}>Currently practising here</label>
      </div>
      <div><label style={labelStyle}>Registration Number (optional)</label><input value={rd.regNumber || ""} onChange={e => u("regNumber", e.target.value)} placeholder="NMC / State Medical Council" style={inputStyle} /></div>
    </>
  );

  const renderGovernment = () => (
    <>
      <div><label style={labelStyle}>Ministry / Department *</label><input value={rd.institution || ""} onChange={e => u("institution", e.target.value)} placeholder="e.g. Ministry of Finance" style={inputStyle} /></div>
      <div><label style={labelStyle}>Post / Designation *</label><input value={rd.designation || ""} onChange={e => u("designation", e.target.value)} placeholder="e.g. Section Officer" style={inputStyle} /></div>
      <div>
        <label style={labelStyle}>Service / Cadre *</label>
        <SearchableSelect options={GOVT_CADRES} value={rd.cadre || ""} onChange={v => u("cadre", v)} placeholder="Search service..." />
        {rd.cadre === "Other" && <OtherTextInput value={rd.cadreOther || ""} onChange={v => u("cadreOther", v)} placeholder="Enter your service/cadre" />}
      </div>
      <div>
        <label style={labelStyle}>Posting location type</label>
        <div className="flex flex-wrap gap-2">
          {GOVT_POSTING_TYPES.map(t => (
            <button key={t} onClick={() => u("postingType", t)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-all"
              style={{ border: `1.5px solid ${rd.postingType === t ? "#E8580A" : "#E5E7EB"}`, background: rd.postingType === t ? "#FFF8F2" : "#fff", color: rd.postingType === t ? "#E8580A" : "#6B7280" }}
            >{t}</button>
          ))}
        </div>
      </div>
      {rd.postingType === "Village / Gram Panchayat" && (
        <>
          <div><label style={labelStyle}>Village / Gram Panchayat name *</label><input value={rd.villageName || ""} onChange={e => u("villageName", e.target.value)} placeholder="e.g. Maddur Gram Panchayat" style={inputStyle} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label style={labelStyle}>District *</label><input value={rd.postingDistrict || ""} onChange={e => u("postingDistrict", e.target.value)} placeholder="e.g. Jagtial" style={inputStyle} /></div>
            <div><label style={labelStyle}>Block / Taluka *</label><input value={rd.postingBlock || ""} onChange={e => u("postingBlock", e.target.value)} placeholder="e.g. Korutla" style={inputStyle} /></div>
          </div>
        </>
      )}
      <MonthYearPicker monthKey="joinMonth" yearKey="joinYear" rd={rd} u={u} labelText="Since joining *" yearStart={1970} yearEnd={currentYear} />
      <div><label style={labelStyle}>Official Email (optional)</label><input value={rd.officialEmail || ""} onChange={e => u("officialEmail", e.target.value)} placeholder="you@gov.in" style={inputStyle} /><p className="text-[11px] mt-1" style={{ color: "#9CA3AF" }}>Add .gov.in or .nic.in email for instant verification</p></div>
    </>
  );

  const renderFaculty = () => (
    <>
      <div><label style={labelStyle}>Institution Name *</label><input value={rd.institution || ""} onChange={e => u("institution", e.target.value)} placeholder="e.g. IIT Bombay" style={inputStyle} /></div>
      <div>
        <label style={labelStyle}>Type of Institution</label>
        <select value={rd.instType || ""} onChange={e => u("instType", e.target.value)} style={selectStyle}>
          <option value="">Select</option>{FACULTY_INST_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        {rd.instType === "Other" && <OtherTextInput value={rd.instTypeOther || ""} onChange={v => u("instTypeOther", v)} placeholder="Enter institution type" />}
      </div>
      <div>
        <label style={labelStyle}>Department *</label>
        <SearchableSelect options={FACULTY_DEPTS} value={rd.department || ""} onChange={v => u("department", v)} placeholder="Search..." />
        {rd.department === "Other" && <OtherTextInput value={rd.deptOther || ""} onChange={v => u("deptOther", v)} placeholder="Enter your department" />}
      </div>
      <div>
        <label style={labelStyle}>Designation *</label>
        <select value={rd.faculty_designation || ""} onChange={e => u("faculty_designation", e.target.value)} style={selectStyle}>
          <option value="">Select</option>{FACULTY_DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
        </select>
        {rd.faculty_designation === "Other" && <OtherTextInput value={rd.facDesigOther || ""} onChange={v => u("facDesigOther", v)} placeholder="Enter your designation" />}
      </div>
      <MonthYearPicker monthKey="teachStartMonth" yearKey="teachStartYear" rd={rd} u={u} labelText="Teaching Since *" yearStart={1970} yearEnd={currentYear} />
      <div><label style={labelStyle}>Institution Email (optional)</label><input value={rd.instEmail || ""} onChange={e => u("instEmail", e.target.value)} placeholder="you@college.ac.in" style={inputStyle} /></div>
    </>
  );

  const renderBuilder = () => (
    <>
      <div><label style={labelStyle}>Startup / Company Name</label><input value={rd.company || ""} onChange={e => u("company", e.target.value)} placeholder="Optional" style={inputStyle} /></div>
      <div><label style={labelStyle}>What are you building? *</label><input value={rd.whatBuilding || ""} onChange={e => u("whatBuilding", e.target.value.slice(0, 100))} placeholder="e.g. An AI-powered crop disease detection app" maxLength={100} style={inputStyle} /><p className="text-[11px] text-right mt-1" style={{ color: "#9CA3AF" }}>{(rd.whatBuilding || "").length}/100</p></div>
      <div><label style={labelStyle}>Stage *</label><select value={rd.stage || ""} onChange={e => u("stage", e.target.value)} style={selectStyle}><option value="">Select</option>{BUILDER_STAGES.map(s => <option key={s}>{s}</option>)}</select></div>
      <div>
        <label style={labelStyle}>Industry / Domain *</label>
        <SearchableSelect options={INDUSTRIES} value={rd.industry || ""} onChange={v => u("industry", v)} placeholder="Search..." />
        {rd.industry === "Other" && <OtherTextInput value={rd.industryOther || ""} onChange={v => u("industryOther", v)} placeholder="Enter your industry" />}
      </div>
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
      <div>
        <label style={labelStyle}>Industry *</label>
        <SearchableSelect options={INDUSTRIES} value={rd.industry || ""} onChange={v => u("industry", v)} placeholder="Search..." />
        {rd.industry === "Other" && <OtherTextInput value={rd.industryOther || ""} onChange={v => u("industryOther", v)} placeholder="Enter your industry" />}
      </div>
      <div><label style={labelStyle}>Company Type</label><select value={rd.companyType || ""} onChange={e => u("companyType", e.target.value)} style={selectStyle}><option value="">Select</option>{COMPANY_TYPES.map(c => <option key={c}>{c}</option>)}</select></div>
      <MonthYearPicker monthKey="startMonth" yearKey="startYear" rd={rd} u={u} labelText="Working Since *" yearStart={1980} yearEnd={currentYear} />
      <div><label style={labelStyle}>Work Email (optional)</label><input value={rd.workEmail || ""} onChange={e => u("workEmail", e.target.value)} placeholder="you@company.com" style={inputStyle} /></div>
    </>
  );

  const renderTrade = () => (
    <>
      <div>
        <label style={labelStyle}>Trade / Skill Type *</label>
        <SearchableSelect options={TRADE_TYPES} value={rd.tradeType || ""} onChange={v => u("tradeType", v)} placeholder="Search..." />
        {rd.tradeType === "Other" && <OtherTextInput value={rd.tradeOther || ""} onChange={v => u("tradeOther", v)} placeholder="Enter your trade" />}
      </div>
      <MonthYearPicker monthKey="tradeStartMonth" yearKey="tradeStartYear" rd={rd} u={u} labelText="Working in this trade since *" yearStart={1970} yearEnd={currentYear} />
    </>
  );

  const renderAspirant = () => (
    <>
      <div>
        <label style={labelStyle}>Target Exam / Goal *</label>
        <SearchableSelect options={ASPIRANT_EXAMS} value={rd.targetExam || ""} onChange={v => u("targetExam", v)} placeholder="Search..." />
        {rd.targetExam === "Other" && <OtherTextInput value={rd.examOther || ""} onChange={v => u("examOther", v)} placeholder="Enter your target exam" />}
      </div>
      <div><label style={labelStyle}>Currently preparing at</label><input value={rd.prepCentre || ""} onChange={e => u("prepCentre", e.target.value)} placeholder="Coaching centre or college (optional)" style={inputStyle} /></div>
      <MonthYearPicker monthKey="prepStartMonth" yearKey="prepStartYear" rd={rd} u={u} labelText="Preparation Started Since *" yearStart={2010} yearEnd={currentYear} />
    </>
  );

  const roleRenderers: Record<string, () => JSX.Element> = {
    student: renderStudent, professional: renderProfessional, doctor: renderDoctor,
    government: renderGovernment, faculty: renderFaculty, builder: renderBuilder,
    hr: renderHR, skilled_trade: renderTrade, aspirant: renderAspirant,
  };

  const roleSectionTitle: Record<string, string> = {
    student: "Education", professional: "Current Job", doctor: "Practice",
    government: "Service Details", faculty: "Teaching", builder: "Venture",
    hr: "Hiring Details", skilled_trade: "Trade", aspirant: "Preparation",
  };

  return (
    <OnboardingShell step={4} showBack backTo="/onboarding/role">
      <div className="rounded-3xl p-6 sm:p-8" style={{ background: "#fff", border: "1px solid #F3F4F6", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <h1 className="text-[24px] sm:text-[28px] font-extrabold text-center mb-1" style={{ color: "#111827" }}>{getTitle()}</h1>
        <p className="text-center text-[13px] mb-7" style={{ color: "#6B7280" }}>This helps your community know who you are. You can edit this anytime.</p>

        {/* Section 1: Your Name */}
        <SectionBlock title="Your Name">
          <div className="grid grid-cols-2 gap-3">
            <div><label style={labelStyle}>First name *</label><input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Rahul" style={inputStyle} /></div>
            <div><label style={labelStyle}>Last name *</label><input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Sharma" style={inputStyle} /></div>
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
        </SectionBlock>

        {/* Section 2: Location */}
        <SectionBlock title="Where Are You?">
          {renderLocation()}
        </SectionBlock>

        {/* Section 3: Role-specific */}
        <SectionBlock title={roleSectionTitle[role] || "Details"}>
          {(roleRenderers[role] || renderStudent)()}
        </SectionBlock>

        {/* Section 4: Headline */}
        <SectionBlock title="Profile Headline">
          <div>
            <label style={labelStyle}>Short bio / Headline (optional)</label>
            <input value={headline} onChange={e => setHeadline(e.target.value.slice(0, 80))} placeholder={getHeadlinePlaceholder()} maxLength={80} style={inputStyle} />
            <p className="text-[11px] text-right mt-1" style={{ color: "#9CA3AF" }}>{headline.length}/80</p>
          </div>
        </SectionBlock>

        <button
          onClick={handleComplete} disabled={submitting}
          className="w-full h-12 rounded-2xl text-[15px] font-bold text-white cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
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
