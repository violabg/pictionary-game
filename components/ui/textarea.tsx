import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "flex bg-background disabled:opacity-50 border-4 border-foreground rounded-xl outline-none focus-visible:outline-none w-full min-h-24 text-foreground placeholder:text-muted-foreground transition-all focus-visible:-translate-y-1 active:translate-y-0 disabled:cursor-not-allowed disabled:pointer-events-none",
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
        default: "px-4 py-3 text-base font-bold",
        sm: "px-3 py-2 text-sm font-bold",
        lg: "px-5 py-4 text-lg font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  },
);

export interface TextareaProps
  extends
    React.ComponentProps<"textarea">,
    VariantProps<typeof textareaVariants> {}

function Textarea({ className, variant, inputSize, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ variant, inputSize, className }))}
      {...props}
    />
  );
}

export { Textarea, textareaVariants };
