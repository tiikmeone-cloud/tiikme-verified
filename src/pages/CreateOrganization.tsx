import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { ORG_TYPES, SUBTYPES, EMPLOYEE_SIZES, INDIAN_STATES, NAAC_GRADES, slugify } from "@/lib/orgConstants";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1799 }, (_, i) => currentYear - i);

export default function CreateOrganization() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [orgType, setOrgType] = useState("");
  const [subtype, setSubtype] = useState("");

  // Step 2
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [foundedYear, setFoundedYear] = useState<number | "">("");

  // Step 3
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [village, setVillage] = useState("");
  const [pincode, setPincode] = useState("");
  const [fullAddress, setFullAddress] = useState("");

  // Step 4
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  // Type-specific
  const [metaFields, setMetaFields] = useState<Record<string, string>>({});

  // Step 5
  const [roleTitle, setRoleTitle] = useState("");
  const [allowRequests, setAllowRequests] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);

  const canNext = () => {
    if (step === 1) return !!orgType;
    if (step === 2) return name.trim().length > 0 && description.trim().length > 0;
    if (step === 3) return state.length > 0 && pincode.length === 6;
    if (step === 4) return phone.length >= 10 && email.includes("@");
    if (step === 5) return roleTitle.trim().length > 0;
    return false;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    const baseSlug = name.trim().toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const { data: org, error: orgError } = await supabase.from("organizations" as any).insert({
      slug,
      name: name.trim(),
      type: orgType,
      subtype: subtype || null,
      tagline: tagline.trim() || null,
      description: description.trim() || null,
      founded_year: foundedYear || null,
      state: state || null,
      district: district || null,
      city: city || null,
      village: village || null,
      pincode: pincode || null,
      full_address: fullAddress || null,
      phone: phone || null,
      email: email || null,
      website_url: website || null,
      employee_count: employeeCount || null,
      allow_employee_requests: allowRequests,
      allow_messages: allowMessages,
      created_by: user.id,
    } as any).select().single();

    if (orgError) {
      console.error("Organization create error:", orgError);
      toast({ title: "Failed to create organization", description: orgError.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Add creator as owner
    const { error: memberError } = await supabase.from("org_members" as any).insert({
      org_id: (org as any).id,
      user_id: user.id,
      role: "owner",
      title: roleTitle.trim() || "Owner",
      is_verified: true,
    } as any);

    if (memberError) {
      console.error("Member insert error:", memberError);
    }

    // Insert type-specific metadata
    const metaEntries = Object.entries(metaFields).filter(([, v]) => v.trim());
    if (metaEntries.length > 0) {
      await supabase.from("org_metadata" as any).insert(
        metaEntries.map(([key, value]) => ({ org_id: (org as any).id, key, value })) as any
      );
    }

    toast({ title: "Organisation page created! ✓" });
    navigate(`/org/${slug}`);
    setSubmitting(false);
  };

  const setMeta = (key: string, value: string) => setMetaFields(prev => ({ ...prev, [key]: value }));

  const namePlaceholder = orgType === 'education' ? 'e.g. IIT Delhi' :
    orgType === 'hospital' ? 'e.g. Apollo Hospitals Hyderabad' :
    orgType === 'government' ? 'e.g. Ministry of Health' : 'e.g. Tata Consultancy Services';

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-7 h-7" style={{ color: "var(--brand)" }} />
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>Create Organization Page</h1>
        </div>

        {/* Progress */}
        <div className="mb-2 flex items-center justify-between text-sm" style={{ color: "var(--text-2)" }}>
          <span>Step {step} of 5</span>
          <span>{['Type','Details','Location','Contact','Admin'][step - 1]}</span>
        </div>
        <Progress value={step * 20} className="mb-8 h-2" />

        {/* Step 1: Type */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-1)" }}>What type of organization?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ORG_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setOrgType(t.id); setSubtype(""); }}
                  className="p-4 rounded-xl text-left transition-all border-2"
                  style={{
                    background: orgType === t.id ? "var(--brand-dim)" : "var(--surface)",
                    borderColor: orgType === t.id ? "var(--brand)" : "var(--border)",
                    color: "var(--text-1)",
                  }}
                >
                  <span className="text-2xl block mb-1">{t.icon}</span>
                  <span className="font-semibold text-sm block">{t.label}</span>
                  <span className="text-xs mt-1 block" style={{ color: "var(--text-3)" }}>{t.desc}</span>
                </button>
              ))}
            </div>
            {orgType && SUBTYPES[orgType] && (
              <div>
                <Label style={{ color: "var(--text-2)" }}>Subtype</Label>
                <select
                  value={subtype}
                  onChange={e => setSubtype(e.target.value)}
                  className="w-full mt-1 h-11 px-3 rounded-lg border text-sm"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-1)" }}
                >
                  <option value="">Select subtype (optional)</option>
                  {SUBTYPES[orgType].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-1)" }}>Basic Details</h2>
            <div>
              <Label style={{ color: "var(--text-2)" }}>Organization Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={namePlaceholder} maxLength={120} className="mt-1" />
            </div>
            <div>
              <Label style={{ color: "var(--text-2)" }}>Tagline</Label>
              <Input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="What you do in one line" maxLength={120} className="mt-1" />
            </div>
            <div>
              <Label style={{ color: "var(--text-2)" }}>Description *</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell people what your organization does..." maxLength={500} className="mt-1" rows={4} />
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{description.length}/500</p>
            </div>
            <div>
              <Label style={{ color: "var(--text-2)" }}>Founded Year</Label>
              <select
                value={foundedYear}
                onChange={e => setFoundedYear(e.target.value ? Number(e.target.value) : "")}
                className="w-full mt-1 h-11 px-3 rounded-lg border text-sm"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-1)" }}
              >
                <option value="">Select year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-1)" }}>Location</h2>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>This is your primary/headquarters location. You can add branches later.</p>
            <div>
              <Label style={{ color: "var(--text-2)" }}>State *</Label>
              <select
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-full mt-1 h-11 px-3 rounded-lg border text-sm"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-1)" }}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label style={{ color: "var(--text-2)" }}>District</Label>
              <Input value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Hyderabad" className="mt-1" />
            </div>
            <div>
              <Label style={{ color: "var(--text-2)" }}>City / Town</Label>
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Hyderabad" className="mt-1" />
            </div>
            <div>
              <Label style={{ color: "var(--text-2)" }}>Village, Colony, Area, Sector (optional)</Label>
              <Input value={village} onChange={e => setVillage(e.target.value)} placeholder="e.g. Madhapur, or Koilakuntla Village" className="mt-1" />
            </div>
            <div>
              <Label style={{ color: "var(--text-2)" }}>Pincode *</Label>
              <Input value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit pincode" className="mt-1" />
            </div>
            <div>
              <Label style={{ color: "var(--text-2)" }}>Full Address</Label>
              <Textarea value={fullAddress} onChange={e => setFullAddress(e.target.value)} placeholder="Door No., Street, Landmark" className="mt-1" rows={2} />
            </div>
          </div>
        )}

        {/* Step 4: Contact & Identity */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-1)" }}>Contact & Identity</h2>
            <div>
              <Label style={{ color: "var(--text-2)" }}>Phone *</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" className="mt-1" />
            </div>
            <div>
              <Label style={{ color: "var(--text-2)" }}>Official Email *</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="info@example.com" type="email" className="mt-1" />
            </div>
            <div>
              <Label style={{ color: "var(--text-2)" }}>Website URL</Label>
              <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" className="mt-1" />
            </div>
            <div>
              <Label style={{ color: "var(--text-2)" }}>Organization Size</Label>
              <select
                value={employeeCount}
                onChange={e => setEmployeeCount(e.target.value)}
                className="w-full mt-1 h-11 px-3 rounded-lg border text-sm"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-1)" }}
              >
                <option value="">Select size</option>
                {EMPLOYEE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Type-specific fields */}
            {orgType === 'company' && (
              <>
                <div>
                  <Label style={{ color: "var(--text-2)" }}>CIN (Corporate Identity Number)</Label>
                  <Input value={metaFields.cin || ""} onChange={e => setMeta("cin", e.target.value)} placeholder="Optional" className="mt-1" />
                </div>
                <div>
                  <Label style={{ color: "var(--text-2)" }}>GSTIN</Label>
                  <Input value={metaFields.gstin || ""} onChange={e => setMeta("gstin", e.target.value)} placeholder="Optional" className="mt-1" />
                </div>
                <div>
                  <Label style={{ color: "var(--text-2)" }}>Industry</Label>
                  <Input value={metaFields.industry || ""} onChange={e => setMeta("industry", e.target.value)} placeholder="e.g. Technology, Healthcare" className="mt-1" />
                </div>
              </>
            )}
            {orgType === 'education' && (
              <>
                <div>
                  <Label style={{ color: "var(--text-2)" }}>Affiliation (University/Board)</Label>
                  <Input value={metaFields.affiliation || ""} onChange={e => setMeta("affiliation", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label style={{ color: "var(--text-2)" }}>NAAC Grade</Label>
                  <select
                    value={metaFields.naac_grade || ""}
                    onChange={e => setMeta("naac_grade", e.target.value)}
                    className="w-full mt-1 h-11 px-3 rounded-lg border text-sm"
                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-1)" }}
                  >
                    <option value="">Select</option>
                    {NAAC_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <Label style={{ color: "var(--text-2)" }}>Courses Offered</Label>
                  <Input value={metaFields.courses || ""} onChange={e => setMeta("courses", e.target.value)} placeholder="Comma-separated: B.Tech, MBA, etc." className="mt-1" />
                </div>
              </>
            )}
            {orgType === 'hospital' && (
              <>
                <div>
                  <Label style={{ color: "var(--text-2)" }}>Specialties</Label>
                  <Input value={metaFields.specialties || ""} onChange={e => setMeta("specialties", e.target.value)} placeholder="Cardiology, Neurology, etc." className="mt-1" />
                </div>
                <div>
                  <Label style={{ color: "var(--text-2)" }}>Bed Count</Label>
                  <Input value={metaFields.bed_count || ""} onChange={e => setMeta("bed_count", e.target.value)} placeholder="e.g. 200" className="mt-1" />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={metaFields.nabh === "true"} onCheckedChange={v => setMeta("nabh", String(v))} />
                  <Label style={{ color: "var(--text-2)" }}>NABH Accredited</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={metaFields.emergency_24x7 === "true"} onCheckedChange={v => setMeta("emergency_24x7", String(v))} />
                  <Label style={{ color: "var(--text-2)" }}>Emergency 24/7</Label>
                </div>
              </>
            )}
            {orgType === 'government' && (
              <>
                <div>
                  <Label style={{ color: "var(--text-2)" }}>Ministry/Parent Department</Label>
                  <Input value={metaFields.parent_dept || ""} onChange={e => setMeta("parent_dept", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label style={{ color: "var(--text-2)" }}>Jurisdiction</Label>
                  <select
                    value={metaFields.jurisdiction || ""}
                    onChange={e => setMeta("jurisdiction", e.target.value)}
                    className="w-full mt-1 h-11 px-3 rounded-lg border text-sm"
                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-1)" }}
                  >
                    <option value="">Select</option>
                    {['National','State','District','Block','Village'].map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
              </>
            )}
            {orgType === 'ngo' && (
              <>
                <div>
                  <Label style={{ color: "var(--text-2)" }}>Registration Number</Label>
                  <Input value={metaFields.reg_number || ""} onChange={e => setMeta("reg_number", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label style={{ color: "var(--text-2)" }}>Focus Areas</Label>
                  <Input value={metaFields.focus_areas || ""} onChange={e => setMeta("focus_areas", e.target.value)} placeholder="Education, Health, Environment" className="mt-1" />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={metaFields.fcra === "true"} onCheckedChange={v => setMeta("fcra", String(v))} />
                  <Label style={{ color: "var(--text-2)" }}>FCRA Registration</Label>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 5: Admin Setup */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-1)" }}>Admin Setup</h2>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>You will be the Owner of this page.</p>
            <div>
              <Label style={{ color: "var(--text-2)" }}>Your role in this organization *</Label>
              <Input value={roleTitle} onChange={e => setRoleTitle(e.target.value)} placeholder='e.g. "Founder", "HR Manager", "College Admin"' className="mt-1" />
            </div>
            <div className="flex items-center justify-between py-3 px-4 rounded-lg" style={{ background: "var(--surface)" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>Allow verification requests</p>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>Members can request to be verified by this page</p>
              </div>
              <Switch checked={allowRequests} onCheckedChange={setAllowRequests} />
            </div>
            <div className="flex items-center justify-between py-3 px-4 rounded-lg" style={{ background: "var(--surface)" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>Allow direct messages</p>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>Anyone can message your organization page</p>
              </div>
              <Switch checked={allowMessages} onCheckedChange={setAllowMessages} />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
          ) : <div />}
          {step < 5 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="gap-1"
              style={{ background: "var(--brand)", color: "#fff" }}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canNext() || submitting}
              className="gap-1"
              style={{ background: "var(--brand)", color: "#fff" }}
            >
              {submitting ? "Creating..." : "Create Organization Page →"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
