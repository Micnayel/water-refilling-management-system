import type { HTMLAttributes } from "react";
import { AlertTriangleIcon, CheckIcon, InfoIcon } from "./icons";
import { cn } from "@/lib/utils";

type AlertTone = "info" | "success" | "warning" | "destructive";

const toneClasses: Record<AlertTone, string> = {
  info: "border-primary/30 bg-primary/5 text-foreground",
  success: "border-success/30 bg-success/5 text-foreground",
  warning: "border-warning/30 bg-warning/5 text-foreground",
  destructive: "border-destructive/30 bg-destructive/5 text-foreground",
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
      className={cn("flex items-start gap-2 rounded-md border p-2.5 text-sm", toneClasses[tone], className)}
      {...props}
    >
      <Icon className={cn("mt-0.5 size-4", tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : tone === "destructive" ? "text-destructive" : "text-primary")} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
