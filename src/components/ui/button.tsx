import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold ring-offset-background transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--brand)] text-white border-none rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_4px_12px_var(--brand-glow)] hover:bg-[var(--brand-2)] hover:shadow-[0_8px_24px_var(--brand-glow)] hover:-translate-y-px hover:scale-[1.01] active:scale-[0.97] active:shadow-[0_2px_8px_var(--brand-glow)]",
        secondary:
          "bg-[var(--surface-2)] border-[1.5px] border-[var(--border-2)] text-[var(--text-1)] font-semibold rounded-xl hover:border-[var(--brand)] hover:bg-[var(--brand-dim)] hover:text-[var(--brand)] active:scale-[0.97]",
        ghost:
          "bg-transparent text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--brand-dim)] rounded-xl active:scale-[0.97]",
        destructive:
          "bg-[rgba(220,38,38,0.10)] border border-[rgba(220,38,38,0.25)] text-[#DC2626] rounded-xl hover:bg-[rgba(220,38,38,0.18)] active:scale-[0.97]",
        outline:
          "bg-[var(--surface-2)] border-[1.5px] border-[var(--border-2)] text-[var(--text-1)] font-semibold rounded-xl hover:border-[var(--brand)] hover:bg-[var(--brand-dim)] active:scale-[0.97]",
        link: "text-[var(--brand)] underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 px-3 text-[11px] rounded-lg",
        sm: "h-8 px-3.5 text-[12px] rounded-[10px]",
        default: "h-9 px-4 text-[13px] rounded-[10px]",
        lg: "h-11 px-5 text-[14px] rounded-xl",
        xl: "h-[52px] px-7 text-[15px] rounded-[14px]",
        icon: "h-9 w-9",
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
