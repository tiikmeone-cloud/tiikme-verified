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
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", textAlign: "center", marginBottom: 4 }}>
        Who are you at {orgName}?
      </h2>
      <p style={{ fontSize: 14, color: "#6B6B6B", textAlign: "center", marginBottom: 28 }}>
        This becomes your verified role on the page
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <select value={role} onChange={e => setRole(e.target.value)}
          style={{ ...inputStyle, width: "100%", paddingLeft: 12, paddingRight: 12 }} required>
          <option value="">Select your role *</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <Input placeholder={`Your designation at ${orgName} *`} value={designation}
          onChange={e => setDesignation(e.target.value.slice(0, 100))} style={inputStyle} required />

        <Input placeholder="Your department (optional)" value={department}
          onChange={e => setDepartment(e.target.value.slice(0, 100))} style={inputStyle} />

        <div>
          <Input placeholder="Employee / Staff ID (optional)" value={staffId}
            onChange={e => setStaffId(e.target.value.slice(0, 50))} style={inputStyle} />
          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
            Adding your ID speeds up verification by team members
          </p>
        </div>
      </div>

      <Button type="submit" className="w-full mt-6"
        style={{ height: 52, background: "#E8580A", borderRadius: 8, fontSize: 15, fontWeight: 700 }}>
        Continue →
      </Button>
    </form>
  );
}
