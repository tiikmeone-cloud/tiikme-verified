import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Dev-only overlay (Cmd/Ctrl+Shift+D) showing live React Query cache stats
 * — total queries, fresh vs stale, fetching count. Mounted from App.tsx
 * but only renders when import.meta.env.DEV is true.
 */
export default function CachePerfOverlay() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, fresh: 0, stale: 0, fetching: 0 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setOpen((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const tick = () => {
      const cache = qc.getQueryCache();
      const all = cache.getAll();
      let fresh = 0, stale = 0, fetching = 0;
      for (const q of all) {
        if (q.state.fetchStatus === "fetching") fetching++;
        if (q.isStale()) stale++; else fresh++;
      }
      setStats({ total: all.length, fresh, stale, fetching });
    };
    tick();
    const id = window.setInterval(tick, 750);
    const unsub = qc.getQueryCache().subscribe(tick);
    return () => { window.clearInterval(id); unsub(); };
  }, [open, qc]);

  if (!import.meta.env.DEV || !open) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        zIndex: 9999,
        padding: "10px 14px",
        background: "rgba(15,23,42,0.92)",
        color: "#fff",
        borderRadius: 10,
        fontFamily: "ui-monospace, monospace",
        fontSize: 11,
        lineHeight: 1.6,
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        minWidth: 180,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4, color: "#FB923C" }}>cache · ⌘⇧D</div>
      <div>queries: <strong>{stats.total}</strong></div>
      <div>fresh:   <strong style={{ color: "#10B981" }}>{stats.fresh}</strong></div>
      <div>stale:   <strong style={{ color: "#F59E0B" }}>{stats.stale}</strong></div>
      <div>fetching:<strong style={{ color: "#3B82F6" }}>{stats.fetching}</strong></div>
    </div>
  );
}
