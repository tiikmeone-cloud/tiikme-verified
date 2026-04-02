import { Input } from "@/components/ui/input";

const inputS: React.CSSProperties = { background: "rgba(238,240,255,0.05)", border: "1.5px solid rgba(238,240,255,0.1)", borderRadius: 12, color: "#EEF0FF", height: 44 };
const selectS: React.CSSProperties = { background: "rgba(238,240,255,0.05)", border: "1.5px solid rgba(238,240,255,0.1)", borderRadius: 12, color: "#EEF0FF", height: 44 };
const labelS: React.CSSProperties = { color: "rgba(238,240,255,0.4)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 6, display: "block" };

interface RoleFieldsProps {
  role: string;
  data: Record<string, string>;
  update: (key: string, val: string) => void;
}

const privateIndustries = ["Technology & IT", "Banking & Finance", "Healthcare", "Manufacturing", "Retail", "Education", "Real Estate", "Media", "Logistics", "Legal", "Other"];
const privateFunctions = ["Engineering", "Product", "Sales", "Marketing", "Operations", "HR", "Finance", "Legal", "R&D", "Other"];
const psuList = ["NTPC", "ISRO", "DRDO", "BHEL", "Coal India", "ONGC", "IOC", "BPCL", "SAIL", "GAIL", "HAL", "BEL", "BSNL", "Other"];
const govtServices = ["IAS", "IPS", "IFS", "IRS", "State PCS", "Group A Central", "Group B", "Group C", "Teaching Service", "Police", "Revenue", "Other"];
const indianStates = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];
const qualifications = ["MBBS", "MD", "MS", "BDS", "Nursing", "AYUSH", "Physiotherapy", "Other"];
const doctorLevels = ["Intern", "Junior Resident", "Senior Resident", "Consultant", "Senior Consultant", "HOD", "Superintendent"];
const tradeTypes = ["Electrician", "Plumber", "Carpenter", "Mechanic", "Welder", "Mason", "Painter", "HVAC", "Tailor", "Other"];
const hrRoles = ["HR Manager", "Talent Acquisition", "Campus Recruiter", "Recruiter", "CHRO"];
const startupStages = ["Idea", "Building MVP", "Launched", "Revenue generating", "Funded", "Exited"];
const founderTypes = ["Founder", "Co-founder", "Angel Investor", "VC", "Advisor", "Indie Builder"];
const exams = ["UPSC CSE", "SSC CGL", "IBPS PO", "NDA", "State PSC", "RBI Grade B", "Other"];
const prepStages = ["Starting", "Prelims", "Mains", "Interview"];
const years = Array.from({ length: 46 }, (_, i) => String(2025 - i));

