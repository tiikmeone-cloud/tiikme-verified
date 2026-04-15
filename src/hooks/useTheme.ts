// Light mode only — no theme switching needed
export function useTheme() {
  return {
    theme: "light" as const,
    isDark: false,
    setTheme: () => {},
    toggleTheme: () => {},
  };
}
