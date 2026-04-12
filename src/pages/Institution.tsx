import { useState } from "react";
import { Shield, Globe, Mail, Phone, MapPinned, MessageCircle, ChevronDown, ChevronUp, Search, Crown, ArrowRight, Building2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tiikToast } from "@/components/ui/tiik-toast";
import { Link } from "react-router-dom";

const institution = {
  name: "Delhi Technological University", initials: "DT", type: "College", location: "Shahbad Daulatpur, Delhi", founded: "1941", ugcId: "UGC-1234",
  website: "https://dtu.ac.in", email: "info@dtu.ac.in", phone: "+91-11-27871018", address: "Shahbad Daulatpur, Main Bawana Road, Delhi 110042",
  head: { name: "Prof. A.K. Sharma", initials: "AS", designation: "Vice Chancellor", verified: "gold" },
};

const ringStyle = (v: string): React.CSSProperties => {
  if (v === "gold") return { boxShadow: "0 0 0 2px var(--surface), 0 0 0 4.5px #F59E0B, 0 0 12px rgba(245,158,11,0.45), 0 0 24px rgba(245,158,11,0.15)" };
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
  { name: "Dr. Ananya S.", initials: "AS", designation: "Asst. Professor", dept: "CSE" },
  { name: "Prof. Ravi D.", initials: "RD", designation: "Professor", dept: "EE" },
];
const tier4Names = ["AK", "RS", "RK", "PM", "NS", "VK", "SG", "AP"];

