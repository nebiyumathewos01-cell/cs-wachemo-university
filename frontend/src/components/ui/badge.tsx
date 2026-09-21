import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors select-none",
  {
    variants: {
      variant: {
        default:      "bg-primary text-primary-foreground",
        secondary:    "bg-secondary text-secondary-foreground",
        outline:      "border border-border text-foreground",
        destructive:  "bg-destructive/10 text-destructive border border-destructive/20",
        success:      "bg-success-subtle text-success border border-success/20",
        warning:      "bg-warning-subtle text-warning-foreground border border-warning/20",
        "coming-soon":"bg-orange-50 text-orange-700 border border-orange-200",
        subtle:       "bg-primary-subtle text-primary border border-primary/20",
        muted:        "bg-muted text-foreground-muted",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
