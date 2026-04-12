import { Component, type ErrorInfo, type ReactNode } from "react";

/* ─── 1. ROOT ErrorBoundary ─── */

interface RootProps { children: ReactNode }
interface EBState { hasError: boolean }

export class RootErrorBoundary extends Component<RootProps, EBState> {
  state: EBState = { hasError: false };

  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[RootErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", fontFamily: "system-ui, sans-serif", color: "#333", padding: "24px", textAlign: "center" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Something went wrong.</h1>
          <p style={{ fontSize: "14px", color: "#666" }}>Please reload the page.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ padding: "10px 28px", fontSize: "14px", fontWeight: 600, borderRadius: "10px", border: "none", cursor: "pointer", background: "#4F46E5", color: "#fff" }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── 2. LAYOUT ErrorBoundary ─── */

export class LayoutErrorBoundary extends Component<RootProps, EBState> {
  state: EBState = { hasError: false };

  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[LayoutErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "24px" }}>
          <div style={{ maxWidth: "400px", width: "100%", padding: "32px", borderRadius: "16px", background: "var(--surface, #fff)", border: "1px solid var(--border, #e5e7eb)", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-1, #111)", marginBottom: "8px" }}>Layout Error</h2>
            <p style={{ fontSize: "13px", color: "var(--text-2, #666)", marginBottom: "20px" }}>Something went wrong loading this section.</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              style={{ padding: "8px 24px", fontSize: "13px", fontWeight: 600, borderRadius: "8px", border: "none", cursor: "pointer", background: "var(--brand, #4F46E5)", color: "#fff" }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── 3. PAGE ErrorBoundary ─── */

export class PageErrorBoundary extends Component<RootProps, EBState> {
  state: EBState = { hasError: false };

  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[PageErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-2, #555)", marginBottom: "12px" }}>
            This section couldn't load. Try refreshing.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            style={{ padding: "8px 20px", fontSize: "13px", fontWeight: 600, borderRadius: "8px", border: "1px solid var(--border, #ddd)", cursor: "pointer", background: "var(--surface, #fff)", color: "var(--text-1, #333)" }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
