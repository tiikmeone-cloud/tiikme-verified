import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-[var(--brand-2)] to-[var(--brand)] text-white border border-[var(--brand-2)]/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),_0_8px_16px_var(--brand-glow)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),_0_12px_28px_var(--brand-glow)] hover:-translate-y-px hover:scale-[1.01] active:scale-[0.95] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]",
        secondary:
          "bg-white/30 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 text-[var(--text-1)] font-semibold shadow-sm hover:border-[var(--brand)] hover:bg-[var(--brand-dim)] hover:text-[var(--brand)] hover:-translate-y-px active:scale-[0.95] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]",
        ghost:
          "bg-transparent text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-white/20 dark:hover:bg-white/5 active:scale-[0.95] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]",
        destructive:
          "bg-gradient-to-b from-red-400 to-red-600 text-white border border-red-400/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),_0_8px_16px_rgba(220,38,38,0.3)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),_0_12px_24px_rgba(220,38,38,0.4)] active:scale-[0.95] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]",
        outline:
          "bg-white/30 dark:bg-white/5 backdrop-blur-md border-[1.5px] border-white/40 dark:border-white/10 text-[var(--text-1)] font-semibold shadow-sm hover:border-[var(--brand)] hover:bg-[var(--brand-dim)] active:scale-[0.95] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]",
        link: "text-[var(--brand)] underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 px-2.5 text-[11px] rounded-lg",
        sm: "h-8 px-3 text-[12px] rounded-lg",
        default: "h-[38px] px-4 text-[14px] rounded-[10px]",
        lg: "h-11 px-5 text-[14px] rounded-xl",
        xl: "h-[52px] px-[26px] text-[15px] rounded-[14px]",
        icon: "h-[38px] w-[38px] rounded-[10px]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
