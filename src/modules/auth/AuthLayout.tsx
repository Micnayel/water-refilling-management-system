import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { DropletIcon } from "@/components/ui/icons";
import { brand } from "@/config/brand";

export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <DropletIcon className="size-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{brand.shortName}</p>
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="card-surface p-4">{children}</div>
        {footer ? <div className="text-center text-xs text-muted-foreground">{footer}</div> : null}
        <p className="text-center text-xs text-muted-foreground">
          <Link to="/login" className="hover:underline">
            {brand.stationName}
          </Link>
        </p>
      </div>
    </main>
  );
}
