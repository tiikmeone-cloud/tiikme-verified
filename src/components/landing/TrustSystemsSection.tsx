import { ShieldCheck, BadgeCheck, Zap, Award, Briefcase, Brain, Circle } from "lucide-react";

const systems = [
  {
    icon: ShieldCheck,
    name: "Trust Engine",
    tagline: "Your identity scored across 5 verified dimensions",
    accent: "#FF5A1F",
    bg: "#FFF7ED",
  },
  {
    icon: BadgeCheck,
    name: "Verified Identity",
    tagline: "Backed by the college, company, or hospital that knows you",
    accent: "#16A34A",
    bg: "#F0FDF4",
  },
  {
    icon: Zap,
    name: "Activity Score",
    tagline: "Every post, connection, and contribution earns your rank",
    accent: "#D97706",
    bg: "#FFFBEB",
  },
  {
    icon: Award,
    name: "Trust Badges",
    tagline: "Visible proof of domain ownership, credentials, and platforms",
    accent: "#7C3AED",
    bg: "#F5F3FF",
  },
  {
    icon: Circle,
    name: "Open to Work",
    tagline: "Signal availability privately — only verified recruiters see you",
    accent: "#22C55E",
    bg: "#F0FDF4",
  },
  {
    icon: Briefcase,
    name: "Hiring Pipeline",
    tagline: "Schedule interviews, receive offers, track every application",
    accent: "#E8733A",
    bg: "rgba(232,115,58,0.08)",
  },
  {
    icon: Brain,
    name: "Brain",
    tagline: "Your personal knowledge workspace, tied to your verified profile",
    accent: "#DB2777",
    bg: "#FDF2F8",
  },
];

const TrustSystemsSection = () => (
  <section className="px-5 md:px-8 py-16 md:py-[100px]" style={{ backgroundColor: "#F9FAFB" }}>
    <div className="max-w-[1200px] mx-auto">
      <p
        className="text-center text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] mb-4"
        style={{ color: "#B8460C" }}
      >
        The platform
      </p>
      <h2 className="text-center font-extrabold leading-[1.15] mb-4">
        <span className="block text-[28px] md:text-[48px]" style={{ color: "#04061A" }}>
          One platform. Eight systems.
        </span>
        <span className="block text-[22px] md:text-[36px]" style={{ color: "#374151" }}>
          All working together.
        </span>
      </h2>
      <p
        className="text-center text-[16px] md:text-[18px] leading-[1.7] max-w-[640px] mx-auto mb-12 md:mb-16"
        style={{ color: "#6B7280" }}
      >
        LinkedIn has connections. Instagram has followers. Tiikme has{" "}
        <strong style={{ color: "#04061A" }}>verified systems</strong> — each one adding
        a layer of proof to who you actually are.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {systems.map((s) => (
          <div
            key={s.name}
            className="rounded-2xl p-5 md:p-6 flex flex-col gap-3"
            style={{ backgroundColor: s.bg, border: `1px solid ${s.accent}22` }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${s.accent}18` }}
            >
              <s.icon style={{ width: 20, height: 20, color: s.accent }} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[14px] md:text-[15px] font-bold mb-1" style={{ color: "#04061A" }}>
                {s.name}
              </p>
              <p className="text-[13px] md:text-[14px] leading-[1.6]" style={{ color: "#374151" }}>
                {s.tagline}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustSystemsSection;
