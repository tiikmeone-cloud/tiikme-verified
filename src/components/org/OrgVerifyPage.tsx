import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, XCircle, FileText, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import PageLoader from "@/components/PageLoader";

export default function OrgVerifyPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [org, setOrg] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectNote, setRejectNote] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [requesterProfiles, setRequesterProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    const load = async () => {
      if (!slug || !user) return;
      try {
        const { data: orgData } = await supabase.from("organizations").select("*").eq("slug", slug).maybeSingle();
        if (!orgData) { setLoading(false); return; }
        setOrg(orgData);

        // Check admin permission
        const { data: member } = await supabase.from("org_members").select("role").eq("org_id", orgData.id).eq("user_id", user.id).maybeSingle();
        const admin = member?.role === "owner" || member?.role === "admin" || orgData.created_by === user.id;
        setIsAdmin(admin);
        if (!admin) { setLoading(false); return; }

        const { data: reqs } = await supabase.from("verification_requests")
          .select("*")
          .eq("org_id", orgData.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        setRequests(reqs || []);
        if (reqs?.length) setSelected(reqs[0]);

        // Fetch requester profiles
        if (reqs?.length) {
          const ids = [...new Set(reqs.map(r => r.requester_id))];
          const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url, username").in("id", ids);
          if (profiles) {
            const map: Record<string, any> = {};
            profiles.forEach(p => { map[p.id] = p; });
            setRequesterProfiles(map);
          }
        }
      } catch (e) { console.warn("[OrgVerify] error:", e); }
      setLoading(false);
    };
    load();
  }, [slug, user]);

  const handleApprove = async (req: any) => {
    try {
      await supabase.from("verification_requests").update({ status: "approved", reviewed_by: user!.id, updated_at: new Date().toISOString() }).eq("id", req.id);
      toast.success("Verification approved");
      setRequests(prev => prev.filter(r => r.id !== req.id));
      setSelected(requests.find(r => r.id !== req.id) || null);
    } catch (e) { console.warn("[OrgVerify] approve error:", e); }
  };

  const handleReject = async (req: any) => {
    try {
      await supabase.from("verification_requests").update({ status: "rejected", reviewed_by: user!.id, review_note: rejectNote || null, updated_at: new Date().toISOString() }).eq("id", req.id);
      toast.success("Request rejected");
      setRequests(prev => prev.filter(r => r.id !== req.id));
      setSelected(requests.find(r => r.id !== req.id) || null);
      setRejectNote("");
    } catch (e) { console.warn("[OrgVerify] reject error:", e); }
  };

  if (loading) return <PageLoader />;
  if (!org) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#FFF8F2" }}><p>Not found</p></div>;
  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#FFF8F2" }}>
      <div className="text-center">
        <p className="text-[16px] font-bold" style={{ color: "#1A1A1A" }}>Access Denied</p>
        <p className="text-[13px] mt-1" style={{ color: "#9CA3AF" }}>Only admins can review verification requests</p>
        <button type="button" onClick={() => navigate(`/org/${slug}`)} className="text-[13px] mt-3 font-semibold" style={{ color: "#E8580A" }}>← Back to page</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#FFF8F2" }}>
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3" style={{ borderColor: "#F0E8E0" }}>
        <button type="button" onClick={() => navigate(`/org/${slug}`)} className="flex items-center gap-2 text-[13px]" style={{ color: "#6B6B6B" }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-[15px] font-bold" style={{ color: "#1A1A1A" }}>Verification Requests</span>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(232,88,10,0.1)", color: "#E8580A" }}>{requests.length}</span>
      </div>

      <div className="max-w-[960px] mx-auto px-4 py-6">
        {requests.length === 0 ? (
          <div className="rounded-xl p-12 text-center" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
            <CheckCircle className="w-10 h-10 mx-auto mb-2" style={{ color: "#16A34A" }} />
            <p className="text-[14px] font-semibold" style={{ color: "#1A1A1A" }}>No pending requests</p>
            <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>All verification requests have been reviewed</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-4">
            {/* Left panel */}
            <div className="w-full md:w-[380px] shrink-0 space-y-2">
              {requests.map(req => {
                const profile = requesterProfiles[req.requester_id];
                return (
                  <button key={req.id} type="button" onClick={() => setSelected(req)}
                    className="w-full text-left rounded-xl p-4 transition-colors"
                    style={{ background: selected?.id === req.id ? "rgba(232,88,10,0.06)" : "#fff", border: `1px solid ${selected?.id === req.id ? "#E8580A" : "#F0E8E0"}` }}>
                    <p className="text-[14px] font-semibold" style={{ color: "#1A1A1A" }}>{req.item_type}: {req.submitted_id}</p>
                    <p className="text-[12px]" style={{ color: "#9CA3AF" }}>By: {profile?.full_name || req.requester_id.slice(0, 8) + "..."}</p>
                    <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{new Date(req.created_at).toLocaleDateString()}</p>
                  </button>
                );
              })}
            </div>

            {/* Right panel */}
            {selected && (
              <div className="flex-1 rounded-xl p-6" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
                <h3 className="text-[16px] font-bold mb-4" style={{ color: "#1A1A1A" }}>Request Detail</h3>
                <div className="space-y-3 mb-6">
                  <DetailRow label="Type" value={selected.item_type} />
                  <DetailRow label="Submitted ID" value={selected.submitted_id} />
                  <DetailRow label="Requester" value={requesterProfiles[selected.requester_id]?.full_name || selected.requester_id} />
                  {selected.context_note && <DetailRow label="Context" value={selected.context_note} />}
                  {selected.supporting_doc_url && (
                    <div>
                      <p className="text-[12px] font-medium" style={{ color: "#9CA3AF" }}>Supporting Document</p>
                      <a href={selected.supporting_doc_url} target="_blank" rel="noopener noreferrer" className="text-[13px] flex items-center gap-1 hover:underline" style={{ color: "#E8580A" }}>
                        <FileText className="w-3.5 h-3.5" /> View document
                      </a>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <p className="text-[12px] font-medium mb-1" style={{ color: "#9CA3AF" }}>Rejection note (optional)</p>
                  <Textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Reason for rejection..." className="min-h-[60px]" />
                </div>

                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" className="gap-1" onClick={() => handleReject(selected)}>
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </Button>
                  <Button size="sm" className="gap-1" style={{ background: "#16A34A", color: "#fff" }} onClick={() => handleApprove(selected)}>
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1" onClick={async () => {
                    if (!user || !selected) return;
                    try {
                      const { data: conv } = await supabase.from("conversations").insert({ participant_1: user.id, participant_2: selected.user_id }).select().single();
                      if (conv) { await supabase.from("pings").insert({ conversation_id: conv.id, sender_id: user.id, content: `Regarding your verification request for ${org.name}: Could you provide more details?`, is_opener: true }); }
                      navigate("/app/pings");
                    } catch (e) { console.warn("[OrgVerify]", e); toast.error("Failed to send message"); }
                  }}>
                    <MessageCircle className="w-3.5 h-3.5" /> Request More Info
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] font-medium" style={{ color: "#9CA3AF" }}>{label}</p>
      <p className="text-[14px]" style={{ color: "#1A1A1A" }}>{value}</p>
    </div>
  );
}