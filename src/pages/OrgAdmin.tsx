import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import PageLoader from "@/components/PageLoader";
import { ArrowLeft, Search, Trash2, Shield, ShieldCheck } from "lucide-react";

export default function OrgAdmin() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [org, setOrg] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [pendingReqs, setPendingReqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  // Search to add members
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);

  // Editable settings
  const [allowReqs, setAllowReqs] = useState(true);
  const [allowMsgs, setAllowMsgs] = useState(true);
  const [emailDomain, setEmailDomain] = useState("");

  const fetchAll = useCallback(async () => {
    if (!slug || !user) return;
    setLoading(true);
    const { data: orgData } = await supabase.from("organizations" as any).select("*").eq("slug", slug).single();
    if (!orgData) { setLoading(false); navigate("/"); return; }
    setOrg(orgData as any);
    setAllowReqs((orgData as any).allow_employee_requests);
    setAllowMsgs((orgData as any).allow_messages);
    setEmailDomain((orgData as any).email_domain || "");

    const orgId = (orgData as any).id;
    const [membersRes, reqsRes] = await Promise.all([
      supabase.from("org_members" as any).select("*, profile:profiles!user_id(id, full_name, avatar_url, username, role)").eq("org_id", orgId),
      supabase.from("org_verif_requests" as any).select("*, profile:profiles!user_id(id, full_name, avatar_url, username, role)").eq("org_id", orgId).eq("status", "pending"),
    ]);
    const mems = (membersRes.data as any) || [];
    setMembers(mems);
    setPendingReqs((reqsRes.data as any) || []);

    const me = mems.find((m: any) => m.user_id === user.id);
    if (!me || !['owner', 'admin'].includes(me.role)) { navigate(`/org/${slug}`); return; }
    setIsOwner(me.role === 'owner');
    setLoading(false);
  }, [slug, user, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Search users
  useEffect(() => {
    if (searchQ.length < 2 || !org) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      const memberIds = members.map(m => m.user_id);
      const { data } = await supabase.from("profiles")
        .select("id, full_name, username, avatar_url, role")
        .or(`full_name.ilike.%${searchQ}%,username.ilike.%${searchQ}%`)
        .not("id", "in", `(${memberIds.join(",")})`)
        .limit(8);
      setSearchResults(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQ, org, members]);

  const handleAddMember = async (profileId: string) => {
    if (!org) return;
    setAddingId(profileId);
    const { error } = await supabase.from("org_members" as any).insert({
      org_id: org.id, user_id: profileId, role: "member", is_verified: true, verified_at: new Date().toISOString(),
    } as any);
    if (error) toast({ title: "Failed to add", description: error.message, variant: "destructive" });
    else { toast({ title: "Member added ✓" }); fetchAll(); setSearchQ(""); }
    setAddingId(null);
  };

  const handleApprove = async (req: any) => {
    await supabase.from("org_verif_requests" as any).update({ status: "approved", reviewed_by: user!.id, reviewed_at: new Date().toISOString() } as any).eq("id", req.id);
    await supabase.from("org_members" as any).insert({
      org_id: org!.id, user_id: req.user_id, role: "member",
      title: req.title_at_org, is_verified: true, verified_at: new Date().toISOString(),
    } as any);
    toast({ title: `Approved ${req.profile?.full_name}` });
    fetchAll();
  };

  const handleDecline = async (req: any) => {
    await supabase.from("org_verif_requests" as any).update({ status: "rejected", reviewed_by: user!.id, reviewed_at: new Date().toISOString() } as any).eq("id", req.id);
    setPendingReqs(prev => prev.filter(r => r.id !== req.id));
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    await supabase.from("org_members" as any).update({ role: newRole } as any).eq("id", memberId);
    toast({ title: "Role updated" });
    fetchAll();
  };

  const handleRemoveMember = async (memberId: string) => {
    await supabase.from("org_members" as any).delete().eq("id", memberId);
    toast({ title: "Member removed" });
    fetchAll();
  };

  const handleSaveSettings = async () => {
    if (!org) return;
    await supabase.from("organizations" as any).update({
      allow_employee_requests: allowReqs,
      allow_messages: allowMsgs,
      email_domain: emailDomain || null,
    } as any).eq("id", org.id);
    toast({ title: "Settings saved ✓" });
  };

  if (loading) return <PageLoader />;
  if (!org) return null;

  return (
    <div className="min-h-screen" style={{ background: "#FFF8F2" }} data-theme="light">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/org/${slug}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>Manage {org.name}</h1>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>Admin Panel</p>
          </div>
        </div>

        <Tabs defaultValue="members">
          <TabsList style={{ background: "var(--surface)" }}>
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
            <TabsTrigger value="requests">
              Requests {pendingReqs.length > 0 && <Badge className="ml-1 text-xs" style={{ background: "var(--brand)", color: "#fff" }}>{pendingReqs.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Members */}
          <TabsContent value="members" className="mt-4 space-y-4">
            {/* Search to add */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4" style={{ color: "var(--text-3)" }} />
              <Input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search by name or @username to invite..." className="pl-9" />
            </div>
            {searchResults.length > 0 && (
              <div className="rounded-lg border divide-y" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                {searchResults.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={p.avatar_url} />
                      <AvatarFallback>{(p.full_name || "U").substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>{p.full_name}</p>
                      <p className="text-xs" style={{ color: "var(--text-3)" }}>@{p.username}</p>
                    </div>
                    <Button size="sm" onClick={() => handleAddMember(p.id)} disabled={addingId === p.id}
                      style={{ background: "var(--brand)", color: "#fff" }}>
                      {addingId === p.id ? "..." : "+ Add"}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Current members */}
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={m.profile?.avatar_url} />
                  <AvatarFallback>{(m.profile?.full_name || "U").substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{m.profile?.full_name}</p>
                  <p className="text-xs" style={{ color: "var(--text-2)" }}>{m.title || m.role}</p>
                </div>
                <Badge variant="outline" className="text-xs capitalize">{m.role}</Badge>
                {isOwner && m.user_id !== user?.id && (
                  <div className="flex gap-1">
                    <select
                      value={m.role}
                      onChange={e => handleChangeRole(m.id, e.target.value)}
                      className="text-xs h-8 px-2 rounded border"
                      style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-1)" }}
                    >
                      <option value="member">Member</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveMember(m.id)}>
                      <Trash2 className="w-3.5 h-3.5" style={{ color: "var(--danger)" }} />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          {/* Requests */}
          <TabsContent value="requests" className="mt-4 space-y-3">
            {pendingReqs.length === 0 && <p className="text-sm text-center py-8" style={{ color: "var(--text-3)" }}>No pending requests</p>}
            {pendingReqs.map(req => (
              <div key={req.id} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={req.profile?.avatar_url} />
                  <AvatarFallback>{(req.profile?.full_name || "U").substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{req.profile?.full_name}</p>
                  <p className="text-xs" style={{ color: "var(--text-2)" }}>{req.title_at_org} · {req.member_type}</p>
                  {req.message && <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>"{req.message}"</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(req)} style={{ background: "#10B981", color: "#fff" }}>Approve</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDecline(req)}>Decline</Button>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="mt-4 space-y-4">
            <div className="rounded-xl p-4 space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>Allow verification requests</p>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>Members can request verification</p>
                </div>
                <Switch checked={allowReqs} onCheckedChange={setAllowReqs} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>Allow messages</p>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>Public can message this org</p>
                </div>
                <Switch checked={allowMsgs} onCheckedChange={setAllowMsgs} />
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: "var(--text-1)" }}>Email domain (for auto-verification)</label>
                <Input value={emailDomain} onChange={e => setEmailDomain(e.target.value)} placeholder="e.g. tcs.com" className="mt-1" />
                <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Users with this email domain can auto-verify</p>
              </div>
              <Button onClick={handleSaveSettings} style={{ background: "var(--brand)", color: "#fff" }}>Save Settings</Button>
            </div>

            {isOwner && (
              <div className="rounded-xl p-4" style={{ background: "#FEF2F2", border: "1px solid var(--danger)" }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--danger)" }}>Danger Zone</h3>
                <p className="text-xs mb-3" style={{ color: "var(--text-2)" }}>Permanently delete this organization page. This cannot be undone.</p>
                <Button variant="destructive" size="sm" onClick={async () => {
                  if (!confirm("Are you sure? This cannot be undone.")) return;
                  await supabase.from("organizations" as any).delete().eq("id", org.id);
                  toast({ title: "Organization deleted" });
                  navigate("/app/feed");
                }}>Delete Organization</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
