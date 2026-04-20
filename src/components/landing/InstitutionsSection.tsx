import { Link } from "react-router-dom";

const cols = [
  {
    title: "You Control Who Verifies What.",
    body: "Set routing rules so marketing verifications go to the Marketing Head, CSE department verifications go to the HOD. You decide. Every request reaches the right person automatically.",
  },
  {
    title: "Your Brand Travels With Every Verified Profile.",
    body: "When your organisation verifies someone, that verification shows on their profile everywhere. Your name, your logo, your stamp of approval — permanently visible.",
  },
  {
    title: "Free to Start. Built for Scale.",
    body: "Create your organisation page for free. No upfront cost, no contracts. Start verifying your people from day one and see the value before you commit to anything.",
  },
];

const InstitutionsSection = () => (
  <section className="px-5 md:px-8 py-16 md:py-[100px]" style={{ backgroundColor: "#04061A" }}>
    <div className="max-w-[1200px] mx-auto text-center">
      <h2 className="font-extrabold text-[28px] md:text-[48px] leading-[1.15] text-white mb-4">
        If you run an organisation —
        <br />
        you need to read this.
      </h2>
      <p className="text-[16px] md:text-[20px] italic max-w-[700px] mx-auto mb-12 md:mb-16" style={{ color: "rgba(255,255,255,0.75)" }}>
        You are currently paying money to verify credentials
        that your own organisation issued.
        That ends with Tiikme.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-14 text-left">
        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="text-[18px] md:text-[20px] font-bold mb-3" style={{ color: "#FFB088" }}>
              {c.title}
            </h3>
            <p className="text-[15px] md:text-[16px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.8)" }}>
              {c.body}
            </p>
          </div>
        ))}
      </div>

      <Link to="/join-as-institution">
        <button
          className="h-[52px] px-8 rounded-xl font-bold text-[16px] text-white cursor-pointer transition-colors mb-6"
          style={{ backgroundColor: "#B8460C" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#9C3A0A")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#B8460C")}
        >
          Create Your Organisation Page — Free
        </button>
      </Link>
      <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
        We are onboarding colleges, hospitals, and companies right now.
        <br />
        Be among the first.
      </p>
    </div>
  </section>
);

export default InstitutionsSection;
