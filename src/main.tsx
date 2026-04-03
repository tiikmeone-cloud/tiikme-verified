import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme immediately — default to light
const saved = localStorage.getItem("tiikme-theme");
if (saved === "dark") {
  document.documentElement.setAttribute("data-theme", "dark");
} else if (saved === "system") {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
} else {
  document.documentElement.setAttribute("data-theme", "light");
}

createRoot(document.getElementById("root")!).render(<App />);
