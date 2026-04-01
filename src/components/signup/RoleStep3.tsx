import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const inputS: React.CSSProperties = { background: "rgba(238,240,255,0.05)", border: "1.5px solid rgba(238,240,255,0.1)", borderRadius: 12, color: "#EEF0FF", height: 44 };
const selectS: React.CSSProperties = { background: "rgba(238,240,255,0.05)", border: "1.5px solid rgba(238,240,255,0.1)", borderRadius: 12, color: "#EEF0FF", height: 44 };
const months = ["01","02","03","04","05","06","07","08","09","10","11","12"];
const years = Array.from({ length: 30 }, (_, i) => String(2026 - i));

interface RoleStep3Props {
  role: string;
  roleData: Record<string, string>;
  onFinish: () => void;
  onSkip: () => void;
}

export default function RoleStep3({ role, roleData, onFinish, onSkip }: RoleStep3Props) {
  const [data, setData] = useState<Record<string, string>>({});
  const [showInternship, setShowInternship] = useState(false);
  const u = (k: string, v: string) => setData(p => ({ ...p, [k]: v }));

  const glassCard: React.CSSProperties = { background: "rgba(8,11,42,0.85)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", border: "1px solid rgba(238,240,255,0.08)", borderRadius: 24 };

  const getTitle = () => {
    switch (role) {
      case "student": return showInternship ? "Your internship" : "Add your first project";
      case "professional": return "Your current role";
      case "government": return "Your service profile";
      case "doctor": return "Your medical profile";
      case "faculty": return "What do you teach?";
      case "skilled_trade": return "Your first completed job";
      case "hr": return "Your hiring focus";
      case "builder": return "Your venture details";
      case "aspirant": return "Your preparation journey";
      default: return "Add your first entry";
    }
  };

  const renderStudentProject = () => (
    <div className="space-y-3">
      <Input placeholder="Project title" value={data.title || ""} onChange={e => u("title", e.target.value)} style={inputS} />
      <textarea placeholder="Describe what you built..." value={data.description || ""} onChange={e => u("description", e.target.value)} rows={2}
        className="w-full rounded-xl p-3 text-[13px] outline-none resize-none" style={{ background: "rgba(238,240,255,0.05)", border: "1.5px solid rgba(238,240,255,0.1)", color: "#EEF0FF" }} />
      <select value={data.type || ""} onChange={e => u("type", e.target.value)} className="w-full px-3 text-[14px] outline-none cursor-pointer" style={selectS}>
        <option value="">Project type</option>
        <option>Capstone</option><option>Hackathon</option><option>Research</option><option>Personal</option><option>Open Source</option>
      </select>
      <Input placeholder="Project link (optional)" value={data.link || ""} onChange={e => u("link", e.target.value)} style={inputS} />
      <div className="flex gap-2 pt-2">
        <button onClick={() => setShowInternship(true)} className="text-[12px] font-semibold px-3 py-2 rounded-xl cursor-pointer" style={{ border: "1.5px dashed rgba(238,240,255,0.12)", color: "rgba(238,240,255,0.5)" }}>I'm doing an internship</button>
      </div>
    </div>
  );

  const renderInternship = () => (
    <div className="space-y-3">
      <Input placeholder="Company name" value={data.company || ""} onChange={e => u("company", e.target.value)} style={inputS} />
      <Input placeholder="Your role / designation" value={data.internRole || ""} onChange={e => u("internRole", e.target.value)} style={inputS} />
      <div className="grid grid-cols-2 gap-3">
        <select value={data.startMonth || ""} onChange={e => u("startMonth", e.target.value)} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={selectS}><option value="">Start MM</option>{months.map(m => <option key={m}>{m}</option>)}</select>
        <select value={data.startYear || ""} onChange={e => u("startYear", e.target.value)} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={selectS}><option value="">Start YYYY</option>{years.map(y => <option key={y}>{y}</option>)}</select>
      </div>
      <Input placeholder="What you're working on (optional)" value={data.workDesc || ""} onChange={e => u("workDesc", e.target.value)} style={inputS} />
      <button onClick={() => setShowInternship(false)} className="text-[12px] cursor-pointer" style={{ color: "var(--brand, #3D5AF1)" }}>← Back to project form</button>
    </div>
  );

  const renderProfessional = () => (
    <div className="space-y-3">
      <Input placeholder="Job title" value={data.title || ""} onChange={e => u("title", e.target.value)} style={inputS} />
      <Input placeholder="Company" value={roleData.company || data.company || ""} onChange={e => u("company", e.target.value)} style={inputS} />
      <div className="grid grid-cols-2 gap-3">
        <select value={data.startMonth || ""} onChange={e => u("startMonth", e.target.value)} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={selectS}><option value="">Start MM</option>{months.map(m => <option key={m}>{m}</option>)}</select>
        <select value={data.startYear || ""} onChange={e => u("startYear", e.target.value)} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={selectS}><option value="">Start YYYY</option>{years.map(y => <option key={y}>{y}</option>)}</select>
      </div>
    </div>
  );

  const renderGovernment = () => (
    <div className="space-y-3">
      <Input placeholder="Designation" value={roleData.designation || data.designation || ""} onChange={e => u("designation", e.target.value)} style={inputS} />
      <Input placeholder="Department" value={roleData.department || data.dept || ""} onChange={e => u("dept", e.target.value)} style={inputS} />
      <Input placeholder="Posting location" value={data.postingLoc || ""} onChange={e => u("postingLoc", e.target.value)} style={inputS} />
      <select value={data.joinedYear || ""} onChange={e => u("joinedYear", e.target.value)} className="w-full px-3 text-[14px] outline-none cursor-pointer" style={selectS}>
        <option value="">Joined year</option>{years.map(y => <option key={y}>{y}</option>)}
      </select>
    </div>
  );

  const renderDoctor = () => (
    <div className="space-y-3">
      <Input placeholder="NMC Registration (optional)" value={data.nmc || ""} onChange={e => u("nmc", e.target.value)} style={inputS} />
      <Input placeholder="Specialisation" value={roleData.specialisation || data.spec || ""} onChange={e => u("spec", e.target.value)} style={inputS} />
      <Input placeholder="Hospital" value={roleData.hospital || data.hospital || ""} onChange={e => u("hospital", e.target.value)} style={inputS} />
    </div>
  );

  const renderFaculty = () => (
    <div className="space-y-3">
      <Input placeholder="Department" value={roleData.department || data.dept || ""} onChange={e => u("dept", e.target.value)} style={inputS} />
      <Input placeholder="Subjects taught (comma separated)" value={data.subjects || ""} onChange={e => u("subjects", e.target.value)} style={inputS} />
      <Input type="number" placeholder="Years teaching" value={data.yearsTeaching || ""} onChange={e => u("yearsTeaching", e.target.value)} style={inputS} />
    </div>
  );

  const renderTrade = () => (
    <div className="space-y-3">
      <Input placeholder='Job title (e.g. "3BHK house wiring")' value={data.title || ""} onChange={e => u("title", e.target.value)} style={inputS} />
      <Input placeholder="Location (city)" value={data.loc || ""} onChange={e => u("loc", e.target.value)} style={inputS} />
      <div className="grid grid-cols-2 gap-3">
        <select value={data.compMonth || ""} onChange={e => u("compMonth", e.target.value)} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={selectS}><option value="">Month</option>{months.map(m => <option key={m}>{m}</option>)}</select>
        <select value={data.compYear || ""} onChange={e => u("compYear", e.target.value)} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={selectS}><option value="">Year</option>{years.map(y => <option key={y}>{y}</option>)}</select>
      </div>
    </div>
  );

  const renderHR = () => (
    <div className="space-y-3">
      <Input placeholder="Domains you hire for (comma separated)" value={data.hiringDomains || ""} onChange={e => u("hiringDomains", e.target.value)} style={inputS} />
      <select value={data.hiringTeamSize || ""} onChange={e => u("hiringTeamSize", e.target.value)} className="w-full px-3 text-[14px] outline-none cursor-pointer" style={selectS}>
        <option value="">Typical team size you hire for</option>
        <option>1-5</option><option>6-20</option><option>21-50</option><option>50+</option>
      </select>
    </div>
  );

  const renderAspirant = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <select value={data.prepStartMonth || ""} onChange={e => u("prepStartMonth", e.target.value)} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={selectS}><option value="">Prep started MM</option>{months.map(m => <option key={m}>{m}</option>)}</select>
        <select value={data.prepStartYear || ""} onChange={e => u("prepStartYear", e.target.value)} className="w-full h-10 rounded-lg px-2 text-[13px] outline-none cursor-pointer" style={selectS}><option value="">Prep started YYYY</option>{years.map(y => <option key={y}>{y}</option>)}</select>
      </div>
      <Input placeholder="Current stage" value={roleData.prepStage || data.stage || ""} onChange={e => u("stage", e.target.value)} style={inputS} />
    </div>
  );

  const renderBuilder = () => (
    <div className="space-y-3">
      <Input placeholder="Startup / Project name" value={roleData.startupName || data.name || ""} onChange={e => u("name", e.target.value)} style={inputS} />
      <textarea placeholder="What problem are you solving?" value={data.problem || ""} onChange={e => u("problem", e.target.value)} rows={2}
        className="w-full rounded-xl p-3 text-[13px] outline-none resize-none" style={{ background: "rgba(238,240,255,0.05)", border: "1.5px solid rgba(238,240,255,0.1)", color: "#EEF0FF" }} />
      <Input placeholder="Website or link (optional)" value={data.link || ""} onChange={e => u("link", e.target.value)} style={inputS} />
    </div>
  );

  const renderForm = () => {
    switch (role) {
      case "student": return showInternship ? renderInternship() : renderStudentProject();
      case "professional": return renderProfessional();
      case "government": return renderGovernment();
      case "doctor": return renderDoctor();
      case "faculty": return renderFaculty();
      case "skilled_trade": return renderTrade();
      case "hr": return renderHR();
      case "builder": return renderBuilder();
      case "aspirant": return renderAspirant();
      default: return renderStudentProject();
    }
  };

  return (
    <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto scrollbar-hide" style={glassCard}>
      <h2 className="text-[28px] font-extrabold text-center mb-1 text-[#EEF0FF]" style={{ letterSpacing: "-0.02em" }}>{getTitle()}</h2>
      <p className="text-center mb-6 text-[14px]" style={{ color: "rgba(238,240,255,0.55)" }}>This becomes the first entry on your profile.</p>
      {renderForm()}
      <Button size="xl" onClick={onFinish} className="w-full mt-5 active:scale-95 transition-all duration-200">Create my profile <ArrowRight className="w-4 h-4 ml-1" /></Button>
      <button onClick={onSkip} className="block mx-auto mt-3 text-[13px] cursor-pointer hover:underline" style={{ color: "var(--brand, #3D5AF1)" }}>Skip for now</button>
    </div>
  );
}
