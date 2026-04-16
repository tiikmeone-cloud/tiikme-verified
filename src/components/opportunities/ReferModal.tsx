import { useState, useEffect } from "react";
import { X, Search, Link2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sendNotification } from "@/lib/notify";
import { toast } from "sonner";
import AvatarSquare from "@/components/ui/AvatarSquare";

interface Props {
  open: boolean;
  onClose: () => void;
  opportunity: any;
}

export default function ReferModal({ open, onClose, opportunity }: Props) {
  const { user, profile } = useAuth();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [referring, setReferring] = useState(false);

  useEffect(() => {
    if (!search.trim() || search.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, headline")
        .ilike("full_name", `%${search}%`)
        .neq("id", user?.id || "")
        .limit(8);
      setResults(data || []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [search, user?.id]);

  if (!open) return null;

  const handleRefer = async (targetUser: any) => {
    if (!user || !opportunity || referring) return;
    setReferring(true);

    const { error } = await supabase.from("opportunity_referrals").insert({
      opportunity_id: opportunity.id,
      referrer_id: user.id,
      referred_user_id: targetUser.id,
    } as any);

    if (error) {
      if (error.code === "23505") toast.info("Already referred this person");
      else toast.error(error.message);
      setReferring(false);
      return;
    }

    sendNotification({
      userId: targetUser.id,
      actorId: user.id,
      type: "referral",
      title: `${profile?.full_name || "Someone"} referred you for ${opportunity.title}`,
      body: `at ${opportunity.org?.name || "an organization"}`,
      actionUrl: `/app/opportunities`,
      data: { opportunity_id: opportunity.id },
    });

    toast.success(`Referred ${targetUser.full_name}`);
    setReferring(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-[400px] mx-4 rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5" style={{ color: "#E8733A" }} />
            <span className="text-[15px] font-bold" style={{ color: "var(--text-1)" }}>Refer someone</span>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "var(--surface-2)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-3)" }} />
          </button>
        </div>

        <p className="px-5 text-[13px] mb-3" style={{ color: "var(--text-3)" }}>
          Refer a connection for <strong>{opportunity.title}</strong>
        </p>

        <div className="px-5 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-3)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name..."
              className="w-full h-10 rounded-xl pl-9 pr-4 text-[13px] outline-none glass-input" autoFocus />
          </div>
        </div>

        <div className="px-5 pb-5 max-h-[280px] overflow-y-auto space-y-1">
          {loading && <p className="text-[12px] py-3 text-center" style={{ color: "var(--text-3)" }}>Searching...</p>}
          {!loading && search.trim().length >= 2 && results.length === 0 && (
            <p className="text-[12px] py-3 text-center" style={{ color: "var(--text-3)" }}>No users found</p>
          )}
          {results.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all hover:bg-[var(--surface-2)]"
              onClick={() => handleRefer(r)}>
              <AvatarSquare src={r.avatar_url} name={r.full_name || "U"} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-1)" }}>{r.full_name}</p>
                <p className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>{r.headline || r.role || ""}</p>
              </div>
              <Send className="w-4 h-4 shrink-0" style={{ color: "#E8733A" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
