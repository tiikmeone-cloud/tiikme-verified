import { CheckCircle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VerifiedMembersTabProps {
  members: any[];
}

export default function VerifiedMembersTab({ members }: VerifiedMembersTabProps) {
  const navigate = useNavigate();
  const verified = members.filter(m => m.is_verified);

  if (verified.length === 0) {
    return (
      <div className="rounded-xl p-12 text-center" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
        <Users className="w-10 h-10 mx-auto mb-2" style={{ color: "#9CA3AF" }} />
        <p className="text-[14px] font-semibold" style={{ color: "#1A1A1A" }}>No verified members yet</p>
        <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>Members verified by this organisation will appear here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {verified.map((m: any) => {
        const profile = m.profile || {};
        const name = profile.full_name || "User";
        const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
        return (
          <div key={m.id} className="rounded-xl p-4 text-center cursor-pointer hover:-translate-y-0.5 transition-transform"
            style={{ background: "#fff", border: "1px solid #F0E8E0" }}
            onClick={() => navigate(`/app/profile/${profile.id}`)}>
            <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-[14px] font-bold overflow-hidden"
              style={{ background: "#E8580A", color: "#fff" }}>
              {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            <p className="text-[14px] font-semibold truncate" style={{ color: "#1A1A1A" }}>{name}</p>
            <p className="text-[12px] truncate" style={{ color: "#6B6B6B" }}>{m.title || m.role || "Member"}</p>
            <div className="flex items-center justify-center gap-1 mt-1.5">
              <CheckCircle className="w-3.5 h-3.5" style={{ color: "#16A34A" }} />
              <span className="text-[11px] font-medium" style={{ color: "#16A34A" }}>Verified</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
