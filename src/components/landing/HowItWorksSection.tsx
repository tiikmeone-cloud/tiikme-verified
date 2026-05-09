import { ArrowRight } from "lucide-react";

const steps = [
  {
    num: "01",
    title: "Build your real profile.",
    body: "Add every job, every degree, every project, every achievement. Everything you have genuinely done. Keep it honest.",
  },
  {
    num: "02",
    title: "Someone who was there confirms it.",
    body: "Your HOD, your HR manager, your placement officer, your senior doctor \u2014 they get a request. They click Verify. Your profile now says something no resume ever could.",
  },
  {
    num: "03",
    title: "Own your identity forever.",
    body: "Wherever you go next \u2014 new job, new city, new opportunity \u2014 your verified professional identity travels with you. No paperwork. No phone calls. No proving yourself twice.",
  },
];

const HowItWorksSection = () => (
  <section id="how-it-works" className="px-5 md:px-8 py-16 md:py-[100px]" style={{ backgroundColor: "#FEF3E8" }}>
    <div className="max-w-[1200px] mx-auto">
      <h2
        className="text-center font-extrabold text-[28px] md:text-[48px] mb-12 md:mb-16"
        style={{ color: "#04061A" }}
      >
        Three steps. That's it.
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 relative">
        {steps.map((s, i) => (
          <div key={s.num} className="flex flex-col items-start relative">
            <span className="text-[48px] md:text-[56px] font-extrabold leading-none mb-4" style={{ color: "#FF5A1F" }}>
              {s.num}
            </span>
            <h3 className="text-[18px] md:text-[20px] font-bold mb-3" style={{ color: "#04061A" }}>
              {s.title}
            </h3>
            <p className="text-[15px] md:text-[16px] leading-[1.7]" style={{ color: "#374151" }}>
              {s.body}
            </p>
            {i < steps.length - 1 && (
              <div className="hidden md:flex absolute right-[-20px] top-[36px]">
                <ArrowRight className="w-6 h-6" style={{ color: "#D1D5DB" }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
