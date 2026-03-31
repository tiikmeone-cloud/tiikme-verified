import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-bold ring-offset-background transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: "bg-brand text-white hover:bg-brand-hover hover:-translate-y-px active:scale-[0.97]",
        secondary: "bg-surface-2 border border-border text-t1 font-semibold hover:border-brand hover:bg-brand-dim active:scale-[0.97]",
        ghost: "bg-transparent text-t2 hover:text-t1 hover:bg-brand-dim active:scale-[0.97]",
        destructive: "bg-[rgba(220,38,38,0.1)] border border-[rgba(220,38,38,0.3)] text-[#DC2626] hover:bg-[rgba(220,38,38,0.2)] active:scale-[0.97]",
        outline: "bg-surface-2 border border-border text-t1 font-semibold hover:border-brand hover:bg-brand-dim active:scale-[0.97]",
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded-lg",
        sm: "h-8 px-3.5 text-[13px] rounded-[10px]",
        default: "h-[38px] px-[18px] text-sm rounded-[10px]",
        lg: "h-[46px] px-[22px] text-[15px] rounded-xl",
        xl: "h-[54px] px-7 text-base rounded-[14px]",
        icon: "h-[38px] w-[38px]",
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
