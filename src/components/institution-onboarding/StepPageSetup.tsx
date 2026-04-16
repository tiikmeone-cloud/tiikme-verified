import { useState, useRef } from "react";
import { Upload, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateSlug } from "@/lib/utils";
import type { InstitutionFormData } from "@/pages/JoinAsInstitution";

const inputStyle: React.CSSProperties = {
  background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 14,
  color: "#111827", height: 48, width: "100%", padding: "0 14px", fontSize: 14,
  outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const allIndianStates = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];

interface Props {
  form: InstitutionFormData;
  update: (p: Partial<InstitutionFormData>) => void;
  onComplete: (slug: string) => void;
}

export default function StepPageSetup({ form, update, onComplete }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }
    update({ logoFile: file, logoPreview: URL.createObjectURL(file) });
  };

  const handleComplete = async () => {
    if (!form.orgName.trim()) { toast.info("Enter your organisation name"); return; }
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Session expired. Please sign in again."); setSubmitting(false); return; }

      // Ensure profile exists (handle_new_user trigger may lag)
      const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
      if (!existingProfile) {
        await supabase.from("profiles").insert({
          id: user.id,
          full_name: form.orgName,
          username: "org-" + user.id.slice(0, 8),
          account_type: "institution",
          onboarding_complete: true,
        });
      }

      // Upload logo if provided
      let logoUrl: string | null = null;
      if (form.logoFile) {
        const ext = form.logoFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("org-logos").upload(path, form.logoFile);
        if (!upErr) {
          const { data: pub } = supabase.storage.from("org-logos").getPublicUrl(path);
          logoUrl = pub.publicUrl;
        }
      }

      // Generate unique slug
      const baseSlug = generateSlug(form.orgName);
      const slug = `${baseSlug}-${Date.now().toString(36)}`;

      // Create organization
      const { data: org, error: orgErr } = await supabase.from("organizations").insert({
        name: form.orgName,
        slug,
        type: form.orgType,
        subtype: form.orgSubtype || null,
        tagline: form.tagline || null,
        logo_url: logoUrl,
        city: form.city || null,
        state: form.state || null,
        website_url: form.website || null,
        created_by: user.id,
        email: form.email,
        email_domain: form.email.split("@")[1]?.toLowerCase() || null,
      }).select().single();

      if (orgErr) { toast.error("Failed to create organisation: " + orgErr.message); setSubmitting(false); return; }

      // Create owner membership
      await supabase.from("org_members").insert({
        org_id: org.id,
        user_id: user.id,
        role: "owner",
        title: form.repRole,
        is_verified: true,
        is_current: true,
      });

      // Update profile
      await supabase.from("profiles").update({
        account_type: "institution",
        org_id: org.id,
        full_name: form.repName || form.orgName,
        onboarding_complete: true,
      }).eq("id", user.id);

      // Create subscription record (90-day trial)
      await supabase.from("org_subscriptions" as any).insert({
        org_id: org.id,
        profile_id: user.id,
        plan: "trial",
        status: "active",
        trial_started_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 0,
        currency: "INR",
        discount_months_remaining: 3,
      });

      toast.success("Organisation created!");
      onComplete(slug);
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    }
    setSubmitting(false);
  };

  return (
    <div>
      <h1 className="text-[22px] font-extrabold mb-1" style={{ color: "var(--text-1)" }}>Set up your page</h1>
      <p className="text-[13px] mb-6" style={{ color: "var(--text-3)" }}>This is how your organisation will appear on Tiikme</p>

      <div className="space-y-4">
        {/* Logo upload */}
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer shrink-0"
            style={{ background: form.logoPreview ? "transparent" : "#FFF3EC", border: "2px dashed #E5E7EB" }}>
            {form.logoPreview ? (
              <img src={form.logoPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload className="w-5 h-5" style={{ color: "var(--brand)" }} />
                <span className="text-[9px] font-bold" style={{ color: "var(--brand)" }}>Logo</span>
              </div>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
          <div className="flex-1">
            <label className="text-[12px] font-bold mb-1 block" style={{ color: "var(--text-2)" }}>Organisation Name *</label>
            <input
              type="text" placeholder="e.g. Acme Technologies Pvt Ltd"
              value={form.orgName} onChange={e => update({ orgName: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label className="text-[12px] font-bold mb-1 block" style={{ color: "var(--text-2)" }}>Tagline</label>
          <input
            type="text" placeholder="One-liner about your organisation"
            value={form.tagline} onChange={e => update({ tagline: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[12px] font-bold mb-1 block" style={{ color: "var(--text-2)" }}>City</label>
            <input type="text" placeholder="Mumbai" value={form.city} onChange={e => update({ city: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label className="text-[12px] font-bold mb-1 block" style={{ color: "var(--text-2)" }}>State</label>
            <select
              value={form.state} onChange={e => update({ state: e.target.value })}
              style={{ ...inputStyle, appearance: "none" as any }}
            >
              <option value="">Select</option>
              {allIndianStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[12px] font-bold mb-1 block" style={{ color: "var(--text-2)" }}>Website</label>
          <input type="url" placeholder="https://yourcompany.com" value={form.website} onChange={e => update({ website: e.target.value })} style={inputStyle} />
        </div>

        <Button onClick={handleComplete} disabled={submitting} size="xl" className="w-full mt-2">
          {submitting ? "Creating..." : "Launch your page →"}
        </Button>
      </div>
    </div>
  );
}
