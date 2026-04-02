import { useState } from "react";
import { MapPin, Globe, Calendar, Users, MessageCircle, ExternalLink, Trophy, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link, useParams } from "react-router-dom";
import ActivityScoreRing from "@/components/ActivityScoreRing";
import CustomLinks from "@/components/profile/CustomLinks";

const mockPage = {
  name: "Zepto Engineering",
  slug: "zepto",
  type: "Company",
  subType: "Startup",
  about: "India's fastest 10-minute delivery company. Building cutting-edge tech for instant commerce at scale.",
  city: "Mumbai",
  state: "Maharashtra",
  website: "zepto.co",
  foundedYear: 2021,
  logoInitials: "ZE",
  teamSize: "500-2000",
  trustScore: 82,
  trackerCount: 1847,
  memberCount: 120,
  isTracking: false,
  customLinks: [
    { url: "https://zepto.co/careers", label: "Careers" },
    { url: "https://cal.com/zepto", label: "Book a meeting" },
  ],
  awards: [
    { name: "Forbes 30 Under 30", year: "2023" },
    { name: "YC Summer 2021", year: "2021" },
  ],
};

const pageTabs = ["Feed", "Jobs", "Members", "Gallery", "About"] as const;
const feedFilters = ["All", "Announcements", "Achievements", "Updates"];

const PageProfile = () => {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState<typeof pageTabs[number]>("Feed");
  const [tracking, setTracking] = useState(mockPage.isTracking);
  const [activeFilter, setActiveFilter] = useState("All");

  const handleTrack = () => {
    setTracking(true);
    toast.success(`Tracking ${mockPage.name} · You'll see their opportunities first`);
  };

  return (
    <div className="max-w-[960px] mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column */}
        <div className="w-full md:w-[280px] shrink-0 space-y-4">
          {/* Logo + Name */}
          <div className="t-card p-5 text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-[22px] font-bold" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>
              {mockPage.logoInitials}
            </div>
            <h1 className="text-[20px] font-extrabold" style={{ color: "var(--text-1)" }}>{mockPage.name}</h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{mockPage.type}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>{mockPage.subType}</span>
            </div>

            {/* Trust Score */}
            <div className="mt-4 flex justify-center">
              <ActivityScoreRing score={mockPage.trustScore} size={56} strokeWidth={4} />
            </div>
            <p className="text-[11px] font-bold mt-1" style={{ color: "var(--text-2)" }}>Tiikme Trust: {mockPage.trustScore}</p>

            <p className="text-[12px] mt-3" style={{ color: "var(--text-3)" }}>{mockPage.memberCount} members · {mockPage.trackerCount} tracking</p>

            {/* Track / Ping */}
            <div className="flex gap-2 mt-4">
              {tracking ? (
                <Button variant="secondary" className="flex-1" disabled>Tracking ✓</Button>
              ) : (
                <Button className="flex-1" onClick={handleTrack}>Track +</Button>
              )}
              <Button variant="secondary" className="flex-1 gap-1"><MessageCircle className="w-3.5 h-3.5" /> Ping</Button>
            </div>
          </div>

          {/* About */}
          <div className="t-card p-4">
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>{mockPage.about}</p>
          </div>

          {/* Info Chips */}
          <div className="t-card p-4 space-y-2">
            <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-2)" }}>
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-3)" }} /> {mockPage.city}, {mockPage.state}
            </div>
            {mockPage.website && (
              <a href={`https://${mockPage.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] hover:underline" style={{ color: "var(--brand)" }}>
                <Globe className="w-3.5 h-3.5 shrink-0" /> {mockPage.website}
              </a>
            )}
            <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-2)" }}>
              <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-3)" }} /> Est. {mockPage.foundedYear}
            </div>
            <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-2)" }}>
              <Users className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-3)" }} /> {mockPage.teamSize} employees
            </div>
          </div>

          {/* Custom Links */}
          {mockPage.customLinks.length > 0 && (
            <div className="t-card p-4">
              <p className="micro-label mb-2">LINKS</p>
              <div className="space-y-1.5">
                {mockPage.customLinks.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] font-semibold hover:underline" style={{ color: "var(--brand)" }}>
                    {link.label} <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Awards */}
          {mockPage.awards.length > 0 && (
            <div className="t-card p-4">
              <p className="micro-label mb-2">AWARDS</p>
              {mockPage.awards.map((a, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 text-[12px]" style={{ color: "var(--text-1)" }}>
                  <Trophy className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />
                  {a.name} · {a.year}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="flex-1 min-w-0">
          {/* Cover */}
          <div className="w-full h-[200px] rounded-xl mb-4 flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--brand-dim), var(--surface-2))" }}>
            <span className="text-[40px] font-extrabold" style={{ color: "var(--brand)", opacity: 0.3 }}>{mockPage.logoInitials}</span>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto scrollbar-hide mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            {pageTabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="py-3 px-4 text-[13px] font-semibold cursor-pointer shrink-0"
                style={{ color: activeTab === tab ? "var(--brand)" : "var(--text-2)", borderBottom: activeTab === tab ? "2px solid var(--brand)" : "2px solid transparent" }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "Feed" && (
            <div>
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {feedFilters.map(f => (
                  <button key={f} onClick={() => setActiveFilter(f)}
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full cursor-pointer shrink-0"
                    style={{ background: activeFilter === f ? "var(--brand-dim)" : "var(--surface-2)", border: activeFilter === f ? "1px solid var(--brand)" : "1px solid var(--border)", color: activeFilter === f ? "var(--brand)" : "var(--text-2)" }}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="t-card p-6 text-center">
                <p className="text-[14px]" style={{ color: "var(--text-3)" }}>No posts yet from this Page</p>
              </div>
            </div>
          )}

          {activeTab === "Jobs" && (
            <div className="t-card p-6 text-center">
              <p className="text-[14px]" style={{ color: "var(--text-3)" }}>No active opportunities</p>
            </div>
          )}

          {activeTab === "Members" && (
            <div className="t-card p-6 text-center">
              <p className="text-[14px]" style={{ color: "var(--text-3)" }}>Members will appear here</p>
            </div>
          )}

          {activeTab === "Gallery" && (
            <div className="t-card p-6 text-center">
              <p className="text-[14px]" style={{ color: "var(--text-3)" }}>No photos uploaded yet</p>
            </div>
          )}

          {activeTab === "About" && (
            <div className="t-card p-6">
              <h3 className="text-[15px] font-bold mb-3" style={{ color: "var(--text-1)" }}>About {mockPage.name}</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>{mockPage.about}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageProfile;
