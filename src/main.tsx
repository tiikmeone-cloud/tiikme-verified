import { createRoot } from "react-dom/client";
import { RootErrorBoundary } from "./components/ErrorBoundaries";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme immediately — default to light
const saved = localStorage.getItem("tiikme-theme");
if (saved === "dark") {
  document.documentElement.classList.add("dark");
  document.documentElement.setAttribute("data-theme", "dark");
} else if (saved === "system") {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (prefersDark) {
    document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.setAttribute("data-theme", "light");
  }
} else {
  document.documentElement.classList.remove("dark");
  document.documentElement.setAttribute("data-theme", "light");
}

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
