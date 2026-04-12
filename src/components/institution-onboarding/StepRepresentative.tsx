import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ROLE_OPTIONS, inputStyle, cardStyle } from "./constants";

interface Props {
  orgName: string;
  orgType: string;
  onNext: (data: { role: string; designation: string; department: string; staffId: string }) => void;
}

export default function StepRepresentative({ orgName, orgType, onNext }: Props) {
  const [role, setRole] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [staffId, setStaffId] = useState("");

  const roles = ROLE_OPTIONS[orgType] || ROLE_OPTIONS.company;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) { toast.info("Select your role"); return; }
    if (!designation.trim()) { toast.info("Enter your designation"); return; }
    onNext({ role, designation: designation.trim(), department: department.trim(), staffId: staffId.trim() });
  };

  return (
    <form onSubmit={handleSubmit} style={cardStyle}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1A1A1A", textAlign: "center", marginBottom: 4 }}>
        Who are you at {orgName}?
      </h2>
      <p style={{ fontSize: 14, color: "#6B6B6B", textAlign: "center", marginBottom: 28 }}>
        This becomes your verified role. Shown only in the Team tab.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Role pills */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 8 }}>Your role *</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {roles.map(r => (
              <button type="button" key={r} onClick={() => setRole(r)}
                style={{
                  padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                  border: role === r ? "2px solid #E8580A" : "1.5px solid #E5E7EB",
                  background: role === r ? "#E8580A" : "#FFFFFF",
                  color: role === r ? "#FFFFFF" : "#1A1A1A",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <Input placeholder={`Your designation *`} value={designation}
          onChange={e => setDesignation(e.target.value.slice(0, 100))}
          style={{ ...inputStyle, height: 48 }} required />

        <Input placeholder="Department (optional)" value={department}
          onChange={e => setDepartment(e.target.value.slice(0, 100))}
          style={{ ...inputStyle, height: 48 }} />

        <div>
          <Input placeholder="Staff / Employee ID (optional)" value={staffId}
            onChange={e => setStaffId(e.target.value.slice(0, 50))}
            style={{ ...inputStyle, height: 48 }} />
          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
            Helps team members verify you later. Not shown publicly.
          </p>
        </div>
      </div>

      <Button type="submit" className="w-full mt-6"
        style={{ height: 52, background: "#E8580A", borderRadius: 12, fontSize: 15, fontWeight: 700 }}>
        Next →
      </Button>
    </form>
  );
}
