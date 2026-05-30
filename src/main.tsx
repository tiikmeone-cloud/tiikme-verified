import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { RootErrorBoundary } from "./components/ErrorBoundaries";
import { ThemeProvider } from "./contexts/ThemeContext";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <HelmetProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </HelmetProvider>
  </RootErrorBoundary>
);
