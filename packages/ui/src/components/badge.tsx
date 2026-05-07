import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-badge",
  {
    variants: {
      variant: {
        default: "bg-paper-warm text-ink-mute border border-line",
        planning: "bg-teal/10 text-teal border border-teal/20",
        booked: "bg-terracotta/10 text-terracotta border border-terracotta/20",
        ongoing: "bg-gold/10 text-gold border border-gold/20",
        completed: "bg-sage/10 text-teal-deep border border-sage/30",
        cancelled: "bg-rust/10 text-rust border border-rust/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
