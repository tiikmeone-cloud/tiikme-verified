import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="px-5 md:px-8" style={{ backgroundColor: "#FFF8F2" }}>
      <div className="max-w-[1200px] mx-auto text-center py-16 md:py-[100px]">
        {/* Eyebrow */}
        <p
          className="text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] mb-8 md:mb-10"
          style={{ color: "#B8460C" }}
        >
          India's first verified professional identity platform
        </p>

        {/* Headline */}
        <h1 className="font-extrabold leading-[1.05] mb-6">
          <span className="block text-[40px] md:text-[72px]" style={{ color: "#04061A" }}>
            Nobody Verified You.
          </span>
          <span className="block text-[40px] md:text-[72px]" style={{ color: "#E8580A" }}>
            We Will.
          </span>
        </h1>

        {/* Orange rule */}
        <div className="mx-auto mb-8" style={{ width: 80, height: 3, backgroundColor: "#E8580A", borderRadius: 2 }} />

        {/* Subheadline */}
        <p
          className="text-[16px] md:text-[20px] leading-[1.7] max-w-[640px] mx-auto mb-6"
          style={{ color: "#374151" }}
        >
          Your degree is real. Your work is real. Your skills are real.
          <br className="hidden md:block" />
          Now your profile will be too — backed by the college, company,
          <br className="hidden md:block" />
          or hospital that actually knows what you did.
        </p>

        {/* Supporting note */}
        <p className="text-[14px] mb-10 md:mb-12" style={{ color: "#6B7280" }}>
          We are building this for every working Indian. Join us from day one.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <Link to="/signup" className="w-full sm:w-auto">
            <button
              className="w-full sm:w-auto h-[52px] px-8 rounded-xl font-bold text-[16px] text-white cursor-pointer transition-colors"
              style={{ backgroundColor: "#B8460C" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#9C3A0A")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#B8460C")}
             >
              Get Tiiked — It's Free
            </button>
            <p className="text-[12px] mt-2 w-full text-center" style={{ color: "#6B7280" }}>
              No credit card required. Free forever for individuals.
            </p>
          </Link>
          <a href="#how-it-works" className="w-full sm:w-auto">
            <button
              className="w-full sm:w-auto h-[52px] px-8 rounded-xl font-bold text-[16px] cursor-pointer transition-colors border-2"
              style={{ borderColor: "#B8460C", color: "#B8460C", backgroundColor: "transparent" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FFF7ED")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              See How It Works ↓
            </button>
          </a>
        </div>

        {/* Honest note */}
        <p className="text-[13px]" style={{ color: "#6B7280" }}>
          Built by Veenavarse Private Limited
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