const Select = ({ value, onChange, placeholder, options, style }: { value: string; onChange: (v: string) => void; placeholder: string; options: string[]; style?: React.CSSProperties }) => (
  <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 text-[14px] outline-none cursor-pointer" style={{ ...selectS, ...style }}>
    <option value="">{placeholder}</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

export default function RoleFields({ role, data, update }: RoleFieldsProps) {
  if (role === "professional") return (
    <div className="space-y-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(238,240,255,0.08)" }}>
      <p style={{ ...labelS, fontSize: 11, marginBottom: 10 }}>About your work</p>
      <Select value={data.sector || ""} onChange={v => update("sector", v)} placeholder="Sector type" options={["Private Sector", "Government (Central)", "Government (State)", "PSU / Public Sector", "Defence / Armed Forces", "Self-employed", "NGO"]} />
      {data.sector === "Private Sector" && <>
        <Select value={data.industry || ""} onChange={v => update("industry", v)} placeholder="Industry" options={privateIndustries} />
        <Select value={data.function || ""} onChange={v => update("function", v)} placeholder="Function / Department" options={privateFunctions} />
        <Input placeholder="Job title / Designation" value={data.designation || ""} onChange={e => update("designation", e.target.value)} style={inputS} />
        <Select value={data.startYear || ""} onChange={v => update("startYear", v)} placeholder="Start year" options={years} />
      </>}
      {data.sector === "Government (Central)" && <>
        <Input placeholder="Designation" value={data.designation || ""} onChange={e => update("designation", e.target.value)} style={inputS} />
        <Input placeholder="Grade / Pay level (optional)" value={data.grade || ""} onChange={e => update("grade", e.target.value)} style={inputS} />
      </>}
      {data.sector === "Government (State)" && <>
        <Select value={data.govState || ""} onChange={v => update("govState", v)} placeholder="State" options={indianStates} />
        <Input placeholder="Department" value={data.department || ""} onChange={e => update("department", e.target.value)} style={inputS} />
        <Input placeholder="Designation" value={data.designation || ""} onChange={e => update("designation", e.target.value)} style={inputS} />
      </>}
      {data.sector === "PSU / Public Sector" && <>
        <Select value={data.psuName || ""} onChange={v => update("psuName", v)} placeholder="PSU name" options={psuList} />
        <Input placeholder="Division / Plant (optional)" value={data.division || ""} onChange={e => update("division", e.target.value)} style={inputS} />
        <Input placeholder="Designation + Grade (E1-E9)" value={data.designation || ""} onChange={e => update("designation", e.target.value)} style={inputS} />
      </>}
    </div>
  );

  if (role === "government") return (
    <div className="space-y-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(238,240,255,0.08)" }}>
      <p style={{ ...labelS, fontSize: 11, marginBottom: 10 }}>Your service profile</p>
      <Select value={data.govSubtype || ""} onChange={v => update("govSubtype", v)} placeholder="Sub-type" options={["Central Government", "State Government", "District / Local Body", "PSU", "Constitutional Body", "Statutory Body"]} />
      <Select value={data.serviceType || ""} onChange={v => update("serviceType", v)} placeholder="Service type" options={govtServices} />
      <Input placeholder="Designation" value={data.designation || ""} onChange={e => update("designation", e.target.value)} style={inputS} />
      <Input placeholder="Posting location" value={data.postingLocation || ""} onChange={e => update("postingLocation", e.target.value)} style={inputS} />
    </div>
  );

  if (role === "doctor") return (
    <div className="space-y-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(238,240,255,0.08)" }}>
      <p style={{ ...labelS, fontSize: 11, marginBottom: 10 }}>Your medical profile</p>
      <Select value={data.qualification || ""} onChange={v => update("qualification", v)} placeholder="Qualification" options={qualifications} />
      <Input placeholder="Specialisation" value={data.specialisation || ""} onChange={e => update("specialisation", e.target.value)} style={inputS} />
      <Select value={data.doctorLevel || ""} onChange={v => update("doctorLevel", v)} placeholder="Current level" options={doctorLevels} />
    </div>
  );

  if (role === "faculty") return (
    <div className="space-y-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(238,240,255,0.08)" }}>
      <p style={{ ...labelS, fontSize: 11, marginBottom: 10 }}>Your teaching profile</p>
      <Input placeholder="Department" value={data.department || ""} onChange={e => update("department", e.target.value)} style={inputS} />
      <Select value={data.designation || ""} onChange={v => update("designation", v)} placeholder="Designation" options={["Professor", "Associate Professor", "Assistant Professor", "Lecturer"]} />
    </div>
  );

  if (role === "skilled_trade") return (
    <div className="space-y-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(238,240,255,0.08)" }}>
      <p style={{ ...labelS, fontSize: 11, marginBottom: 10 }}>Your trade</p>
      <Select value={data.tradeType || ""} onChange={v => update("tradeType", v)} placeholder="Trade type" options={tradeTypes} />
      <Input type="number" placeholder="Years of experience" value={data.tradeYears || ""} onChange={e => update("tradeYears", e.target.value)} style={inputS} />
      <Select value={data.workType || ""} onChange={v => update("workType", v)} placeholder="Work type" options={["Residential", "Commercial", "Industrial", "Mixed"]} />
    </div>
  );

  if (role === "hr") return (
    <div className="space-y-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(238,240,255,0.08)" }}>
      <p style={{ ...labelS, fontSize: 11, marginBottom: 10 }}>Your HR role</p>
      <Select value={data.hrRole || ""} onChange={v => update("hrRole", v)} placeholder="Your HR role" options={hrRoles} />
      <Select value={data.teamSize || ""} onChange={v => update("teamSize", v)} placeholder="Team size" options={["1-10", "11-50", "51-200", "200+"]} />
    </div>
  );

  if (role === "builder") return (
    <div className="space-y-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(238,240,255,0.08)" }}>
      <p style={{ ...labelS, fontSize: 11, marginBottom: 10 }}>Your venture</p>
      <Select value={data.startupStage || ""} onChange={v => update("startupStage", v)} placeholder="Stage" options={startupStages} />
      <Select value={data.founderType || ""} onChange={v => update("founderType", v)} placeholder="Sub-type" options={founderTypes} />
    </div>
  );

  if (role === "aspirant") return (
    <div className="space-y-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(238,240,255,0.08)" }}>
      <p style={{ ...labelS, fontSize: 11, marginBottom: 10 }}>Your preparation</p>
      <Select value={data.exam || ""} onChange={v => update("exam", v)} placeholder="Exam preparing for" options={exams} />
      <Select value={data.prepStage || ""} onChange={v => update("prepStage", v)} placeholder="Current stage" options={prepStages} />
    </div>
  );

  return null;
}
