import { GraduationCap, Briefcase, Stethoscope, Landmark, Wrench, BookOpen } from "lucide-react";

const roles = [
  {
    icon: GraduationCap,
    role: "The Student",
    copy: "You just finished your degree. Your skills are real but invisible. Tiikme makes them visible to the person hiring you.",
  },
  {
    icon: Briefcase,
    role: "The Professional",
    copy: "You\u2019ve been working for years and have no portable proof of any of it. Tiikme keeps your verified history with you when you move on.",
  },
  {
    icon: Stethoscope,
    role: "The Doctor",
    copy: "Your qualifications are serious. Your patients and your next employer deserve a way to confirm them without a bureaucratic marathon.",
  },
  {
    icon: Landmark,
    role: "The Government Employee",
    copy: "You served across transfers and postings. Your record exists in registers nobody reads. It deserves to be digital and verifiable.",
  },
  {
    icon: Wrench,
    role: "The Skilled Worker",
    copy: "You did an ITI course. You have real craft. You\u2019ve just never had a professional identity that shows that off. Now you do.",
  },
  {
    icon: BookOpen,
    role: "The Faculty",
    copy: "You shaped careers for decades. Your institution will confirm it. Your students will reference it. Your legacy deserves to be permanent.",
  },
];

const WhoIsForSection = () => (
  <section id="features" className="bg-white px-5 md:px-8 py-16 md:py-[100px]">
    <div className="max-w-[1200px] mx-auto">
      <p className="text-center text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#B8460C" }}>
        Tiikme is for
      </p>
      <h2 className="text-center font-extrabold leading-[1.15] mb-12 md:mb-16">
        <span className="block text-[28px] md:text-[48px]" style={{ color: "#04061A" }}>
          You. Actually you.
        </span>
        <span className="block text-[22px] md:text-[36px]" style={{ color: "#374151" }}>
          Not just the person in the corner office.
        </span>
      </h2>

      {/* Mobile: horizontal scroll. Desktop: 3-col grid */}
      <div className="flex md:hidden gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-5 px-5" style={{ scrollbarWidth: "none" }}>
        {roles.map((r) => (
          <RoleCard key={r.role} {...r} />
        ))}
      </div>
      <div className="hidden md:grid grid-cols-3 gap-6">
        {roles.map((r) => (
          <RoleCard key={r.role} {...r} />
        ))}
      </div>
    </div>
  </section>
);

const RoleCard = ({ icon: Icon, role, copy }: { icon: typeof GraduationCap; role: string; copy: string }) => (
  <div
    className="min-w-[280px] md:min-w-0 snap-start rounded-2xl p-6 md:p-8 flex flex-col"
    style={{ border: "1px solid #E5E7EB" }}
  >
    <Icon className="w-7 h-7 mb-4" style={{ color: "#FF5A1F" }} strokeWidth={1.5} />
    <p className="text-[15px] font-bold mb-2" style={{ color: "#B8460C" }}>
      {role}
    </p>
    <p className="text-[15px] md:text-[16px] leading-[1.7]" style={{ color: "#374151" }}>
      {copy}
    </p>
  </div>
);

export default WhoIsForSection;
