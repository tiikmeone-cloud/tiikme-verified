/**
 * TiikVerified badge — orange shield with checkmark.
 * Sizes: 14 (explore/cards), 16 (feed), 18 (profile header), 20 (work items)
 */
const VerifiedBadge = ({ size = 16 }: { size?: number }) => (
  <span
    className="inline-flex items-center justify-center shrink-0"
    title="TiikVerified"
    style={{ width: size, height: size }}
  >
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shield shape */}
      <path
        d="M10 1.5L3 4.5V10C3 14 6.5 17.5 10 18.5C13.5 17.5 17 14 17 10V4.5L10 1.5Z"
        fill="url(#shield-grad)"
        filter="url(#shadow)"
      />
      {/* Checkmark */}
      <path
        d="M7 10L9 12L13 8"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="shield-grad" x1="3" y1="1.5" x2="17" y2="18.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF6B2B" />
          <stop offset="1" stopColor="#E8733A" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="rgba(232,115,58,0.5)" />
        </filter>
      </defs>
    </svg>
  </span>
);

export default VerifiedBadge;
