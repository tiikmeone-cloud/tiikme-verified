import { Shield, Layers, Users, Globe, Target, Lock } from "lucide-react";

const features = [
  { icon: Shield, title: "4-Level Verification", desc: "Phone, document, institution, and faculty Tiik Approval.", color: "#F59E0B" },
  { icon: Layers, title: "Project-First Identity", desc: "Your work speaks before your resume does.", color: "#3D5AF1" },
  { icon: Users, title: "Every Working Indian", desc: "Students to plumbers to doctors. Everyone belongs.", color: "#10B981" },
  { icon: Globe, title: "Regional Languages", desc: "Telugu, Tamil, Hindi, Kannada, Marathi — and growing.", color: "#E8580A" },
  { icon: Target, title: "Smart Opportunities", desc: "Matched to your real skills, not keyword spam.", color: "#6B21A8" },
  { icon: Lock, title: "Encrypted Pings", desc: "Private professional messaging. PDFs and work shares.", color: "#0E7490" },
];

const FeaturesSection = () => (
  <section id="features" className="px-4 py-24 max-w-6xl mx-auto">
    <h2 className="text-center font-extrabold text-[32px] text-[#EEF0FF] mb-4 tracking-tight">Everything you need</h2>
    <p className="text-center text-[16px] mb-14" style={{ color: "rgba(238,240,255,0.5)" }}>A professional identity platform built for India.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {features.map(f => (
        <div key={f.title} className="t-card t-card-hover p-6 group" style={{ background: "rgba(8,11,42,0.6)" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${f.color}20` }}>
            <f.icon className="w-5 h-5" style={{ color: f.color }} />
          </div>
          <h3 className="text-[16px] font-bold text-[#EEF0FF] mb-1.5">{f.title}</h3>
          <p className="text-[13px] leading-relaxed" style={{ color: "rgba(238,240,255,0.55)" }}>{f.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

export default FeaturesSection;
