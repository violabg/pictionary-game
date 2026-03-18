import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex justify-center items-center shadow-[2px_2px_0_0_var(--color-primary)] px-4 py-2 border-2 border-foreground rounded-lg font-bold text-sm uppercase tracking-wider whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default:
          "shadow-[2px_2px_0_0_var(--color-primary)] bg-primary text-primary-foreground",
        secondary:
          "shadow-[2px_2px_0_0_var(--color-secondary)] bg-secondary text-secondary-foreground",
        destructive:
          "shadow-[2px_2px_0_0_var(--color-destructive)] bg-destructive text-destructive-foreground",
        outline:
          "shadow-[2px_2px_0_0_var(--color-primary)] bg-background text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ className, variant })),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
