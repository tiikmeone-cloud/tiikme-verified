const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center" style={{ background: "var(--bg)" }}>
    <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
  </div>
);

export default PageLoader;
