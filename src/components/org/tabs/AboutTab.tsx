import { MapPin, Globe, Calendar, Users, Mail, Phone, Building2 } from "lucide-react";

interface AboutTabProps {
  org: any;
  metadata: Record<string, string>;
}

export default function AboutTab({ org, metadata }: AboutTabProps) {
  const locationParts = [org.village, org.city, org.district, org.state].filter(Boolean);
  const socialLinks = typeof org.social_links === "object" && org.social_links ? org.social_links : {};

  return (
    <div className="space-y-6 max-w-[680px]">
      {/* Overview */}
      {org.description && (
        <Section title="Overview">
          <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: "#1A1A1A" }}>{org.description}</p>
        </Section>
      )}

      {/* Details grid */}
      <Section title="Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {org.founded_year && <DetailItem icon={Calendar} label="Founded" value={String(org.founded_year)} />}
          {org.employee_count && <DetailItem icon={Users} label="Size" value={org.employee_count} />}
          {org.type && <DetailItem icon={Building2} label="Industry" value={org.type.charAt(0).toUpperCase() + org.type.slice(1)} />}
          {org.website_url && <DetailItem icon={Globe} label="Website" value={org.website_url.replace(/https?:\/\//, "")} link={org.website_url.startsWith("http") ? org.website_url : `https://${org.website_url}`} />}
          {org.email && <DetailItem icon={Mail} label="Email" value={org.email} />}
          {org.phone && <DetailItem icon={Phone} label="Phone" value={org.phone} />}
        </div>
      </Section>

      {/* Social links */}
      {Object.keys(socialLinks).length > 0 && (
        <Section title="Social Links">
          <div className="flex gap-3">
            {Object.entries(socialLinks).map(([key, url]) => (
              <a key={key} href={String(url)} target="_blank" rel="noopener noreferrer"
                className="text-[13px] font-semibold px-3 py-1.5 rounded-lg hover:underline"
                style={{ background: "rgba(232,88,10,0.06)", color: "#E8580A" }}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </a>
            ))}
          </div>
        </Section>
      )}

      {/* Location */}
      {(locationParts.length > 0 || org.full_address) && (
        <Section title="Location">
          {org.full_address && <p className="text-[14px] mb-1" style={{ color: "#1A1A1A" }}>{org.full_address}</p>}
          {locationParts.length > 0 && <p className="text-[13px]" style={{ color: "#6B6B6B" }}>{locationParts.join(", ")}</p>}
          {org.pincode && <p className="text-[13px]" style={{ color: "#6B6B6B" }}>PIN: {org.pincode}</p>}
        </Section>
      )}

      {/* Custom metadata */}
      {Object.keys(metadata).length > 0 && (
        <Section title="Additional Details">
          <div className="space-y-2">
            {Object.entries(metadata).map(([k, v]) => (
              <div key={k} className="flex justify-between text-[13px] py-1" style={{ borderBottom: "1px solid #F0E8E0" }}>
                <span className="capitalize" style={{ color: "#6B6B6B" }}>{k.replace(/_/g, " ")}</span>
                <span className="font-medium" style={{ color: "#1A1A1A" }}>{v}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
      <h3 className="text-[16px] font-bold mb-3" style={{ color: "#1A1A1A" }}>{title}</h3>
      {children}
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, link }: { icon: any; label: string; value: string; link?: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <Icon className="w-4 h-4 shrink-0" style={{ color: "#9CA3AF" }} />
      <div>
        <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{label}</p>
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium hover:underline" style={{ color: "#E8580A" }}>{value}</a>
        ) : (
          <p className="text-[13px] font-medium" style={{ color: "#1A1A1A" }}>{value}</p>
        )}
      </div>
    </div>
  );
}
