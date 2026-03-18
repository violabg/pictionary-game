import { cn } from "@/lib/utils";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const inputVariants = cva(
  "flex bg-background disabled:opacity-50 border-4 border-foreground rounded-xl outline-none focus-visible:outline-none w-full min-w-0 text-foreground placeholder:text-muted-foreground transition-all focus-visible:-translate-y-1 active:translate-y-0 disabled:cursor-not-allowed disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "shadow-[4px_4px_0_0_var(--color-primary)] focus-visible:shadow-[6px_6px_0_0_var(--color-primary)] active:shadow-none focus-visible:border-foreground aria-invalid:border-destructive",
        primary:
          "shadow-[4px_4px_0_0_var(--color-primary)] focus-visible:shadow-[6px_6px_0_0_var(--color-primary)] active:shadow-none focus-visible:border-foreground aria-invalid:border-destructive",
        secondary:
          "shadow-[4px_4px_0_0_var(--color-secondary)] focus-visible:shadow-[6px_6px_0_0_var(--color-secondary)] active:shadow-none focus-visible:border-foreground aria-invalid:border-destructive",
      },
      inputSize: {
        default: "h-12 px-4 py-2 text-base font-bold",
        sm: "h-10 px-3 text-sm font-bold",
        lg: "h-14 px-5 text-lg font-bold",
        huge: "h-16 px-6 font-display font-bold text-2xl uppercase tracking-[0.5em] text-center",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  },
);

export interface InputProps
  extends
    Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {}

function Input({ className, variant, inputSize, type, ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant, inputSize, className }))}
      {...props}
    />
  );
}

export { Input, inputVariants };
