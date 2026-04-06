import { Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

const AuthThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => document.documentElement.getAttribute("data-theme") === "dark");

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("tiikme-theme", next);
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-90"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--border-2)",
        boxShadow: "var(--shadow-sm)",
        color: "var(--text-2)",
      }}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
    </button>
  );
};

export default AuthThemeToggle;
