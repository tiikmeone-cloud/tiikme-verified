import { useState, useRef } from "react";
import { Camera, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateSlug } from "@/lib/utils";
import { SIZE_OPTIONS, inputStyle, cardStyle } from "./constants";

interface Props {
  orgName: string;
  orgType: string;
  city: string;
  state: string;
  website: string;
  repRole: string;
  repDesignation: string;
  repDepartment: string;
  onComplete: (slug: string) => void;
}

export default function StepPageSetup({
  orgName, orgType, city, state, website,
  repRole, repDesignation, repDepartment, onComplete,
}: Props) {
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [orgSize, setOrgSize] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1800 + 1 }, (_, i) => currentYear - i);

  const handleFile = (file: File, type: "logo" | "cover") => {
    const maxMB = type === "logo" ? 5 : 5;
    if (file.size > maxMB * 1024 * 1024) { toast.error(`Max ${maxMB}MB`); return; }
    if (type === "logo") { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
    else { setCoverFile(file); setCoverPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let { data: { user } } = await supabase.auth.getUser();
      
      // If no user session, try to get session
      if (!user) {
        const { data: { session } } = await supabase.auth.getSession();
        user = session?.user ?? null;
      }

      if (!user) { toast.error("Please complete email verification first"); setSubmitting(false); return; }

      // Ensure profile exists before creating org (FK constraint)
      const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
      if (!existingProfile) {
        // Profile not yet created by trigger — create it manually
        const { error: profileErr } = await supabase.from("profiles").insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || "",
          username: user.user_metadata?.username || `user-${user.id.slice(0, 8)}`,
          role: "institution_admin",
        } as any);
        if (profileErr && !profileErr.message.includes("duplicate")) {
          console.warn("[StepPageSetup] profile create error:", profileErr);
        }
        // Small delay to let DB settle
        await new Promise(r => setTimeout(r, 500));
      }

      const baseSlug = generateSlug(orgName);
      const slug = `${baseSlug}-${Date.now().toString(36)}`;

      // Upload logo
      let logoUrl = "";
      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const path = `${user.id}/logo-${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("org-logos").upload(path, logoFile, { upsert: true });
        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage.from("org-logos").getPublicUrl(path);
          logoUrl = publicUrl;
        }
      }

      // Upload cover
      let coverUrl = "";
      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const path = `${user.id}/cover-${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("cover-images").upload(path, coverFile, { upsert: true });
        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage.from("cover-images").getPublicUrl(path);
          coverUrl = publicUrl;
        }
      }

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          slug,
          name: orgName,
          type: orgType,
          description: description || null,
          tagline: tagline || null,
          website_url: website || null,
          country: "India",
          state: state || null,
          city: city || null,
          founded_year: foundedYear ? parseInt(foundedYear) : null,
          employee_count: orgSize || null,
          logo_url: logoUrl || null,
          cover_url: coverUrl || null,
          created_by: user.id,
        } as any)
        .select()
        .single();

      if (orgError) {
        console.warn("[StepPageSetup] org create error:", orgError);
        toast.error(orgError.message);
        setSubmitting(false);
        return;
      }

      // Add creator as owner
      await supabase.from("org_members").insert({
        org_id: org.id,
        user_id: user.id,
        role: "owner",
        title: repDesignation || repRole,
        is_verified: true,
        department: repDepartment || null,
        permissions: { all: true },
      } as any);

      // Update profile with institution_admin role
      await supabase.from("profiles").update({
        designation: repDesignation,
        department: repDepartment || null,
        institution_name: orgName,
      }).eq("id", user.id);

      onComplete(slug);
    } catch (err: any) {
      console.warn("[StepPageSetup] exception:", err);
      toast.error(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ ...cardStyle, maxHeight: "80vh", overflowY: "auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", textAlign: "center", marginBottom: 4 }}>
        Set up your page
      </h2>
      <p style={{ fontSize: 14, color: "#6B6B6B", textAlign: "center", marginBottom: 28 }}>
        You can change all of this later in Settings
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Logo upload */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button type="button" onClick={() => logoRef.current?.click()}
            style={{
              width: 120, height: 120, borderRadius: "50%", border: "2px dashed #D1D5DB",
              background: "#FAFAFA", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", cursor: "pointer",
              overflow: "hidden", flexShrink: 0,
            }}>
            {logoPreview ? (
              <img src={logoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <>
                <Camera style={{ width: 24, height: 24, color: "#9CA3AF", marginBottom: 4 }} />
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>Upload logo</span>
              </>
            )}
          </button>
          <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], "logo")} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>Logo</p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>PNG, JPG, or SVG · Max 5MB</p>
          </div>
        </div>

        {/* Cover upload */}
        <button type="button" onClick={() => coverRef.current?.click()}
          style={{
            width: "100%", height: 120, borderRadius: 12, border: "2px dashed #D1D5DB",
            background: coverPreview ? `url(${coverPreview}) center/cover` : "#FAFAFA",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
          {!coverPreview && (
            <>
              <ImageIcon style={{ width: 24, height: 24, color: "#9CA3AF", marginBottom: 4 }} />
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>Upload cover photo</span>
            </>
          )}
        </button>
        <input ref={coverRef} type="file" accept="image/png,image/jpeg" className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], "cover")} />

        {/* Tagline */}
        <div>
          <Input placeholder="What do you do in one line" value={tagline}
            onChange={e => setTagline(e.target.value.slice(0, 100))} style={inputStyle} />
          <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "right", marginTop: 2 }}>
            {tagline.length}/100
          </p>
        </div>

        {/* Description */}
        <div style={{ position: "relative" }}>
          <textarea value={description}
            onChange={e => setDescription(e.target.value.slice(0, 500))}
            placeholder="Tell people about your organisation"
            rows={4}
            style={{
              ...inputStyle, height: "auto", minHeight: 120, width: "100%",
              padding: "12px 14px", resize: "none", fontFamily: "inherit",
            }}
          />
          <span style={{ position: "absolute", bottom: 8, right: 12, fontSize: 10, color: "#9CA3AF" }}>
            {description.length}/500
          </span>
        </div>

        {/* Founded year */}
        <select value={foundedYear} onChange={e => setFoundedYear(e.target.value)}
          style={{ ...inputStyle, width: "100%", paddingLeft: 12, paddingRight: 12 }}>
          <option value="">Founded year</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {/* Org size pills */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 8 }}>Organisation size</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SIZE_OPTIONS.map(s => (
              <button type="button" key={s} onClick={() => setOrgSize(s)}
                style={{
                  padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                  border: orgSize === s ? "2px solid #E8580A" : "1.5px solid #E5E7EB",
                  background: orgSize === s ? "#FFF3EC" : "#FAFAFA",
                  color: orgSize === s ? "#E8580A" : "#6B6B6B",
                  cursor: "pointer",
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full mt-6" disabled={submitting}
        style={{ height: 52, background: "#E8580A", borderRadius: 8, fontSize: 15, fontWeight: 700 }}>
        {submitting ? "Creating page..." : "Create Page →"}
      </Button>
    </form>
  );
}
