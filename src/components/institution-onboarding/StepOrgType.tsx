import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ORG_TYPES, INDIAN_STATES, inputStyle, cardStyle } from "./constants";

interface Props {
  onNext: (data: { orgType: string; orgName: string; website: string; city: string; state: string }) => void;
}

export default function StepOrgType({ onNext }: Props) {
  const [orgType, setOrgType] = useState("");
  const [orgName, setOrgName] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const placeholder = orgType === "education" ? "e.g. IIT Hyderabad"
    : orgType === "hospital" ? "e.g. Apollo Hospitals Hyderabad"
    : orgType === "company" ? "e.g. Tata Consultancy Services"
    : "Organisation name";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgType) { toast.info("Select an organisation type"); return; }
    if (!orgName.trim()) { toast.info("Enter the organisation name"); return; }
    if (!city.trim() || !state) { toast.info("City and state are required"); return; }
    onNext({ orgType, orgName: orgName.trim(), website: website.trim(), city: city.trim(), state });
  };

  return (
    <form onSubmit={handleSubmit} style={cardStyle}>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", textAlign: "center", marginBottom: 28 }}>
        Tell us about your organisation
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {ORG_TYPES.map(t => {
          const sel = orgType === t.id;
          return (
            <button type="button" key={t.id} onClick={() => setOrgType(t.id)}
              style={{
                padding: "14px 16px", borderRadius: 12, textAlign: "left", cursor: "pointer",
                background: sel ? "#FFF3EC" : "#FAFAFA",
                border: sel ? "2px solid #E8580A" : "1.5px solid #E5E7EB",
                position: "relative", minHeight: 80,
              }}>
              {sel && (
                <div style={{
                  position: "absolute", top: 8, right: 8, width: 20, height: 20,
                  borderRadius: "50%", background: "#E8580A", display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Check style={{ width: 12, height: 12, color: "#fff" }} />
                </div>
              )}
              <span style={{ fontSize: 24, display: "block", marginBottom: 4 }}>{t.emoji}</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>{t.label}</p>
              <p style={{ fontSize: 11, color: "#6B6B6B", marginTop: 2 }}>{t.desc}</p>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Input placeholder={placeholder + " *"} value={orgName}
          onChange={e => setOrgName(e.target.value.slice(0, 100))} style={inputStyle} required />
        <Input placeholder="Organisation website (optional)" value={website}
          onChange={e => setWebsite(e.target.value)} style={inputStyle} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Input placeholder="City *" value={city}
            onChange={e => setCity(e.target.value)} style={inputStyle} required />
          <select value={state} onChange={e => setState(e.target.value)}
            style={{ ...inputStyle, width: "100%", paddingLeft: 12, paddingRight: 12 }} required>
            <option value="">State *</option>
            {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <Button type="submit" className="w-full mt-6"
        style={{ height: 52, background: "#E8580A", borderRadius: 8, fontSize: 15, fontWeight: 700 }}>
        Continue →
      </Button>
    </form>
  );
}
