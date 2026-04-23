import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Lock, Plus, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";

export function CreateCircleButton() {
  const { profile } = useAuth();
  const score = profile?.activity_score ?? 0;
  const isVerified = !!profile?.is_verified;
  const canCreate = score >= 50 && isVerified;

  if (canCreate) {
    return (
      <Link
        to="/app/circles/create"
        className="inline-flex items-center gap-1.5 active:scale-95 transition"
        style={{
          height: 36,
          padding: "0 14px",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 700,
          background: "#FA903E",
          color: "#fff",
        }}
      >
        <Plus className="w-4 h-4" /> Create circle
      </Link>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
          style={{
            height: 36,
            padding: "0 14px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            background: "rgba(255,255,255,0.5)",
            border: "1px dashed #C7CAD9",
            color: "#6B7094",
          }}
        >
          <Lock className="w-3.5 h-3.5" /> Create circle
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 bg-white">
        <h4 className="font-semibold text-[14px] text-[#1A1A2E]">Unlock circle creation</h4>
        <p className="text-[12px] text-neutral-600 mt-1">Build trust on Tiikme first.</p>
        <ul className="mt-3 space-y-2">
          <RequirementRow
            done={isVerified}
            label="Get verified on your profile"
          />
          <RequirementRow
            done={score >= 50}
            label={<>Reach Activity Score <span className="num">50</span> (you're at <span className="num">{score}</span>)</>}
          />
        </ul>
        <Link
          to="/app/settings/profile"
          className="block mt-4 text-[13px] font-semibold"
          style={{ color: "#FA903E" }}
        >
          Start verification →
        </Link>
      </PopoverContent>
    </Popover>
  );
}

function RequirementRow({ done, label }: { done: boolean; label: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-[13px]">
      <span
        className="mt-0.5 inline-flex items-center justify-center rounded-full"
        style={{
          width: 18,
          height: 18,
          background: done ? "rgba(34,197,94,0.15)" : "rgba(107,112,148,0.15)",
          color: done ? "#16A34A" : "#6B7094",
          flexShrink: 0,
        }}
      >
        {done ? <Check className="w-3 h-3" /> : <span className="text-[10px]">○</span>}
      </span>
      <span className={done ? "text-neutral-500 line-through" : "text-[#1A1A2E]"}>{label}</span>
    </li>
  );
}
