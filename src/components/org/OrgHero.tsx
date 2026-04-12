import { MapPin, Globe, Calendar, Users, MessageCircle, Share2, Settings, MoreHorizontal, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface OrgHeroProps {
  org: any;
  isAdmin: boolean;
  isFollowing: boolean;
  followerCount: number;
  memberCount: number;
  onFollow: () => void;
  onNavigateSettings: () => void;
}

export default function OrgHero({ org, isAdmin, isFollowing, followerCount, memberCount, onFollow, onNavigateSettings }: OrgHeroProps) {
  const initials = (org.name || "").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const locationParts = [org.city, org.state].filter(Boolean);

  return (
    <>
      {/* Cover */}
      <div className="w-full h-[180px] md:h-[280px] relative overflow-hidden group" style={{
        background: org.cover_url ? `url(${org.cover_url}) center/cover` : "linear-gradient(135deg, #E8580A 0%, #C4460A 100%)",
      }}>
        {isAdmin && (
          <button type="button" className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
            onClick={() => toast.info("Cover upload coming soon")}>
            <Camera className="w-3.5 h-3.5" /> Change cover
          </button>
        )}
      </div>

      {/* Header content */}
      <div className="max-w-[960px] mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-start gap-4 -mt-12 relative z-10">
          {/* Logo */}
          <div className="w-[72px] h-[72px] md:w-24 md:h-24 rounded-full flex items-center justify-center text-[20px] md:text-[24px] font-bold shrink-0 overflow-hidden cursor-pointer"
            style={{
              background: org.logo_url ? "#fff" : "#E8580A",
              color: org.logo_url ? undefined : "#fff",
              border: "3px solid #fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
            }}
            onClick={() => isAdmin && toast.info("Logo upload coming soon")}>
            {org.logo_url ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" /> : initials}
            {org.is_verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#E8580A" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 md:pt-14">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[24px] font-bold" style={{ color: "#1A1A1A" }}>{org.name}</h1>
              {org.is_verified && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(232,88,10,0.1)", color: "#E8580A" }} title="Verified Institution">Verified</span>
              )}
            </div>
            {org.tagline && <p className="text-[14px] italic mt-0.5" style={{ color: "#6B6B6B" }}>{org.tagline}</p>}
            <div className="flex items-center gap-3 flex-wrap mt-2 text-[13px]" style={{ color: "#9CA3AF" }}>
              {locationParts.length > 0 && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {locationParts.join(", ")}</span>}
              {org.website_url && (
                <a href={org.website_url.startsWith("http") ? org.website_url : `https://${org.website_url}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:underline" style={{ color: "#E8580A" }}>
                  <Globe className="w-3.5 h-3.5" /> Website
                </a>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-3">
              <StatItem value={followerCount} label="Followers" />
              <StatItem value={memberCount} label="Employees" />
              {org.founded_year && <StatItem value={`Since ${org.founded_year}`} label="" />}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <Button size="default" onClick={onFollow}
                className="min-w-[100px] h-10"
                style={isFollowing ? { background: "#fff", color: "#1A1A1A", border: "1px solid #F0E8E0" } : { background: "#E8580A", color: "#fff" }}>
                {isFollowing ? "Following ✓" : "Follow"}
              </Button>
              <Button variant="secondary" size="default" className="h-10 gap-1.5" style={{ border: "1px solid #F0E8E0" }}>
                <MessageCircle className="w-4 h-4" /> Message
              </Button>
              <div className="relative group/menu">
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
                <div className="absolute right-0 top-full mt-1 w-[180px] rounded-xl py-1 hidden group-hover/menu:block z-20"
                  style={{ background: "#fff", border: "1px solid #F0E8E0", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                  <button type="button" className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }}>Copy link</button>
                  <button type="button" className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50">Share page</button>
                  {isAdmin && (
                    <>
                      <div className="h-px my-1" style={{ background: "#F0E8E0" }} />
                      <button type="button" className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50" onClick={onNavigateSettings}>Edit Page</button>
                      <button type="button" className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50" onClick={onNavigateSettings}>Page Settings</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info card — desktop only */}
          <div className="hidden md:block w-[280px] shrink-0 rounded-xl p-5 mt-14"
            style={{ background: "#fff", border: "1px solid #F0E8E0", boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)" }}>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>Quick Info</p>
            <div className="space-y-2.5">
              {org.type && <InfoRow icon="🏢" text={org.type.charAt(0).toUpperCase() + org.type.slice(1)} />}
              {locationParts.length > 0 && <InfoRow icon="📍" text={locationParts.join(", ")} />}
              {org.website_url && <InfoRow icon="🌐" text={org.website_url.replace(/https?:\/\//, "")} link={org.website_url.startsWith("http") ? org.website_url : `https://${org.website_url}`} />}
              {org.employee_count && <InfoRow icon="👥" text={`${org.employee_count} employees`} />}
              {org.founded_year && <InfoRow icon="📅" text={`Founded ${org.founded_year}`} />}
            </div>
            {isAdmin && (
              <button type="button" className="text-[13px] font-semibold mt-3 hover:underline" style={{ color: "#E8580A" }} onClick={onNavigateSettings}>
                Edit details →
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatItem({ value, label }: { value: string | number; label: string }) {
  return (
    <span className="text-[13px]" style={{ color: "#6B6B6B" }}>
      <strong className="text-[16px] font-semibold" style={{ color: "#1A1A1A" }}>{value}</strong>
      {label && ` ${label}`}
    </span>
  );
}

function InfoRow({ icon, text, link }: { icon: string; text: string; link?: string }) {
  const content = (
    <span className="flex items-center gap-2 text-[13px]" style={{ color: link ? "#E8580A" : "#6B6B6B" }}>
      <span className="text-[14px]">{icon}</span> {text}
    </span>
  );
  if (link) return <a href={link} target="_blank" rel="noopener noreferrer" className="block hover:underline">{content}</a>;
  return <div>{content}</div>;
}
