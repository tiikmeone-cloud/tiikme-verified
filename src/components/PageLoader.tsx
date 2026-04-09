const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
    <div className="flex flex-col items-center gap-3">
      <span
        className="text-[22px] font-bold animate-pulse"
        style={{ fontFamily: "'Press Start 2P', cursive", color: "var(--brand)", letterSpacing: "-1px" }}
      >
        tiikme <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[12px]" style={{ background: "var(--brand)" }}>✓</span>
      </span>
    </div>
  </div>
);

export default PageLoader;
