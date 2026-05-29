import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type ThemeMode = "dark" | "light" | "system";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "dark",
  setMode: () => {},
  isDark: true,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem("tiikme-theme") as ThemeMode) || "dark";
  });

  const getIsDark = (m: ThemeMode) => {
    if (m === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches;
    return m === "dark";
  };

  const [isDark, setIsDark] = useState(() => getIsDark(mode));

  useEffect(() => {
    const applyTheme = (m: ThemeMode) => {
      const dark = getIsDark(m);
      setIsDark(dark);
      document.documentElement.classList.toggle("dark", dark);
    };

    applyTheme(mode);

    if (mode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [mode]);

  const setMode = (m: ThemeMode) => {
    localStorage.setItem("tiikme-theme", m);
    setModeState(m);
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
