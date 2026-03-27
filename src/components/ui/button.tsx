import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(124,111,255,0.3)] hover:shadow-[0_0_30px_rgba(124,111,255,0.5)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-transparent hover:bg-muted hover:text-foreground",
        secondary: "glass-card text-foreground hover:bg-muted",
        ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-primary text-primary-foreground shadow-[0_0_30px_rgba(124,111,255,0.4)] hover:shadow-[0_0_50px_rgba(124,111,255,0.6)] hover:bg-primary/90 text-base font-bold",
        neon: "bg-accent text-accent-foreground shadow-[0_0_20px_rgba(0,255,178,0.3)] hover:shadow-[0_0_40px_rgba(0,255,178,0.5)] font-bold",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-md px-3",
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
