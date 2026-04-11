import { Link } from "react-router-dom";

const CTASection = () => (
  <section className="px-5 md:px-8 py-16 md:py-[100px]" style={{ backgroundColor: "#E8580A" }}>
    <div className="max-w-[800px] mx-auto text-center">
      <h2 className="font-extrabold text-[28px] md:text-[48px] leading-[1.15] text-white mb-5">
        Stop explaining yourself to people
        <br className="hidden md:block" />
        {" "}who should already know.
      </h2>
      <p className="text-[16px] md:text-[20px] mb-10" style={{ color: "rgba(255,255,255,0.85)" }}>
        Build your verified professional identity today.
        <br />
        Free. Ten minutes. Yours for life.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
        <Link to="/signup" className="w-full sm:w-auto">
          <button
            className="w-full sm:w-auto h-[52px] px-8 rounded-xl font-bold text-[16px] cursor-pointer transition-colors"
            style={{ backgroundColor: "#FFFFFF", color: "#E8580A" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FFF7ED")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
          >
            Create My Profile — Free
          </button>
        </Link>
        <Link to="/join-as-institution" className="w-full sm:w-auto">
          <button
            className="w-full sm:w-auto h-[52px] px-8 rounded-xl font-bold text-[16px] cursor-pointer transition-colors border-2"
            style={{ borderColor: "#FFFFFF", color: "#FFFFFF", backgroundColor: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            For Institutions →
          </button>
        </Link>
      </div>

      <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.6)" }}>
        No credit card. No fake profiles. No nonsense.
        <br />
        A Veenavarse Private Limited product.
      </p>
    </div>
  </section>
);

export default CTASection;
