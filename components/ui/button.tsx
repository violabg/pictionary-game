import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex justify-center items-center disabled:opacity-50 active:shadow-none border-4 border-foreground rounded-xl outline-none font-display font-black uppercase tracking-widest whitespace-nowrap transition-all hover:-translate-y-1 active:translate-x-1 active:translate-y-1 disabled:pointer-events-none select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[4px_4px_0_0_var(--color-primary)] hover:shadow-[6px_6px_0_0_var(--color-primary)]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[4px_4px_0_0_var(--color-secondary)] hover:shadow-[6px_6px_0_0_var(--color-secondary)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[4px_4px_0_0_var(--color-destructive)] hover:shadow-[6px_6px_0_0_var(--color-destructive)]",
        outline:
          "bg-background text-foreground shadow-[4px_4px_0_0_var(--color-primary)] hover:shadow-[6px_6px_0_0_var(--color-primary)]",
        ghost:
          "border-transparent bg-transparent hover:bg-muted text-foreground shadow-none hover:shadow-none active:translate-y-0 active:translate-x-0",
        link: "text-primary underline-offset-4 hover:underline border-none shadow-none bg-transparent active:translate-y-0 active:translate-x-0 p-0",
      },
      size: {
        default: "h-12 px-6 py-2 text-lg",
        sm: "h-10 px-4 text-base",
        lg: "h-16 px-8 py-4 text-xl",
        icon: "size-12",
        "icon-sm": "size-10",
        "icon-lg": "size-16",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