const Institution = () => {
  const [activeTab, setActiveTab] = useState("Members");
  const [following, setFollowing] = useState(false);
  const [tier2Open, setTier2Open] = useState(true);
  const [tier3Open, setTier3Open] = useState(true);
  const [tier3Search, setTier3Search] = useState("");
  const [tier4Search, setTier4Search] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");

  const filteredTier3 = tier3.filter(p =>
    (deptFilter === "All" || p.dept === deptFilter) &&
    (!tier3Search || p.name.toLowerCase().includes(tier3Search.toLowerCase()))
  );

  return (
    <div className="max-w-[960px] mx-auto px-3 md:px-6 py-7">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-4 text-[12px]" style={{ color: "var(--text-3)" }}>
        <Link to="/app/explore" className="hover:underline" style={{ color: "var(--brand)" }}>Explore</Link>
        <span>/</span>
        <span>Institutions</span>
        <span>/</span>
        <span style={{ color: "var(--text-1)" }}>{institution.name}</span>
      </div>

      {/* Header Card */}
      <div className="t-card p-6 mb-4">
        <div className="flex items-start gap-5 flex-wrap sm:flex-nowrap">
          <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
            style={{ background: "var(--brand-dim)", border: "2px solid var(--border-2)", color: "var(--brand)" }}>
            {institution.initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[22px] font-extrabold" style={{ color: "var(--text-1)", letterSpacing: "-0.01em" }}>{institution.name}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-1 mb-1.5">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>{institution.type}</span>
              <Shield className="w-4 h-4" style={{ color: "#F59E0B" }} />
              <span className="text-[12px]" style={{ color: "var(--text-3)" }}>{institution.location}</span>
            </div>
            <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Founded {institution.founded} · {institution.ugcId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-5 flex-wrap">
          <Button onClick={() => tiikToast.success("Verification request sent")}>I work/study here</Button>
          <Button variant="secondary" onClick={() => { setFollowing(!following); tiikToast.success(following ? "Unfollowed" : "Following"); }}>
            {following ? "Following ✓" : "Follow"}
          </Button>
          <Button variant="ghost" onClick={() => tiikToast("Showing opportunities...")}>View opportunities</Button>
        </div>
      </div>

      {/* Contact Block */}
      <div className="t-card p-5 mb-4">
        <p className="micro-label mb-3">OFFICIAL CONTACT</p>
        <div className="space-y-0">
          {[
            { icon: Globe, content: <a href={institution.website} target="_blank" rel="noopener" style={{ color: "var(--brand)" }}>{institution.website}</a>, extra: <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>Verified ✓</span> },
            { icon: Mail, content: <span style={{ color: "var(--text-1)" }}>{institution.email}</span>, extra: <button type="button" onClick={() => { navigator.clipboard.writeText(institution.email); tiikToast.success("Copied"); }} className="text-[11px] font-semibold cursor-pointer" style={{ color: "var(--brand)" }}>Copy</button> },
            { icon: Phone, content: <a href={`tel:${institution.phone}`} style={{ color: "var(--text-1)" }}>{institution.phone}</a> },
          ].map((row, i) => (
            <div key={i} className="flex items-center gap-3 h-11 px-3 rounded-xl text-[14px] cursor-pointer"
              style={{ transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--brand-dim)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <row.icon className="w-4 h-4 shrink-0" style={{ color: "var(--text-3)" }} />
              <span className="flex-1">{row.content}</span>
              {row.extra}
            </div>
          ))}
          <div className="flex items-start gap-3 px-3 py-2">
            <MapPinned className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--text-3)" }} />
            <div>
              <p className="text-[14px]" style={{ color: "var(--text-1)" }}>{institution.address}</p>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(institution.address)}`} target="_blank" rel="noopener" className="text-[12px]" style={{ color: "var(--brand)" }}>View on map →</a>
            </div>
          </div>
          {/* Head */}
          <div className="flex items-center gap-3 px-3 pt-3 mt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <Link to="/app/profile"><div className="w-11 h-11 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: "#92400E", ...ringStyle(institution.head.verified) }}>{institution.head.initials}</div></Link>
            <div className="flex-1">
              <Link to="/app/profile" className="text-[14px] font-bold hover:underline" style={{ color: "var(--text-1)" }}>{institution.head.name}</Link>
              <p className="text-[12px]" style={{ color: "var(--text-2)" }}>{institution.head.designation}</p>
            </div>
            <Button variant="secondary" size="sm" className="gap-1" onClick={() => tiikToast("Opening Ping...")}><MessageCircle className="w-3 h-3" /> Ping</Button>
          </div>
        </div>
        <button type="button" className="text-[12px] mt-4 cursor-pointer" style={{ color: "var(--text-3)" }} onClick={() => tiikToast("Report submitted")}>Report wrong info</button>
      </div>

      {/* Tabs */}
      <div className="flex mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        {["Members", "Work", "About"].map(t => (
          <button type="button" key={t} onClick={() => setActiveTab(t)}
            className="flex-1 py-3 text-[13px] font-semibold relative cursor-pointer"
            style={{ color: activeTab === t ? "var(--brand)" : "var(--text-2)", borderBottom: activeTab === t ? "3px solid var(--brand)" : "3px solid transparent", transition: "all 0.15s" }}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === "Members" && (
        <div className="space-y-4">
          {/* Tier 1 — Head */}
          <div className="t-card p-6">
            <p className="micro-label mb-4">PRINCIPAL / VC</p>
            <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
              <Link to="/app/profile">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ backgroundColor: "#92400E", ...ringStyle(tier1.verified) }}>{tier1.initials}</div>
              </Link>
              <div className="flex-1">
                <Link to="/app/profile" className="text-[20px] font-extrabold hover:underline" style={{ color: "var(--text-1)" }}>{tier1.name}</Link>
                <p className="text-[13px]" style={{ color: "var(--text-2)" }}>{tier1.designation} · {tier1.years}</p>
              </div>
              <div className="flex gap-2">
                <Link to="/app/profile"><Button>View profile</Button></Link>
                <Button variant="secondary" className="gap-1" onClick={() => tiikToast("Opening Ping...")}><MessageCircle className="w-3.5 h-3.5" /> Ping</Button>
              </div>
            </div>
          </div>

          {/* Tier 2 — Senior Leadership */}
          <div className="t-card p-5">
            <button type="button" onClick={() => setTier2Open(!tier2Open)} className="flex items-center justify-between w-full mb-3 cursor-pointer">
              <p className="micro-label">SENIOR LEADERSHIP — {tier2.length} members</p>
              {tier2Open ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-3)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-3)" }} />}
            </button>
            {tier2Open && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {tier2.map(p => (
                  <div key={p.name} className="t-card t-card-hover p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Link to="/app/profile"><div className="w-11 h-11 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: "#92400E", ...ringStyle(p.verified) }}>{p.initials}</div></Link>
                      <div className="min-w-0">
                        <Link to="/app/profile" className="text-[13px] font-bold hover:underline block truncate" style={{ color: "var(--text-1)" }}>{p.name}</Link>
                        <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{p.designation}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>{p.dept}</span>
                    <Link to="/app/profile" className="text-[12px] font-semibold block mt-2" style={{ color: "var(--brand)" }}>View →</Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tier 3 — Mid-level */}
          <div className="t-card p-5">
            <button type="button" onClick={() => setTier3Open(!tier3Open)} className="flex items-center justify-between w-full mb-3 cursor-pointer">
              <p className="micro-label">FACULTY — {tier3.length} members</p>
              {tier3Open ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-3)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-3)" }} />}
            </button>
            {tier3Open && (
              <>
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-3)" }} />
                    <Input placeholder="Search faculty..." value={tier3Search} onChange={e => setTier3Search(e.target.value)} className="pl-9 h-9" />
                  </div>
                  <div className="flex gap-1">
                    {["All", "CSE", "ECE", "ME", "EE"].map(d => (
                      <button type="button" key={d} onClick={() => setDeptFilter(d)}
                        className="text-[11px] font-semibold px-2.5 h-9 rounded-lg cursor-pointer"
                        style={{
                          background: deptFilter === d ? "var(--brand)" : "var(--surface-2)",
                          color: deptFilter === d ? "white" : "var(--text-2)",
                          border: deptFilter === d ? "none" : "1px solid var(--border)",
                        }}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  {filteredTier3.map(p => (
                    <div key={p.name} className="flex items-center gap-3 py-2.5 px-2 rounded-xl cursor-pointer"
                      style={{ transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--brand-dim)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: "#92400E" }}>{p.initials}</div>
                      <div className="flex-1 min-w-0">
                        <Link to="/app/profile" className="text-[13px] font-bold hover:underline" style={{ color: "var(--text-1)" }}>{p.name}</Link>
                        <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{p.designation} · {p.dept}</p>
                      </div>
                      <Link to="/app/profile" className="text-[12px] font-semibold" style={{ color: "var(--brand)" }}>View →</Link>
                    </div>
                  ))}
                  {filteredTier3.length === 0 && <p className="text-[13px] text-center py-4" style={{ color: "var(--text-3)" }}>No results found</p>}
                </div>
              </>
            )}
          </div>

          {/* Tier 4 — Members */}
          <div className="t-card p-5">
            <p className="micro-label mb-3">STUDENTS</p>
            <p className="text-[14px] font-bold mb-3" style={{ color: "var(--text-1)" }}>4,200 verified members</p>
            <div className="flex -space-x-2 mb-4">
              {tier4Names.slice(0, 5).map((init, i) => (
                <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: ["#4F46E5", "#0369A1", "#92400E", "#0E7490", "#166534"][i % 5], border: "2px solid var(--surface)" }}>
                  {init}
                </div>
              ))}
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: "var(--surface-2)", border: "2px solid var(--surface)", color: "var(--text-3)" }}>+4.2K</div>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-3)" }} />
              <Input placeholder="Search students..." value={tier4Search} onChange={e => setTier4Search(e.target.value)} className="pl-9 h-9" />
            </div>
            <Button variant="secondary" className="w-full">Show all members</Button>
          </div>
        </div>
      )}

      {activeTab === "Work" && (
        <div className="text-center py-16">
          <Layers className="w-14 h-14 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
          <p className="text-[18px] font-bold mb-1" style={{ color: "var(--text-2)" }}>380 projects from DTU members</p>
          <p className="text-[14px] mb-4" style={{ color: "var(--text-3)" }}>Browse verified work from this institution.</p>
          <Button variant="secondary">Browse projects</Button>
        </div>
      )}

      {activeTab === "About" && (
        <div className="t-card p-5">
          <h3 className="text-[16px] font-bold mb-3" style={{ color: "var(--text-1)" }}>About {institution.name}</h3>
          <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-2)", lineHeight: 1.75 }}>
            Delhi Technological University (formerly Delhi College of Engineering) is a premier technical university in Delhi.
            Established in 1941, it offers undergraduate, postgraduate, and doctoral programs in engineering, management,
            and applied sciences. The university has produced notable alumni across technology, governance, and business sectors.
          </p>
        </div>
      )}
    </div>
  );
};

export default Institution;
