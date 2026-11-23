import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="page-header-accent mt-1 hidden h-9 w-1.5 shrink-0 rounded-full sm:block"
        />
        <div>
          <h1 className="text-[1.375rem] font-bold leading-tight tracking-[-0.02em]">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
