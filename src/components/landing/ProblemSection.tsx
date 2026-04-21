import { FileQuestion, Unlink, UserX } from "lucide-react";

const cards = [
  {
    icon: FileQuestion,
    title: "Anyone can write anything on a resume.",
    body: "You know this. Recruiters know this. Everyone pretends they don't. Your honest credentials look identical to fabricated ones. That is wrong.",
  },
  {
    icon: Unlink,
    title: "Your degree collects dust.",
    body: "You spent years earning it. Verifying it means calling an office that is never open or paying \u20B9800 to a company you\u2019ve never heard of. Every single time.",
  },
  {
    icon: UserX,
    title: "Your skills exist nowhere official.",
    body: "You built projects. You got certified. You mentored people. None of it lives anywhere that matters when you actually need it to.",
  },
];

const ProblemSection = () => (
  <section className="bg-white px-5 md:px-8 py-16 md:py-[100px]">
    <div className="max-w-[1200px] mx-auto">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="font-extrabold leading-[1.15]">
          <span className="block text-[28px] md:text-[48px]" style={{ color: "#04061A" }}>
            You worked for it.
          </span>
          <span className="block text-[28px] md:text-[48px]" style={{ color: "#04061A" }}>
            You earned it.
          </span>
          <span className="block text-[24px] md:text-[40px] mt-1" style={{ color: "#B8460C" }}>
            Can you actually prove it?
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mb-12 md:mb-16">
        {cards.map((c) => (
          <div
            key={c.title}
            className="rounded-2xl p-6 md:p-8"
            style={{ border: "1px solid #E5E7EB", backgroundColor: "#FFFFFF" }}
          >
            <c.icon className="w-8 h-8 mb-5" style={{ color: "#FA903E" }} strokeWidth={1.5} />
            <h3 className="text-[18px] md:text-[20px] font-bold mb-3" style={{ color: "#04061A" }}>
              {c.title}
            </h3>
            <p className="text-[15px] md:text-[16px] leading-[1.7]" style={{ color: "#374151" }}>
              {c.body}
            </p>
          </div>
        ))}
      </div>

      <p className="text-center text-[18px] md:text-[22px] font-bold" style={{ color: "#B8460C" }}>
        This is the problem. Tiikme is the answer.
      </p>
    </div>
  </section>
);

export default ProblemSection;
