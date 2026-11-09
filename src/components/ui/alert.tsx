import type { HTMLAttributes } from "react";
import { AlertTriangleIcon, CheckIcon, InfoIcon } from "./icons";
import { cn } from "@/lib/utils";

type AlertTone = "info" | "success" | "warning" | "destructive";

const toneClasses: Record<AlertTone, string> = {
  info: "theme-primary",
  success: "theme-success",
  warning: "theme-warning",
  destructive: "theme-danger",
};

const toneIcon = {
  info: InfoIcon,
  success: CheckIcon,
  warning: AlertTriangleIcon,
  destructive: AlertTriangleIcon,
};

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
}

export function Alert({ className, tone = "info", children, ...props }: AlertProps) {
  const Icon = toneIcon[tone];
  return (
    <div
      role={tone === "destructive" ? "alert" : "status"}
      className={cn(
        "alert flex items-start gap-2 p-2.5 text-sm text-foreground",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4",
          tone === "success"
            ? "text-success"
            : tone === "warning"
              ? "text-warning"
              : tone === "destructive"
                ? "text-destructive"
                : "text-primary",
        )}
      />
      <div className="flex-1">{children}</div>
    </div>
  );
}
