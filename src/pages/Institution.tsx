import { useState } from "react";
import { Shield, Globe, Mail, Phone, MapPinned, MessageCircle, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const institution = {
  name: "Delhi Technological University", initials: "DT", type: "College", location: "Shahbad Daulatpur, Delhi", founded: "1941", ugcId: "UGC-1234",
  website: "https://dtu.ac.in", email: "info@dtu.ac.in", phone: "+91-11-27871018", address: "Shahbad Daulatpur, Main Bawana Road, Delhi 110042",
  head: { name: "Prof. A.K. Sharma", initials: "AS", designation: "Vice Chancellor", verified: "gold" },
};

const ringStyle = (v: string): React.CSSProperties => {
  if (v === "gold") return { boxShadow: "0 0 0 2px var(--surface), 0 0 0 4px #F59E0B, 0 0 8px rgba(245,158,11,0.5)" };
  if (v === "grey") return { boxShadow: "0 0 0 2px var(--surface), 0 0 0 4px #6B7280" };
  return {};
};

const tier1 = { name: "Prof. A.K. Sharma", initials: "AS", designation: "Vice Chancellor", years: "12 years", verified: "gold" };
const tier2 = [
  { name: "Prof. Kumar", initials: "PK", designation: "HOD, Computer Science", dept: "CSE", verified: "gold" },
  { name: "Dr. Meera Joshi", initials: "MJ", designation: "Dean, Academics", dept: "Admin", verified: "grey" },
  { name: "Prof. Rajan", initials: "PR", designation: "Registrar", dept: "Admin", verified: "grey" },
];
const tier3 = [
  { name: "Dr. Neha Roy", initials: "NR", designation: "Asst. Professor", dept: "CSE" },
  { name: "Prof. Suresh P.", initials: "SP", designation: "Professor", dept: "ECE" },
  { name: "Dr. Kiran M.", initials: "KM", designation: "Assoc. Professor", dept: "ME" },
];

const Institution = () => {
  const [activeTab, setActiveTab] = useState("Members");
  const [following, setFollowing] = useState(false);
  const [tier2Open, setTier2Open] = useState(true);
  const [tier3Open, setTier3Open] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 py-7">
      {/* Header */}
      <div className="t-card p-6 mb-4">
        <div className="flex items-start gap-5">
          <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-xl font-bold shrink-0" style={{ background: "var(--brand-dim)", border: "2px solid var(--border-2)", color: "var(--brand)" }}>{institution.initials}</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[22px] font-extrabold mb-1" style={{ color: "var(--text-1)" }}>{institution.name}</h1>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>{institution.type}</span>
              <Shield className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-[12px]" style={{ color: "var(--text-3)" }}>{institution.location}</span>
            </div>
            <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Founded {institution.founded} · {institution.ugcId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-5 flex-wrap">
          <Button onClick={() => toast.success("Verification request sent")}>I work/study here</Button>
          <Button variant="secondary" onClick={() => { setFollowing(!following); toast.success(following ? "Unfollowed" : "Following"); }}>{following ? "Following" : "Follow"}</Button>
          <Button variant="secondary" onClick={() => toast.info("Showing opportunities...")}>View opportunities</Button>
        </div>
      </div>

      {/* Contact */}
      <div className="t-card p-5 mb-4">
        <p className="micro-label mb-3">OFFICIAL CONTACT</p>
        <div className="space-y-3 text-[14px]">
          <div className="flex items-center gap-3 h-11 rounded-xl px-3 transition-colors" style={{ cursor: "pointer" }}><Globe className="w-4 h-4 shrink-0" style={{ color: "var(--text-3)" }} /><a href={institution.website} target="_blank" rel="noopener" style={{ color: "var(--brand)" }}>{institution.website}</a></div>
          <div className="flex items-center gap-3 h-11 rounded-xl px-3"><Mail className="w-4 h-4 shrink-0" style={{ color: "var(--text-3)" }} /><span style={{ color: "var(--text-1)" }}>{institution.email}</span><button onClick={() => { navigator.clipboard.writeText(institution.email); toast.success("Copied"); }} className="text-[10px]" style={{ color: "var(--brand)" }}>Copy</button></div>
          <div className="flex items-center gap-3 h-11 rounded-xl px-3"><Phone className="w-4 h-4 shrink-0" style={{ color: "var(--text-3)" }} /><a href={`tel:${institution.phone}`} style={{ color: "var(--text-1)" }}>{institution.phone}</a></div>
          <div className="flex items-start gap-3 px-3"><MapPinned className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--text-3)" }} /><div><p style={{ color: "var(--text-1)" }}>{institution.address}</p><a href={`https://maps.google.com/?q=${encodeURIComponent(institution.address)}`} target="_blank" rel="noopener" className="text-[12px]" style={{ color: "var(--brand)" }}>View on map →</a></div></div>
          <div className="flex items-center gap-3 px-3">
            <Link to="/app/profile"><div className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: "#92400E", ...ringStyle(institution.head.verified) }}>{institution.head.initials}</div></Link>
            <div><Link to="/app/profile" className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{institution.head.name}</Link><p className="text-[12px]" style={{ color: "var(--text-2)" }}>{institution.head.designation}</p></div>
            <Button variant="secondary" size="xs" className="ml-auto gap-1" onClick={() => toast.info("Opening Ping...")}><MessageCircle className="w-3 h-3" /> Ping</Button>
          </div>
        </div>
        <button className="text-[12px] mt-4" style={{ color: "var(--text-3)" }} onClick={() => toast.info("Report submitted")}>Report wrong info</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-4" style={{ borderColor: "var(--border)" }}>
        {["Members", "Work", "About"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className="flex-1 py-3 text-[13px] font-semibold relative transition-colors" style={{ color: activeTab === t ? "var(--brand)" : "var(--text-2)", borderBottom: activeTab === t ? "3px solid var(--brand)" : "3px solid transparent" }}>{t}</button>
        ))}
      </div>

      {activeTab === "Members" && (
        <div className="space-y-4">
          {/* Tier 1 */}
          <div className="t-card p-5">
            <p className="micro-label mb-3">PRINCIPAL / VC</p>
            <div className="flex items-center gap-4">
              <Link to="/app/profile"><div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ backgroundColor: "#92400E", ...ringStyle(tier1.verified) }}>{tier1.initials}</div></Link>
              <div className="flex-1">
                <Link to="/app/profile" className="text-[18px] font-extrabold" style={{ color: "var(--text-1)" }}>{tier1.name}</Link>
                <p className="text-[13px]" style={{ color: "var(--text-2)" }}>{tier1.designation} · {tier1.years}</p>
              </div>
              <Button variant="secondary" size="sm">View profile</Button>
              <Button variant="secondary" size="sm" className="gap-1"><MessageCircle className="w-3 h-3" /> Ping</Button>
            </div>
          </div>

          {/* Tier 2 */}
          <div className="t-card p-5">
            <button onClick={() => setTier2Open(!tier2Open)} className="flex items-center justify-between w-full mb-3"><p className="micro-label">HOD / DEAN / REGISTRAR</p>{tier2Open ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-3)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-3)" }} />}</button>
            {tier2Open && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {tier2.map(p => (
                  <div key={p.name} className="t-card t-card-hover p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Link to="/app/profile"><div className="w-11 h-11 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: "#92400E", ...ringStyle(p.verified) }}>{p.initials}</div></Link>
                      <div><Link to="/app/profile" className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{p.name}</Link><p className="text-[11px]" style={{ color: "var(--text-3)" }}>{p.designation}</p></div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>{p.dept}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tier 3 */}
          <div className="t-card p-5">
            <button onClick={() => setTier3Open(!tier3Open)} className="flex items-center justify-between w-full mb-3"><p className="micro-label">FACULTY</p>{tier3Open ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-3)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-3)" }} />}</button>
            {tier3Open && (
              <div className="space-y-2">
                {tier3.map(p => (
                  <div key={p.name} className="flex items-center gap-3 py-2">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-[#92400E]">{p.initials}</div>
                    <div className="flex-1"><p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{p.name}</p><p className="text-[11px]" style={{ color: "var(--text-3)" }}>{p.designation} · {p.dept}</p></div>
                    <Link to="/app/profile" className="text-[12px]" style={{ color: "var(--brand)" }}>View →</Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tier 4 */}
          <div className="t-card p-5">
            <p className="micro-label mb-3">STUDENTS</p>
            <p className="text-[14px] font-bold mb-3" style={{ color: "var(--text-1)" }}>4,200 verified members</p>
            <div className="flex -space-x-2 mb-3">
              {["AK", "RS", "RK", "PM", "NS"].map((init, i) => (
                <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: ["#4F46E5", "#4F46E5", "#0369A1", "#92400E", "#0E7490"][i], border: "2px solid var(--surface)" }}>{init}</div>
              ))}
            </div>
            <Button variant="secondary" size="sm">Show all</Button>
          </div>
        </div>
      )}

      {activeTab === "Work" && <div className="text-center py-16"><p className="text-[14px]" style={{ color: "var(--text-2)" }}>380 projects from DTU members.</p><Button variant="secondary" size="sm" className="mt-3">Browse projects</Button></div>}
      {activeTab === "About" && <div className="t-card p-5"><h3 className="text-[16px] font-bold mb-2" style={{ color: "var(--text-1)" }}>About {institution.name}</h3><p className="text-[14px] leading-relaxed" style={{ color: "var(--text-2)" }}>Delhi Technological University (formerly Delhi College of Engineering) is a premier technical university in Delhi. Established in 1941, it offers undergraduate, postgraduate, and doctoral programs.</p></div>}
    </div>
  );
};

export default Institution;
