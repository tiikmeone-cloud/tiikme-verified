/**
 * OrgVerificationRouting
 * Lets org owners/admins assign which admin handles verification requests for each role category.
 * Embeds in the org admin panel.
 */
import { useEffect, useState } from "react";
import { Loader2, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_CATEGORIES } from "@/lib/verificationRoles";
import AvatarSquare from "@/components/ui/AvatarSquare";

type Admin = { user_id: string; role: string; profile?: { full_name: string | null; avatar_url: string | null; username: string | null } };

export default function OrgVerificationRouting({ orgId }: { orgId: string }) {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [routes, setRoutes] = useState<Record<string, string>>({}); // role_category -> user_id
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: adminRows } = await supabase
        .from("org_admins")
        .select("user_id, role")
        .eq("org_id", orgId)
        .in("role", ["owner", "admin", "verifier"]);

      const ids = (adminRows || []).map(a => a.user_id);
      const { data: profs } = ids.length > 0
        ? await supabase.from("profiles").select("id, full_name, avatar_url, username").in("id", ids)
        : { data: [] as any[] };
      const pMap = new Map((profs || []).map((p: any) => [p.id, p]));
      setAdmins((adminRows || []).map(a => ({ ...a, profile: pMap.get(a.user_id) })));

      const { data: routeRows } = await supabase
        .from("org_verif_routes")
        .select("role_category, assigned_to_user_id")
        .eq("org_id", orgId);
      const rMap: Record<string, string> = {};
      (routeRows || []).forEach((r: any) => { if (r.role_category) rMap[r.role_category] = r.assigned_to_user_id; });
      setRoutes(rMap);
      setLoading(false);
    })();
  }, [orgId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing role-category routes for this org and re-insert
      await supabase.from("org_verif_routes").delete().eq("org_id", orgId).not("role_category", "is", null);
      const inserts = Object.entries(routes)
        .filter(([_, uid]) => !!uid)
        .map(([cat, uid]) => ({
          org_id: orgId,
          role_category: cat,
          condition_type: "role_category",
          condition_value: cat,
          assigned_to_user_id: uid,
        }));
      if (inserts.length > 0) {
        const { error } = await supabase.from("org_verif_routes").insert(inserts);
        if (error) throw error;
      }
      toast.success("Routing saved");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-6"><Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--text-3)" }} /></div>;

  if (admins.length === 0) {
    return (
      <div className="p-4 rounded-xl text-center" style={{ background: "var(--surface-2)", border: "1px dashed var(--border)" }}>
        <Users className="w-5 h-5 mx-auto mb-1" style={{ color: "var(--text-3)" }} />
        <p className="text-[12px]" style={{ color: "var(--text-2)" }}>Invite admins first to set up verification routing.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {ROLE_CATEGORIES.map(cat => {
          const assigned = routes[cat.value] || "";
          const sel = admins.find(a => a.user_id === assigned);
          return (
            <div key={cat.value} className="grid grid-cols-[1fr_1.4fr] gap-3 items-center p-2.5 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <p className="text-[12px] font-semibold" style={{ color: "var(--text-1)" }}>{cat.label}</p>
              <div className="flex items-center gap-2">
                {sel?.profile && <AvatarSquare src={sel.profile.avatar_url} name={sel.profile.full_name || "?"} size={24} />}
                <select
                  value={assigned}
                  onChange={e => setRoutes(prev => ({ ...prev, [cat.value]: e.target.value }))}
                  className="flex-1 h-9 rounded-lg px-2 text-[12px] cursor-pointer"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)", outline: "none" }}
                >
                  <option value="">— Unassigned —</option>
                  {admins.map(a => (
                    <option key={a.user_id} value={a.user_id}>
                      {a.profile?.full_name || a.profile?.username || "Admin"} ({a.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-4 inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-bold cursor-pointer disabled:opacity-50"
        style={{ background: "var(--brand)", color: "#fff", border: "none" }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save routing
      </button>
    </div>
  );
}
