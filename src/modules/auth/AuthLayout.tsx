import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CheckIcon, DropletIcon, ShieldIcon } from "@/components/ui/icons";
import { brand } from "@/config/brand";

const highlights = [
  "Live sales, clients, and gallon stock in one view",
  "Masked customer locations with audited reveals",
  "Schedules that post stock and sales together",
];

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
    <main className="app-canvas min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      <section className="hero-panel relative hidden flex-col justify-between p-10 lg:flex" aria-hidden="true">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur">
              <DropletIcon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight text-white">{brand.shortName}</p>
              <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-white/70">
                {brand.stationName}
              </p>
            </div>
          </div>

          <div className="mt-20 max-w-md">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.25em] text-white/70">
              Operations workspace
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white">
              Every gallon accounted for, every delivery on time.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/75">{brand.productName}</p>

            <ul className="mt-8 space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-white/85">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                    <CheckIcon className="size-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-[0.6875rem] text-white/60">
          <ShieldIcon className="size-3.5" />
          {brand.supportNote}
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span className="brand-mark flex size-9 items-center justify-center rounded-lg text-primary-foreground">
              <DropletIcon className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight">{brand.shortName}</p>
              <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-muted-foreground">
                {brand.stationName}
              </p>
            </div>
          </div>

          <div className="auth-card animate-rise p-5">
            <div className="mb-4">
              <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            </div>
            {children}
            {footer ? <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">{footer}</div> : null}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/login" className="transition-colors hover:text-foreground">
              {brand.stationName}
            </Link>
            <span className="mx-1.5 text-border">•</span>
            <span>Internal use</span>
          </p>
        </div>
      </section>
    </main>
  );
}
