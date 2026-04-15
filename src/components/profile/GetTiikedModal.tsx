import { storageImageUrl } from "@/lib/imageTransform";
import { useState } from "react";
import { X, Mail, UserCheck, FileText, Building2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  userRole: string;
  onVerified?: () => void;
}

const GetTiikedModal = ({ open, onClose, userId, userRole, onVerified }: Props) => {
  const [step, setStep] = useState<"choose" | "email" | "peer" | "document">("choose");
  const [email, setEmail] = useState("");
  const [peerSearch, setPeerSearch] = useState("");
  const [peerResults, setPeerResults] = useState<any[]>([]);
  const [sending, setSending] = useState(false);

  const searchPeers = async (q: string) => {
    setPeerSearch(q);
    if (q.length < 2) { setPeerResults([]); return; }
    const { data } = await supabase.from("profiles").select("id, full_name, username, avatar_url, role, institution_name")
      .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`).neq("id", userId).limit(8);
    setPeerResults(data || []);
  };

  const sendPeerRequest = async (verifierId: string, verifierName: string) => {
    setSending(true);
    const { error } = await supabase.from("verifications").insert({
      subject_user_id: userId, verifier_user_id: verifierId,
      verification_type: "peer", scope: "profile", status: "pending",
    });
    if (error) { toast.error(error.message); setSending(false); return; }
    // Send alert
    await supabase.from("alerts").insert({
      user_id: verifierId, type: "verification_request",
      title: "Tiik Verification Request",
      body: "Someone is requesting you to verify their profile on Tiikme.",
      action_url: `/app/profile/${userId}`,
      data: { actor_id: userId } as any,
    });
    toast.success(`Verification request sent to ${verifierName}`);
    setSending(false);
    onClose();
  };

  const handleEmailVerify = async () => {
    if (!email.trim()) return;
    setSending(true);
    await supabase.from("verifications").insert({
      subject_user_id: userId, verification_type: "email",
      scope: "profile", status: "pending", notes: email,
    });
    toast.success("Verification email sent! Check your inbox.");
    setSending(false);
    onClose();
  };

  if (!open) return null;

  const cards = (() => {
    switch (userRole) {
      case "student":
        return [
          { id: "email", icon: Mail, title: "Institutional Email", desc: "Verify with your .ac.in or .edu college email", action: () => setStep("email") },
          { id: "peer", icon: UserCheck, title: "Faculty Verification", desc: "Ask your professor or guide to verify you", action: () => setStep("peer") },
        ];
      case "professional": case "hr":
        return [
          { id: "email", icon: Mail, title: "Work Email", desc: "Verify with your official company email", action: () => setStep("email") },
          { id: "peer", icon: UserCheck, title: "Manager / HR Verification", desc: "Ask your manager or HR to verify your employment", action: () => setStep("peer") },
          { id: "document", icon: FileText, title: "Experience Letter", desc: "Upload your relieving or experience letter", action: () => setStep("document") },
        ];
      case "doctor":
        return [
          { id: "email", icon: Building2, title: "NMC Registration", desc: "Enter your NMC/State Council registration number", action: () => setStep("email") },
          { id: "peer", icon: UserCheck, title: "Hospital Admin Verification", desc: "Ask your hospital's admin to verify you", action: () => setStep("peer") },
        ];
      case "government":
        return [
          { id: "email", icon: Mail, title: "Official Email (.gov.in / .nic.in)", desc: "Verify with your government email address", action: () => setStep("email") },
          { id: "peer", icon: UserCheck, title: "Senior Officer Verification", desc: "Ask a senior officer to verify your posting", action: () => setStep("peer") },
        ];
      case "faculty":
        return [
          { id: "email", icon: Mail, title: "Institutional Email", desc: "Verify with your college/university email", action: () => setStep("email") },
          { id: "peer", icon: UserCheck, title: "HOD / Dean Verification", desc: "Ask your department head to verify you", action: () => setStep("peer") },
        ];
      default:
        return [
          { id: "email", icon: Mail, title: "Email Verification", desc: "Verify with your official email", action: () => setStep("email") },
          { id: "peer", icon: UserCheck, title: "Peer Verification", desc: "Ask someone to verify you", action: () => setStep("peer") },
        ];
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card p-6 max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: "#F59E0B" }} />
            <h2 className="text-[18px] font-extrabold" style={{ color: "var(--text-1)" }}>
              {step === "choose" ? "Get Tiiked" : step === "email" ? "Email Verification" : step === "document" ? "Document Upload" : "Peer Verification"}
            </h2>
          </div>
          <button type="button" onClick={() => { onClose(); setStep("choose"); }} className="p-1 cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-5 h-5" /></button>
        </div>

        {step === "choose" && (
          <div className="space-y-3">
            <p className="text-[13px] mb-3" style={{ color: "var(--text-2)" }}>Choose how you'd like to get verified:</p>
            {cards.map(c => (
              <button type="button" key={c.id} onClick={c.action}
                className="w-full flex items-start gap-3 p-4 rounded-xl text-left cursor-pointer transition-all duration-150 hover:scale-[1.01]"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(245,158,11,0.1)" }}>
                  <c.icon className="w-5 h-5" style={{ color: "#F59E0B" }} />
                </div>
                <div>
                  <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{c.title}</p>
                  <p className="text-[12px]" style={{ color: "var(--text-3)" }}>{c.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === "email" && (
          <div className="space-y-4">
            <p className="text-[13px]" style={{ color: "var(--text-2)" }}>Enter your official email address to receive a verification link.</p>
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder={userRole === "government" ? "name@gov.in or name@nic.in" : userRole === "student" ? "name@college.ac.in" : "name@company.com"} type="email" />
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setStep("choose")}>Back</Button>
              <Button className="flex-1" onClick={handleEmailVerify} disabled={sending || !email.trim()}>{sending ? "Sending..." : "Verify now"}</Button>
            </div>
          </div>
        )}

        {step === "peer" && (
          <div className="space-y-4">
            <p className="text-[13px]" style={{ color: "var(--text-2)" }}>Search for your {userRole === "student" ? "professor or guide" : userRole === "doctor" ? "hospital admin or HOD" : "manager or HR"} on Tiikme.</p>
            <Input value={peerSearch} onChange={e => searchPeers(e.target.value)} placeholder="Search by name or @username..." autoFocus />
            <div className="max-h-[250px] overflow-y-auto space-y-1">
              {peerResults.map(u => (
                <button type="button" key={u.id} onClick={() => sendPeerRequest(u.id, u.full_name || u.username)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all hover:bg-[var(--surface-2)]"
                  disabled={sending}>
                  <div className="w-9 h-9 flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ borderRadius: 0, background: "var(--brand)" }}>
                    {u.avatar_url ? <img src={storageImageUrl(u.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" style={{ borderRadius: 0 }} /> : (u.full_name || "U")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{u.full_name || u.username}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-3)" }}>@{u.username} · {u.role}{u.institution_name ? ` · ${u.institution_name}` : ""}</p>
                  </div>
                  <span className="text-[11px] font-bold shrink-0" style={{ color: "var(--brand)" }}>Send request</span>
                </button>
              ))}
              {peerSearch.length >= 2 && peerResults.length === 0 && (
                <p className="text-[12px] text-center py-4" style={{ color: "var(--text-3)" }}>No users found</p>
              )}
            </div>
            <Button variant="ghost" className="w-full" onClick={() => setStep("choose")}>← Back</Button>
          </div>
        )}

        {step === "document" && (
          <div className="space-y-4">
            <p className="text-[13px]" style={{ color: "var(--text-2)" }}>Upload your experience letter, relieving letter, or official document for verification.</p>
            <div className="rounded-xl p-6 text-center cursor-pointer" style={{ border: "2px dashed var(--border)", background: "var(--surface-2)" }}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".pdf,.jpg,.jpeg,.png";
                input.onchange = async (e: any) => {
                  const file = e.target.files?.[0];
                  if (!file || !userId) return;
                  if (file.size > 10 * 1024 * 1024) { toast.error("Max 10MB"); return; }
                  try {
                    const path = `${userId}/verify-${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
                    const { error: upErr } = await supabase.storage.from("work-assets").upload(path, file);
                    if (upErr) { toast.error("Upload failed"); return; }
                    const { data: urlData } = supabase.storage.from("work-assets").getPublicUrl(path);
                    await supabase.from("alerts").insert({ user_id: userId, type: "verification_request", title: "Document submitted for verification", body: "Your document has been uploaded. Our team will review it shortly.", data: { doc_url: urlData?.publicUrl } as any });
                    toast.success("Document uploaded! We'll review it shortly.");
                    onClose();
                    setStep("choose");
                  } catch (err) { console.warn("[GetTiiked] doc upload:", err); toast.error("Upload failed"); }
                };
                input.click();
              }}>
              <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
              <p className="text-[14px] font-semibold" style={{ color: "var(--text-1)" }}>Click to upload PDF or image</p>
              <p className="text-[12px] mt-1" style={{ color: "var(--text-3)" }}>Max 10MB · PDF, JPG, PNG</p>
            </div>
            <Button variant="ghost" className="w-full" onClick={() => setStep("choose")}>← Back</Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default GetTiikedModal;
