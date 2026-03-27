import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-[#7C6FFF] to-[#9B8FFF] text-white border border-[rgba(124,111,255,0.5)] shadow-[0_0_20px_rgba(124,111,255,0.3),0_4px_12px_rgba(0,0,0,0.3)] hover:from-[#9B8FFF] hover:to-[#B8B0FF] hover:shadow-[0_0_32px_rgba(124,111,255,0.5),0_4px_16px_rgba(0,0,0,0.4)] hover:-translate-y-px active:scale-[0.97] active:translate-y-0",
        destructive:
          "bg-[rgba(255,71,87,0.15)] border border-[rgba(255,71,87,0.4)] text-destructive hover:bg-[rgba(255,71,87,0.25)] hover:border-[rgba(255,71,87,0.6)] active:scale-[0.97]",
        outline:
          "bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-foreground hover:bg-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.25)] active:scale-[0.97]",
        secondary:
          "bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-foreground hover:bg-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.25)] active:scale-[0.97]",
        ghost:
          "bg-transparent text-muted-foreground hover:text-foreground hover:bg-[rgba(255,255,255,0.06)] active:scale-[0.97]",
        link: "text-primary underline-offset-4 hover:underline",
        hero:
          "bg-gradient-to-br from-[#7C6FFF] to-[#9B8FFF] text-white border border-[rgba(124,111,255,0.5)] shadow-[0_0_30px_rgba(124,111,255,0.4),0_4px_16px_rgba(0,0,0,0.3)] hover:from-[#9B8FFF] hover:to-[#B8B0FF] hover:shadow-[0_0_50px_rgba(124,111,255,0.6),0_4px_20px_rgba(0,0,0,0.4)] hover:-translate-y-px active:scale-[0.97] active:translate-y-0 text-base font-extrabold",
        neon:
          "bg-gradient-to-br from-accent to-[#33FFCA] text-accent-foreground shadow-[0_0_20px_rgba(0,255,178,0.3),0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_0_40px_rgba(0,255,178,0.5),0_4px_16px_rgba(0,0,0,0.4)] hover:-translate-y-px active:scale-[0.97] font-extrabold",
      },
      size: {
        default: "h-10 px-5 py-2",
        xs: "h-7 px-3 text-xs rounded-lg",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
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
