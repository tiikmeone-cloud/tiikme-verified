import { Sun, Moon } from "lucide-react";
import { useState } from "react";

const AuthThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    if (next === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
    localStorage.setItem("tiikme-theme", next);
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer active:scale-90"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--glass-border-subtle)",
        boxShadow: "0 4px 12px var(--glass-shadow)",
        color: "var(--color-text-secondary)",
        transition: "all 0.2s ease",
      }}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
    </button>
  );
};

export default AuthThemeToggle;
