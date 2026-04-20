import { MapPin, Briefcase, Building2 } from "lucide-react";

const circles = [
  {
    icon: MapPin,
    type: "City",
    name: "Bengaluru Professionals",
    members: "12.4k members",
    body: "Meetups, hiring threads, and local conversations from people working across the city.",
  },
  {
    icon: Briefcase,
    type: "Role",
    name: "Product Managers India",
    members: "8.1k members",
    body: "Frameworks, interview loops, salary signals — shared by PMs who actually do the work.",
  },
  {
    icon: Building2,
    type: "Sector",
    name: "Healthcare in India",
    members: "5.7k members",
    body: "Clinicians, hospital admins, and medtech founders trading what is and isn't working on the ground.",
  },
];

const CirclesSection = () => (
  <section className="bg-white px-5 md:px-8 py-16 md:py-[100px]">
    <div className="max-w-[1200px] mx-auto">
      <p
        className="text-center text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] mb-4"
        style={{ color: "#E8580A" }}
      >
        Circles
      </p>
      <h2
        className="text-center font-extrabold text-[28px] md:text-[48px] leading-[1.15] mb-4"
        style={{ color: "#04061A" }}
      >
        Your Professional Circles
      </h2>
      <p
        className="text-center text-[15px] md:text-[18px] leading-[1.7] max-w-[640px] mx-auto mb-12 md:mb-16"
        style={{ color: "#374151" }}
      >
        Join communities of students, professionals, and creators in your field.
        Discuss, share, and grow with people who get it.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {circles.map((c) => (
          <div
            key={c.name}
            className="rounded-2xl p-6 md:p-7 flex flex-col h-full"
            style={{ border: "1px solid #E5E7EB", backgroundColor: "#FFFFFF" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#FFF7ED" }}
              >
                <c.icon className="w-5 h-5" style={{ color: "#E8580A" }} strokeWidth={2} />
              </div>
              <span
                className="text-[11px] font-bold uppercase tracking-[0.15em]"
                style={{ color: "#E8580A" }}
              >
                {c.type}
              </span>
            </div>
            <h3 className="text-[18px] md:text-[20px] font-bold mb-1" style={{ color: "#04061A" }}>
              {c.name}
            </h3>
            <p className="text-[13px] mb-3" style={{ color: "#6B7280" }}>{c.members}</p>
            <p className="text-[14px] md:text-[15px] leading-[1.7]" style={{ color: "#374151" }}>
              {c.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default CirclesSection;
