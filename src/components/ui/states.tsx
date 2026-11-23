import type { ReactNode } from "react";
import { AlertTriangleIcon, InfoIcon } from "./icons";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground ring-1 ring-border/60">
        <InfoIcon className="size-5" />
      </span>
      <p className="text-sm font-semibold">{title}</p>
      {description ? <p className="max-w-md text-xs text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "The data could not be loaded. Try again.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-2 p-8 text-center">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
        <AlertTriangleIcon className="size-5" />
      </span>
      <p className="text-sm font-semibold">{title}</p>
      <p className="max-w-md text-xs text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
