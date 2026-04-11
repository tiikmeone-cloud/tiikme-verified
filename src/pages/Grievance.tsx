import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const issueTypes = ["Account Issue", "Content Violation", "Harassment", "Privacy Concern", "Verification Problem", "Other"];

const Grievance = () => {
  const [form, setForm] = useState({ name: "", email: "", type: "", description: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.type || !form.description) {
      toast.error("Please fill all fields");
      return;
    }
    setSubmitted(true);
    toast.success("Grievance submitted. We'll respond within 30 days.");
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] font-semibold mb-8" style={{ color: "var(--brand)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
        <h1 className="text-[32px] font-extrabold mb-2" style={{ color: "var(--text-1)", letterSpacing: "-0.02em" }}>Grievance Officer</h1>
        <p className="text-[14px] mb-8" style={{ color: "var(--text-3)" }}>As per the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</p>

        <div className="prose-sm space-y-6" style={{ color: "var(--text-2)" }}>
          <section className="t-card p-6">
            <h2 className="text-[18px] font-bold mb-3" style={{ color: "var(--text-1)" }}>Grievance Officer Details</h2>
            <div className="space-y-2 text-[14px]">
              <p><strong>Name:</strong> Tiikme Grievance Officer</p>
              <p><strong>Email:</strong> <a href="mailto:grievance@tiikme.in" style={{ color: "var(--brand)" }}>grievance@tiikme.in</a></p>
              <p><strong>Response Time:</strong> Within 24 hours of acknowledgment, resolution within 30 days</p>
              <p><strong>Working Hours:</strong> Monday to Friday, 10:00 AM – 6:00 PM IST</p>
            </div>
          </section>

          {!submitted ? (
            <section className="t-card p-6">
              <h2 className="text-[18px] font-bold mb-4" style={{ color: "var(--text-1)" }}>Submit a Grievance</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[12px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-3)" }}>Your Name *</label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
                </div>
                <div>
                  <label className="text-[12px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-3)" }}>Email Address *</label>
                  <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" />
                </div>
                <div>
                  <label className="text-[12px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-3)" }}>Issue Type *</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full h-11 rounded-xl px-3 text-[14px] outline-none"
                    style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }}>
                    <option value="">Select issue type</option>
                    {issueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-3)" }}>Description *</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={5} maxLength={2000} placeholder="Describe your grievance in detail..."
                    className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none"
                    style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
                  <p className="text-[10px] text-right mt-1" style={{ color: "var(--text-3)" }}>{form.description.length}/2000</p>
                </div>
                <Button onClick={handleSubmit} className="w-full">Submit Grievance</Button>
              </div>
            </section>
          ) : (
            <section className="t-card p-6 text-center">
              <p className="text-[18px] font-bold mb-2" style={{ color: "var(--text-1)" }}>✓ Grievance Submitted</p>
              <p className="text-[14px]" style={{ color: "var(--text-2)" }}>We will acknowledge your grievance within 24 hours and resolve it within 30 days. You will receive updates at {form.email}.</p>
            </section>
          )}
        </div>

        <div className="flex gap-4 mt-10 pt-6 text-[13px]" style={{ borderTop: "1px solid var(--border)", color: "var(--text-3)" }}>
          <Link to="/privacy" style={{ color: "var(--brand)" }}>Privacy</Link>
          <Link to="/terms" style={{ color: "var(--brand)" }}>Terms</Link>
          <Link to="/grievance" style={{ color: "var(--brand)" }}>Grievance Officer</Link>
        </div>
      </div>
    </div>
  );
};

export default Grievance;
