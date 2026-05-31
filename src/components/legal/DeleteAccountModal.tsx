import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { tiikToast } from "@/components/ui/tiik-toast";

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
}

const DELETED_ITEMS = [
  "Your profile, photo, bio, and personal details",
  "All posts you created",
  "Your connection history",
  "Verification documents you submitted",
  "Your notification history",
];

export default function DeleteAccountModal({ open, onClose, userId }: DeleteAccountModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string>("");

  if (!open) return null;

  const reset = () => {
    setStep(1);
    setConfirmText("");
    setSubmitting(false);
    setScheduledDate("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirmDelete = async () => {
    if (!userId || confirmText !== "DELETE") return;
    setSubmitting(true);
    const requestedAt = new Date();
    const { error } = await supabase
      .from("profiles")
      .update({
        pending_deletion: true,
        deletion_requested_at: requestedAt.toISOString(),
      })
      .eq("id", userId);

    if (error) {
      setSubmitting(false);
      tiikToast.error(error.message || "Failed to schedule deletion");
      return;
    }

    const scheduled = new Date(requestedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    setScheduledDate(
      scheduled.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    );
    setSubmitting(false);
    setStep(3);
  };

  const handleFinish = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate("/", { replace: true });
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:pl-[220px]"
      style={{ background: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-[17px] font-bold text-gray-900">
            {step === 1 && "Delete Your Account"}
            {step === 2 && "Final Confirmation"}
            {step === 3 && "Deletion Scheduled"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          {step === 1 && (
            <>
              <div className="flex items-start gap-3 p-3.5 rounded-xl mb-4" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
                <p className="text-[13.5px] leading-relaxed text-gray-800">
                  This will permanently delete your profile, posts, connections, and all personal data within 90 days. This action cannot be undone after the 30-day grace period.
                </p>
              </div>

              <p className="text-[13px] font-semibold text-gray-900 mb-2">What will be deleted:</p>
              <ul className="space-y-2 mb-5">
                {DELETED_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13.5px] text-gray-700">
                    <span
                      className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5"
                      style={{ background: "rgba(239,68,68,0.12)" }}
                    >
                      <Check className="w-2.5 h-2.5" style={{ color: "#DC2626" }} strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => tiikToast("Data export coming soon. Email contact@tiikme.com for now.")}
                className="text-[13px] font-semibold text-brand-hover hover:underline mb-1"
              >
                Download my data first
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-[14px] text-gray-700 leading-relaxed mb-4">
                To confirm permanent deletion, type{" "}
                <span className="font-bold text-gray-900">DELETE</span> in the box below. Your account will enter a 30-day grace period — log in any time before then to cancel.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                autoFocus
                className="w-full h-11 px-3.5 rounded-xl text-[14px] outline-none"
                style={{
                  background: "#fff",
                  border: confirmText === "DELETE" ? "1.5px solid #DC2626" : "1.5px solid #E5E7EB",
                  color: "#111827",
                }}
              />
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex flex-col items-center text-center py-2">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(239,68,68,0.10)" }}>
                  <AlertTriangle className="w-7 h-7" style={{ color: "#DC2626" }} />
                </div>
                <p className="text-[15px] font-semibold text-gray-900 mb-2">
                  Your account is scheduled for deletion on {scheduledDate}.
                </p>
                <p className="text-[13.5px] text-gray-600 leading-relaxed">
                  You can reactivate by logging back in any time before that date. After {scheduledDate}, deletion is permanent.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          {step === 1 && (
            <>
              <Button variant="ghost" onClick={handleClose} type="button">Cancel</Button>
              <Button onClick={() => setStep(2)} type="button" style={{ background: "#DC2626", color: "#fff" }}>
                I understand, continue
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="ghost" onClick={() => setStep(1)} type="button">Back</Button>
              <Button
                type="button"
                onClick={handleConfirmDelete}
                disabled={confirmText !== "DELETE" || submitting}
                style={{
                  background: confirmText === "DELETE" ? "#DC2626" : "#FCA5A5",
                  color: "#fff",
                  cursor: confirmText === "DELETE" && !submitting ? "pointer" : "not-allowed",
                }}
              >
                {submitting ? "Scheduling…" : "Delete My Account"}
              </Button>
            </>
          )}
          {step === 3 && (
            <Button onClick={handleFinish} type="button" className="ml-auto">Sign out</Button>
          )}
        </div>
      </div>
    </div>
  );
}
