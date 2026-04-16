/** Thin orange progress bar shown during background refetch (not initial load). */
const RefetchBar = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 40, height: 2,
      background: "linear-gradient(90deg, #E8733A 0%, #FF6B9D 100%)",
      animation: "refetchSlide 1.2s ease-in-out infinite",
    }} />
  );
};

export default RefetchBar;
