import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("badge badge-subtle", {
  variants: {
    tone: {
      neutral: "theme-secondary",
      primary: "theme-primary",
      success: "theme-success",
      warning: "theme-warning",
      destructive: "theme-danger",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export function statusTone(status: string): BadgeProps["tone"] {
  switch (status.toLowerCase()) {
    case "active":
    case "completed":
      return "success";
    case "scheduled":
      return "primary";
    case "out for delivery":
      return "warning";
    case "pending":
      return "warning";
    case "cancelled":
    case "archived":
    case "inactive":
      return "destructive";
    default:
      return "neutral";
  }
}
