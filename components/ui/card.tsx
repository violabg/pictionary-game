import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "group/card flex flex-col bg-card border-4 border-foreground rounded-2xl overflow-hidden text-card-foreground transition-transform data-[state=open]:translate-x-1 data-[state=open]:translate-y-1",
  {
    variants: {
      variant: {
        default:
          "shadow-[8px_8px_0_0_var(--color-primary)] data-[state=open]:shadow-[4px_4px_0_0_var(--color-primary)]",
        primary:
          "shadow-[8px_8px_0_0_var(--color-primary)] data-[state=open]:shadow-[4px_4px_0_0_var(--color-primary)]",
        secondary:
          "shadow-[8px_8px_0_0_var(--color-secondary)] data-[state=open]:shadow-[4px_4px_0_0_var(--color-secondary)]",
        destructive:
          "shadow-[8px_8px_0_0_var(--color-destructive)] data-[state=open]:shadow-[4px_4px_0_0_var(--color-destructive)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface CardProps
  extends React.ComponentProps<"div">, VariantProps<typeof cardVariants> {
  size?: "default" | "sm";
  glass?: boolean;
  gradientBorder?: boolean;
}

function Card({
  className,
  size = "default",
  glass = false,
  gradientBorder = false,
  variant,
  ...props
}: CardProps) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-display font-black text-foreground text-2xl uppercase tracking-widest",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("font-sans font-bold text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "justify-self-end self-start col-start-2 row-span-2 row-start-1",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-6 pt-0", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
