import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderIcon } from "./icons";
import { cn } from "@/lib/utils";

/**
 * Buttons use the Bootstrap 6 alpha button API (`btn` + `btn-*` shape +
 * `theme-*` color), and the shape classes are fed by the template tokens.
 */
const buttonVariants = cva("btn", {
  variants: {
    variant: {
      default: "btn-solid theme-primary",
      secondary: "btn-solid",
      outline: "btn-outline theme-secondary",
      ghost: "btn-text",
      destructive: "btn-solid theme-danger",
      link: "btn-link",
    },
    size: {
      default: "btn-sm",
      sm: "btn-xs",
      icon: "btn-sm btn-icon",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      type={props.type ?? "button"}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderIcon className="size-4 animate-spin" /> : null}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export { buttonVariants };
