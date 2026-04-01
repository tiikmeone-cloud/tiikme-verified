import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full glass-input px-3.5 py-2 text-[14px] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:border-[var(--brand)] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.05),_0_0_0_3px_var(--brand-dim)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
