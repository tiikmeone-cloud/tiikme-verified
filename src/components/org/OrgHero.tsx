import { useState, useRef } from "react";
import { MapPin, Globe, Calendar, Users, MessageCircle, Share2, Settings, MoreHorizontal, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OrgHeroProps {
  org: any;
  isAdmin: boolean;
  isFollowing: boolean;
  followerCount: number;
  memberCount: number;
  onFollow: () => void;
  onNavigateSettings: () => void;
  onCoverUpdated?: (url: string) => void;
  onLogoUpdated?: (url: string) => void;
}

export default function OrgHero({ org, isAdmin, isFollowing, followerCount, memberCount, onFollow, onNavigateSettings, onCoverUpdated, onLogoUpdated }: OrgHeroProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const initials = (org.name || "").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const locationParts = [org.city, org.state].filter(Boolean);
  const coverRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Cover image must be under 5MB"); return; }
    setUploadingCover(true);
    try {
      const path = `${org.id}/cover-${Date.now()}.${file.name.split(".").pop()}`;
      const { error: upErr } = await supabase.storage.from("cover-images").upload(path, file, { upsert: true });
      if (upErr) { toast.error(upErr.message); setUploadingCover(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("cover-images").getPublicUrl(path);
      await supabase.from("organizations").update({ cover_url: publicUrl }).eq("id", org.id);
      onCoverUpdated?.(publicUrl);
      toast.success("Cover updated!");
    } catch (err) { toast.error("Upload failed"); }
    setUploadingCover(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2MB"); return; }
    setUploadingLogo(true);
    try {
      const path = `${org.id}/logo-${Date.now()}.${file.name.split(".").pop()}`;
      const { error: upErr } = await supabase.storage.from("org-logos").upload(path, file, { upsert: true });
      if (upErr) { toast.error(upErr.message); setUploadingLogo(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("org-logos").getPublicUrl(path);
      await supabase.from("organizations").update({ logo_url: publicUrl }).eq("id", org.id);
      onLogoUpdated?.(publicUrl);
      toast.success("Logo updated!");
    } catch (err) { toast.error("Upload failed"); }
    setUploadingLogo(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: org.name, url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  const handleMessage = async () => {
    if (!user) { toast.error("Please sign in to send messages"); return; }

    // Check if pings are enabled
    if (org.pings_enabled === false) {
      toast.info("This organisation has disabled messages.");
      return;
    }

    // Check follow requirement
    if (org.pings_visibility === "followers") {
      const { data: followData } = await supabase.from("org_followers").select("id").eq("org_id", org.id).eq("user_id", user.id).maybeSingle();
      if (!followData) {
        toast.info(`Follow ${org.name} to send them a message.`);
        return;
      }
    }

    try {
      // Find org owner
      const { data: ownerMember } = await supabase.from("org_members")
        .select("user_id")
        .eq("org_id", org.id)
        .eq("role", "owner")
        .limit(1)
        .maybeSingle();

      const ownerId = ownerMember?.user_id || org.created_by;
      if (!ownerId) { toast.error("Could not find organisation contact"); return; }
      if (ownerId === user.id) { toast.info("You can't message your own organisation"); return; }

      // Check for existing conversation
      const { data: existing } = await supabase.from("conversations")
        .select("id")
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${ownerId}),and(participant_1.eq.${ownerId},participant_2.eq.${user.id})`)
        .maybeSingle();

      if (existing) {
        navigate("/app/pings");
        return;
      }

      // Create new conversation
      const { data: conv, error } = await supabase.from("conversations").insert({
        participant_1: user.id,
        participant_2: ownerId,
      }).select().single();

      if (error) { console.warn("[OrgHero] conversation creation failed:", error.message); toast.error("Failed to start conversation"); return; }

      // Send opening ping
      await supabase.from("pings").insert({
        conversation_id: conv.id,
        sender_id: user.id,
        content: `Hi ${org.name}! I'd like to connect.`,
        is_opener: true,
      });

      navigate("/app/pings");
    } catch (e) { console.warn("[OrgHero] message error:", e); toast.error("Something went wrong"); }
  };

  return (
    <>
      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
      <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

      <div className="w-full h-[180px] md:h-[280px] relative overflow-hidden group" style={{
        background: org.cover_url ? `url(${org.cover_url}) center/cover` : "linear-gradient(135deg, #E8580A 0%, #C4460A 100%)",
      }}>
        {isAdmin && (
          <button type="button" className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
            disabled={uploadingCover}
            onClick={() => coverRef.current?.click()}>
            <Camera className="w-3.5 h-3.5" /> {uploadingCover ? "Uploading..." : "Change cover"}
          </button>
        )}
      </div>

      <div className="max-w-[960px] mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-start gap-4 -mt-12 relative z-10">
          <div className="w-[72px] h-[72px] md:w-24 md:h-24 rounded-full flex items-center justify-center text-[20px] md:text-[24px] font-bold shrink-0 overflow-hidden cursor-pointer relative"
            style={{
              background: org.logo_url ? "#fff" : "#E8580A",
              color: org.logo_url ? undefined : "#fff",
              border: "3px solid #fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
            }}
            onClick={() => isAdmin && logoRef.current?.click()}>
            {org.logo_url ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" /> : initials}
            {uploadingLogo && <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-full"><span className="text-[10px] text-white">...</span></div>}
            {org.is_verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#E8580A" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
          </div>

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

            <div className="flex items-center gap-6 mt-3">
              <StatItem value={followerCount} label="Followers" />
              <StatItem value={memberCount} label="Employees" />
              {org.founded_year && <StatItem value={`Since ${org.founded_year}`} label="" />}
            </div>

            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <Button size="default" onClick={onFollow}
                className="min-w-[100px] h-10"
                style={isFollowing ? { background: "#fff", color: "#1A1A1A", border: "1px solid #F0E8E0" } : { background: "#E8580A", color: "#fff" }}>
                {isFollowing ? "Following ✓" : "Follow"}
              </Button>
              <Button variant="secondary" size="default" className="h-10 gap-1.5" style={{ border: "1px solid #F0E8E0" }}
                onClick={handleMessage}>
                <MessageCircle className="w-4 h-4" /> Message
              </Button>
              <div className="relative group/menu">
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
                <div className="absolute right-0 top-full mt-1 w-[180px] rounded-xl py-1 hidden group-hover/menu:block z-20"
                  style={{ background: "#fff", border: "1px solid #F0E8E0", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                  <button type="button" className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 cursor-pointer" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }}>Copy link</button>
                  <button type="button" className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 cursor-pointer" onClick={handleShare}>Share page</button>
                  {isAdmin && (
                    <>
                      <div className="h-px my-1" style={{ background: "#F0E8E0" }} />
                      <button type="button" className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 cursor-pointer" onClick={onNavigateSettings}>Edit Page</button>
                      <button type="button" className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 cursor-pointer" onClick={onNavigateSettings}>Page Settings</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

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
              <button type="button" className="text-[13px] font-semibold mt-3 hover:underline cursor-pointer" style={{ color: "#E8580A" }} onClick={onNavigateSettings}>
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
