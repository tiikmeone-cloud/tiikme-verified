/**
 * Tiikme verified badge.
 * Orange shield shape so it reads as a trust marker rather than a generic reaction dot.
 */
const VerifiedBadge = ({ size = 16 }: { size?: number }) => {
  const shieldWidth = size;
  const shieldHeight = Math.round(size * 1.08);
  const checkSize = size * 0.56;

  return (
    <span
      className="inline-flex items-center justify-center shrink-0"
      title="Verified"
      style={{
        width: shieldWidth,
        height: shieldHeight,
        filter: "drop-shadow(0 0 8px rgba(232,115,58,0.28))",
      }}
    >
      <svg
        width={shieldWidth}
        height={shieldHeight}
        viewBox="0 0 24 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M12 1.5L20.5 5.2V11.8C20.5 17.4 17.2 22.5 12 24.5C6.8 22.5 3.5 17.4 3.5 11.8V5.2L12 1.5Z"
          fill="url(#tiikme-badge-gradient)"
          stroke="rgba(255,255,255,0.86)"
          strokeWidth="1"
        />
        <path
          d="M8 13.2L10.8 16L16.6 9.8"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="tiikme-badge-gradient" x1="4" y1="3" x2="20" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFB168" />
            <stop offset="0.48" stopColor="#FF7A2F" />
            <stop offset="1" stopColor="#E8733A" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
};

export default VerifiedBadge;
