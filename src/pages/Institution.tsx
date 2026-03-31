import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, MapPin, Users, Layers, Globe, Mail, Phone, MapPinned, ExternalLink, ChevronDown, ChevronUp, Search, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const institution = {
  name: "Delhi Technological University",
  initials: "DT",
  type: "College",
  verified: "gold",
  location: "Shahbad Daulatpur, Delhi, India",
  founded: "1941",
  ugcId: "UGC-1234",
  website: "https://dtu.ac.in",
  email: "info@dtu.ac.in",
  phone: "+91-11-27871018",
  address: "Shahbad Daulatpur, Main Bawana Road, Delhi 110042",
  head: { name: "Prof. A.K. Sharma", initials: "AS", designation: "Vice Chancellor", verified: "gold" },
};

const tierLabels = { 1: "Principal / VC", 2: "HOD / Dean / Registrar", 3: "Faculty", 4: "Students" };

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

  const ringColor = (v: string) => v === "gold" ? "#F59E0B" : "#6B7280";

  return (
    <div className="max-w-4xl mx-auto px-4 py-7">
      {/* Header */}
      <div className="t-card p-6 mb-4">
        <div className="flex items-start gap-5">
          <div className="w-[72px] h-[72px] rounded-[14px] flex items-center justify-center text-xl font-bold text-brand bg-brand-dim border border-brand shrink-0">{institution.initials}</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[22px] font-extrabold text-t1 mb-1">{institution.name}</h1>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-surface-2 text-t2">{institution.type}</span>
              <Shield className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-xs text-t3">{institution.location}</span>
            </div>
            <p className="text-xs text-t3">Founded {institution.founded} · {institution.ugcId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-5 flex-wrap">
          <Button onClick={() => toast.success("Verification request sent")}>I work/study here</Button>
          <Button variant="secondary" onClick={() => { setFollowing(!following); toast.success(following ? "Unfollowed" : "Following ✓"); }}>{following ? "Following ✓" : "Follow"}</Button>
          <Button variant="secondary" onClick={() => toast.info("Filtering opportunities...")}>View opportunities</Button>
        </div>
      </div>

      {/* Contact info */}
      <div className="t-card p-5 mb-4">
        <p className="micro-label mb-3">OFFICIAL CONTACT</p>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3"><Globe className="w-4 h-4 text-t3 shrink-0" /><a href={institution.website} target="_blank" rel="noopener" className="text-brand hover:underline">{institution.website}</a><span className="text-[10px] text-t3">Last verified: 3 days ago ✓</span></div>
          <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-t3 shrink-0" /><span className="text-t1">{institution.email}</span><button onClick={() => { navigator.clipboard.writeText(institution.email); toast.success("Copied"); }} className="text-[10px] text-brand">Copy</button></div>
          <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-t3 shrink-0" /><a href={`tel:${institution.phone}`} className="text-t1">{institution.phone}</a></div>
          <div className="flex items-start gap-3"><MapPinned className="w-4 h-4 text-t3 shrink-0 mt-0.5" /><div><p className="text-t1">{institution.address}</p><a href={`https://maps.google.com/?q=${encodeURIComponent(institution.address)}`} target="_blank" rel="noopener" className="text-brand text-xs hover:underline">View on map →</a></div></div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#92400E", border: `2px solid ${ringColor(institution.head.verified)}` }}>{institution.head.initials}</div>
            <div><p className="text-sm font-bold text-t1">{institution.head.name}</p><p className="text-xs text-t2">{institution.head.designation}</p></div>
            <Button variant="secondary" size="xs" className="ml-auto" onClick={() => toast.info("Opening Ping...")}><MessageCircle className="w-3 h-3" /> Ping</Button>
          </div>
        </div>
        <button className="text-xs text-t3 mt-4 hover:text-t1 transition-colors" onClick={() => toast.info("Report submitted")}>Report wrong info</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-4">
        {["Updates", "Work", "Members", "About"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-sm font-medium relative transition-colors ${activeTab === tab ? "text-t1 font-bold" : "text-t2 hover:text-t1"}`}>
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />}
          </button>
        ))}
      </div>

      {/* Members */}
      {activeTab === "Members" && (
        <div className="space-y-4">
          {/* Tier 1 */}
          <div className="t-card p-5">
            <p className="micro-label mb-3">{tierLabels[1]}</p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ backgroundColor: "#92400E", border: `2.5px solid ${ringColor(tier1.verified)}` }}>{tier1.initials}</div>
              <div className="flex-1">
                <p className="text-base font-bold text-t1">{tier1.name}</p>
                <p className="text-[13px] text-t2">{tier1.designation} · {tier1.years}</p>
              </div>
              <Button variant="secondary" size="sm">View profile</Button>
              <Button variant="secondary" size="sm"><MessageCircle className="w-3 h-3" /> Ping</Button>
            </div>
          </div>

          {/* Tier 2 */}
          <div className="t-card p-5">
            <button onClick={() => setTier2Open(!tier2Open)} className="flex items-center justify-between w-full mb-3">
              <p className="micro-label">{tierLabels[2]}</p>
              {tier2Open ? <ChevronUp className="w-4 h-4 text-t3" /> : <ChevronDown className="w-4 h-4 text-t3" />}
            </button>
            {tier2Open && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {tier2.map(p => (
                  <div key={p.name} className="t-card p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#92400E", border: p.verified !== "none" ? `2px solid ${ringColor(p.verified)}` : undefined }}>{p.initials}</div>
                      <div><p className="text-[13px] font-bold text-t1">{p.name}</p><p className="text-[11px] text-t3">{p.designation}</p></div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 text-t2">{p.dept}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tier 3 */}
          <div className="t-card p-5">
            <button onClick={() => setTier3Open(!tier3Open)} className="flex items-center justify-between w-full mb-3">
              <p className="micro-label">{tierLabels[3]}</p>
              {tier3Open ? <ChevronUp className="w-4 h-4 text-t3" /> : <ChevronDown className="w-4 h-4 text-t3" />}
            </button>
            {tier3Open && (
              <div className="space-y-2">
                {tier3.map(p => (
                  <div key={p.name} className="flex items-center gap-3 py-2">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-[#92400E]">{p.initials}</div>
                    <div className="flex-1"><p className="text-[13px] font-bold text-t1">{p.name}</p><p className="text-[11px] text-t3">{p.designation} · {p.dept}</p></div>
                    <Link to="/app/profile" className="text-xs text-brand hover:underline">View →</Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tier 4 */}
          <div className="t-card p-5">
            <p className="micro-label mb-3">{tierLabels[4]}</p>
            <p className="text-sm text-t1 mb-3 font-bold">4,200 verified members</p>
            <div className="flex -space-x-2 mb-3">
              {["AK", "RS", "RK", "PM", "NS"].map((init, i) => (
                <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-surface" style={{ backgroundColor: ["#4F46E5", "#4F46E5", "#0369A1", "#92400E", "#0E7490"][i] }}>{init}</div>
              ))}
            </div>
            <Button variant="secondary" size="sm">Show all</Button>
          </div>
        </div>
      )}

      {activeTab === "Updates" && <div className="text-center py-16"><p className="text-sm text-t2">No updates yet from this institution.</p></div>}
      {activeTab === "Work" && <div className="text-center py-16"><p className="text-sm text-t2">380 projects from DTU members.</p><Button variant="secondary" size="sm" className="mt-3">Browse projects</Button></div>}
      {activeTab === "About" && (
        <div className="t-card p-5">
          <h3 className="text-base font-bold text-t1 mb-2">About {institution.name}</h3>
          <p className="text-sm text-t2 leading-relaxed">Delhi Technological University (formerly Delhi College of Engineering) is a premier technical university in Delhi, India. Established in 1941, it offers undergraduate, postgraduate, and doctoral programs across engineering and management disciplines.</p>
        </div>
      )}
    </div>
  );
};

export default Institution;
