import { useState, useRef } from "react";
import { Key, Download, Upload, X, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportKeypair, importKeypair } from "@/lib/messageEncryption";

interface Props {
  userId: string;
  onClose: () => void;
  onImported?: () => void;
}

export default function EncryptionKeyManager({ userId, onClose, onImported }: Props) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setBusy(true);
    const json = await exportKeypair(userId);
    setBusy(false);
    if (!json) {
      toast.error("No local key found yet. Send a message first to generate one.");
      return;
    }
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tiikme-pings-key-${userId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Key exported. Store it securely — anyone with this file can read your encrypted messages.");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const text = await file.text();
    const ok = await importKeypair(userId, text);
    setBusy(false);
    e.target.value = "";
    if (!ok) {
      toast.error("Invalid key file.");
      return;
    }
    toast.success("Key imported. Reloading messages…");
    onImported?.();
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="rounded-2xl p-6 max-w-[420px] w-full" style={{ background: "var(--surface)", boxShadow: "0 12px 48px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5" style={{ color: "var(--brand)" }} />
            <h3 className="text-[16px] font-extrabold" style={{ color: "var(--text-1)" }}>Encryption Keys</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 cursor-pointer" style={{ color: "var(--text-3)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "var(--surface-2)" }}>
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#10B981" }} />
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-2)" }}>
              Your messages are end-to-end encrypted. Tiikme cannot read them.
              Your secret key lives only on this device.
            </p>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#F59E0B" }} />
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-2)" }}>
              Use export/import to read your encrypted history on a new device.
              The exported file is unencrypted — store it like a password.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button type="button" onClick={handleExport} disabled={busy} className="w-full justify-center gap-2" style={{ height: 44, borderRadius: 12 }}>
            <Download className="w-4 h-4" /> Export key (download .json)
          </Button>
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={busy} className="w-full justify-center gap-2" style={{ height: 44, borderRadius: 12 }}>
            <Upload className="w-4 h-4" /> Import key from file
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
        </div>
      </div>
    </div>
  );
}
