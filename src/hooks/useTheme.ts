import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type ThemeOption = "light" | "dark" | "system";

const resolveTheme = (t: ThemeOption): "light" | "dark" =>
  t === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    : t;

const applyClass = (resolved: "light" | "dark") => {
  if (resolved === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeOption>(() => {
    const stored = localStorage.getItem("tiikme-theme") as ThemeOption | null;
    return stored || "light";
  });

  const isDark = document.documentElement.classList.contains("dark");

  // Apply on mount + theme change
  useEffect(() => {
    applyClass(resolveTheme(theme));
  }, [theme]);

  // Listen for system changes when set to "system"
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyClass(resolveTheme("system"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback(async (newTheme: ThemeOption, userId?: string) => {
    setThemeState(newTheme);
    localStorage.setItem("tiikme-theme", newTheme);
    applyClass(resolveTheme(newTheme));

    // Persist to Supabase (fire-and-forget)
    if (userId) {
      supabase.from("profiles").update({ theme_preference: newTheme } as any).eq("id", userId).then(() => {});
    }
  }, []);

  const toggleTheme = useCallback((userId?: string) => {
    const next: ThemeOption = isDark ? "light" : "dark";
    setTheme(next, userId);
  }, [isDark, setTheme]);

  return { theme, isDark, setTheme, toggleTheme };
}
