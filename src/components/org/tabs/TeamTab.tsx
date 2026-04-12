import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Plus, CheckCircle, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TeamTabProps {
  org: any;
  members: any[];
  isAdmin: boolean;
}

const TIERS = [
  { key: "leadership", label: "Leadership", roles: ["owner", "admin"] },
  { key: "heads", label: "Department Heads", roles: ["hod", "team_lead"] },
  { key: "team", label: "Team Members", roles: ["member", "hr_admin", "recruiter", "verifier", "poster", "faculty"] },
];

export default function TeamTab({ org, members, isAdmin }: TeamTabProps) {
  const navigate = useNavigate();
  const [view, setView] = useState<"grid" | "list">("grid");

  const groupedMembers = TIERS.map(tier => ({
    ...tier,
    items: members.filter(m => tier.roles.includes(m.role || "member")),
  })).filter(g => g.items.length > 0);

  // If no tier matched, show all under "Team Members"
  const ungrouped = members.filter(m => !TIERS.some(t => t.roles.includes(m.role || "member")));
  if (ungrouped.length > 0) {
    const existing = groupedMembers.find(g => g.key === "team");
    if (existing) existing.items.push(...ungrouped);
    else groupedMembers.push({ key: "team", label: "Team Members", roles: [], items: ungrouped });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setView("grid")} className="text-[12px] font-semibold px-3 py-1 rounded-lg"
            style={{ background: view === "grid" ? "rgba(232,88,10,0.1)" : "transparent", color: view === "grid" ? "#E8580A" : "#6B6B6B" }}>Grid</button>
          <button type="button" onClick={() => setView("list")} className="text-[12px] font-semibold px-3 py-1 rounded-lg"
            style={{ background: view === "list" ? "rgba(232,88,10,0.1)" : "transparent", color: view === "list" ? "#E8580A" : "#6B6B6B" }}>List</button>
        </div>
        {isAdmin && (
          <Button size="sm" className="gap-1" style={{ background: "#E8580A", color: "#fff" }}>
            <Plus className="w-3.5 h-3.5" /> Add Team Member
          </Button>
        )}
      </div>

      {members.length === 0 && (
        <div className="rounded-xl p-12 text-center" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
          <Users className="w-10 h-10 mx-auto mb-2" style={{ color: "#9CA3AF" }} />
          <p className="text-[14px] font-semibold" style={{ color: "#1A1A1A" }}>No team members yet</p>
          <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>Verified team members will appear here</p>
        </div>
      )}

      {view === "grid" && groupedMembers.map(group => (
        <div key={group.key} className="mb-6">
          <h3 className="text-[14px] font-bold mb-3" style={{ color: "#1A1A1A" }}>{group.label}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {group.items.map((m: any) => {
              const profile = m.profile || {};
              const name = profile.full_name || "User";
              const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={m.id} className="rounded-xl p-4 text-center cursor-pointer hover:-translate-y-0.5 transition-transform"
                  style={{ background: "#fff", border: "1px solid #F0E8E0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                  onClick={() => navigate(`/app/profile/${profile.id}`)}>
                  <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-[14px] font-bold overflow-hidden"
                    style={{ background: "#E8580A", color: "#fff" }}>
                    {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
                  </div>
                  <p className="text-[15px] font-semibold truncate" style={{ color: "#1A1A1A" }}>{name}</p>
                  <p className="text-[13px] truncate" style={{ color: "#6B6B6B" }}>{m.title || m.role || "Member"}</p>
                  {m.department && <span className="inline-block text-[11px] px-2 py-0.5 rounded-full mt-1" style={{ background: "#F3F4F6", color: "#6B6B6B" }}>{m.department}</span>}
                  {m.is_verified && (
                    <div className="flex items-center justify-center gap-1 mt-1.5">
                      <CheckCircle className="w-3 h-3" style={{ color: "#16A34A" }} />
                      <span className="text-[10px] font-medium" style={{ color: "#16A34A" }}>Verified</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {view === "list" && (
        <div className="rounded-xl overflow-hidden" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: "1px solid #F0E8E0" }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#9CA3AF" }}>Member</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#9CA3AF" }}>Role</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: "#9CA3AF" }}>Department</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: "#9CA3AF" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m: any) => {
                const profile = m.profile || {};
                const name = profile.full_name || "User";
                const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <tr key={m.id} className="hover:bg-gray-50 cursor-pointer" style={{ borderBottom: "1px solid #F0E8E0" }}
                    onClick={() => navigate(`/app/profile/${profile.id}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0"
                          style={{ background: "#E8580A", color: "#fff" }}>
                          {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
                        </div>
                        <span className="font-medium" style={{ color: "#1A1A1A" }}>{name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: "#6B6B6B" }}>{m.title || m.role || "Member"}</td>
                    <td className="px-4 py-3 hidden md:table-cell" style={{ color: "#6B6B6B" }}>{m.department || "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {m.is_verified ? (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>Verified</span>
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#9CA3AF" }}>Pending</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
