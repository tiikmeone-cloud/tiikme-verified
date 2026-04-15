/**
 * Golden tick (Tiiked badge) — shows when a user/item is verified.
 * Sizes: 14 (explore), 16 (feed), 18 (profile), 20 (work items)
 */
const VerifiedBadge = ({ size = 16 }: { size?: number }) => (
  <span
    className="inline-flex items-center justify-center shrink-0"
    title="Verified"
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: "linear-gradient(135deg, #FFB800, #FF8C00)",
      boxShadow: "0 0 8px rgba(255,184,0,0.40)",
    }}
  >
    <svg
      width={size * 0.6}
      height={size * 0.6}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 6.5L4.5 9L10 3"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

export default VerifiedBadge;
