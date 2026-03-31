import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme immediately to prevent flash
const saved = localStorage.getItem("tiikme-theme");
if (saved === "light") {
  document.documentElement.setAttribute("data-theme", "light");
}

createRoot(document.getElementById("root")!).render(<App />);
