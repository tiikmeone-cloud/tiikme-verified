import { MapPin, Briefcase, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const circles = [
  {
    icon: MapPin,
    title: "City Circles",
    body: "Connect with students and professionals in your city. Local opportunities, local conversations, real proximity.",
  },
  {
    icon: Briefcase,
    title: "Role Circles",
    body: "Whether you are a frontend engineer, a CMO, or a medical student — find others in your exact role and learn from their experience.",
  },
  {
    icon: Globe,
    title: "Sector Circles",
    body: "Join communities around industries you care about — tech, healthcare, marketing, finance, and more. Stay sharp, stay connected.",
  },
];

const CirclesSection = () => (
  <section className="bg-white px-4 sm:px-6 lg:px-8 py-20">
    <div className="max-w-5xl mx-auto">
      <h2
        className="text-center font-extrabold text-[32px] md:text-[36px] leading-[1.15] mb-4"
        style={{ color: "#04061A" }}
      >
        Find Your Circle
      </h2>
      <p
        className="text-center text-[16px] md:text-[18px] leading-[1.7] max-w-2xl mx-auto"
        style={{ color: "#6B7280" }}
      >
        Tiikme Circles are professional communities built around what matters to you —
        your city, your role, your industry. Have real conversations with people who
        are on the same path.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {circles.map((c) => (
          <div
            key={c.title}
            className="rounded-2xl p-6 text-left flex flex-col h-full"
            style={{ border: "1px solid #F3F4F6", backgroundColor: "#F9FAFB" }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "#FFF7ED" }}
            >
              <c.icon className="w-5 h-5" style={{ color: "#E8580A" }} strokeWidth={2} />
            </div>
            <h3 className="text-[20px] font-bold mb-2" style={{ color: "#04061A" }}>
              {c.title}
            </h3>
            <p className="text-[14px] md:text-[15px] leading-[1.7]" style={{ color: "#374151" }}>
              {c.body}
            </p>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-10">
        <Link to="/signup">
          <button
            className="h-[52px] px-8 rounded-xl font-bold text-[16px] text-white cursor-pointer transition-colors"
            style={{ backgroundColor: "#E8580A" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#C94A07")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#E8580A")}
          >
            Join a Circle
          </button>
        </Link>
      </div>
    </div>
  </section>
);

export default CirclesSection;
