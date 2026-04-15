import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sendNotification } from "@/lib/notify";
import { toast } from "sonner";
import GlassModal from "@/components/ui/GlassModal";
import { TrendingUp } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  startupId: string;
  startupName: string;
  founderId: string;
}

const INTEREST_TYPES = [
  { value: "interested", label: "Interested", desc: "I want to learn more" },
  { value: "watching", label: "Watching", desc: "I am tracking this startup" },
  { value: "invested", label: "Invested", desc: "I have already invested" },
];

export default function InvestorInterestModal({ open, onClose, startupId, startupName, founderId }: Props) {
  const { user, profile } = useAuth();
  const [interestType, setInterestType] = useState("interested");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!user) return;
    setSending(true);
    const { error } = await supabase.from("investor_interests").insert({
      investor_id: user.id,
      startup_id: startupId,
      interest_type: interestType,
      message: message.trim() || null,
    });
    if (error) {
      setSending(false);
      toast.error(error.message);
      return;
    }
    sendNotification({
      userId: founderId,
      actorId: user.id,
      type: "investor_interest",
      title: `${profile?.full_name || "An investor"} is ${interestType} in ${startupName}`,
      actionUrl: `/app/workspace`,
    });
    setSending(false);
    toast.success("Interest sent to founder");
    onClose();
    setMessage("");
    setInterestType("interested");
  };

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      title={`Express Interest in ${startupName}`}
      icon={TrendingUp}
      accentColor="#15803D"
      actions={
        <>
          <button type="button" onClick={send} disabled={sending}
            className="btn-liquid-primary cursor-pointer"
            style={{ padding: "10px 28px", borderRadius: 16, fontSize: 14, fontWeight: 600 }}>
            {sending ? "Sending..." : "Send Interest"}
          </button>
          <button type="button" onClick={onClose}
            className="btn-glass-pill cursor-pointer"
            style={{ padding: "10px 20px", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>
            Cancel
          </button>
        </>
      }
    >
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: "rgba(255,255,255,0.50)" }}>Interest Type</label>
        <div className="space-y-2">
          {INTEREST_TYPES.map(t => (
            <button key={t.value} type="button" onClick={() => setInterestType(t.value)}
              className="w-full text-left px-4 py-3 rounded-xl cursor-pointer transition-all"
              style={{
                background: interestType === t.value ? "rgba(21,128,61,0.15)" : "rgba(255,255,255,0.05)",
                border: interestType === t.value ? "1.5px solid rgba(21,128,61,0.40)" : "1.5px solid rgba(255,255,255,0.10)",
              }}>
              <span className="text-[14px] font-semibold" style={{ color: interestType === t.value ? "#34C759" : "rgba(255,255,255,0.80)" }}>{t.label}</span>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.50)" }}>{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "rgba(255,255,255,0.50)" }}>Message (optional)</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value.slice(0, 500))}
          placeholder="Tell the founder why you're interested..."
          rows={3}
          maxLength={500}
          className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.90)" }}
        />
      </div>
    </GlassModal>
  );
}
