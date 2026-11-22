import type { ComponentType, ReactNode, SVGProps } from "react";
import { Link } from "react-router-dom";
import {
  CheckIcon,
  DropletIcon,
  EyeIcon,
  PackageIcon,
  ShieldIcon,
  TrendingUpIcon,
} from "@/components/ui/icons";
import { brand } from "@/config/brand";
import { AuthMobileShowcase, AuthShowcase } from "./AuthShowcase";

interface HeroNote {
  title: string;
  copy: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const HERO_NOTES: HeroNote[] = [
  {
    title: "Live inventory",
    copy: "Full, empty, and in-customer gallons at a glance.",
    icon: PackageIcon,
  },
  {
    title: "Sales in one flow",
    copy: "Completed stops post stock and sales together.",
    icon: TrendingUpIcon,
  },
  {
    title: "Masked by default",
    copy: "Customer details reveal only with audited permission.",
    icon: EyeIcon,
  },
];

const SECURITY_NOTES = [
  "HTTP-only session with CSRF protection",
  "Role-based access to every module",
  "Changes leave an audit trail",
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
      <section
        className="hero-panel relative hidden flex-col justify-between p-10 lg:flex"
        aria-label="System highlights"
      >
        <span className="auth-orb auth-orb--one" aria-hidden />
        <span className="auth-orb auth-orb--two" aria-hidden />
        <span className="auth-bubble" style={{ left: "8%", animationDelay: "0s" }} aria-hidden />
        <span className="auth-bubble" style={{ left: "26%", animationDelay: "-4s" }} aria-hidden />
        <span className="auth-bubble auth-bubble--sm" style={{ left: "45%", animationDelay: "-8s" }} aria-hidden />
        <span className="auth-bubble" style={{ left: "68%", animationDelay: "-2s" }} aria-hidden />
        <span className="auth-bubble auth-bubble--sm" style={{ left: "84%", animationDelay: "-6s" }} aria-hidden />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="auth-logo-ripple flex size-10 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur">
              <DropletIcon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight text-white">{brand.shortName}</p>
              <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-white/70">
                {brand.stationName}
              </p>
            </div>
          </div>

          <div className="mt-10 max-w-xl 2xl:max-w-2xl">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.25em] text-white/70">
              Operations workspace
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white">
              Subscriptions, orders, schedules, and deliveries in one flow.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/75">{brand.productName}</p>
            <AuthShowcase />

            <div className="auth-extra auth-extra--hero mt-8 grid-cols-3 gap-2">
              {HERO_NOTES.map(({ title: noteTitle, copy, icon: Icon }, index) => (
                <div
                  key={noteTitle}
                  className="auth-note animate-rise"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <span className="flex items-center gap-1.5">
                    <Icon className="size-3.5" />
                    <span className="auth-note-title">{noteTitle}</span>
                  </span>
                  <span className="auth-note-copy">{copy}</span>
                </div>
              ))}
            </div>
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

          <AuthMobileShowcase />

          <div className="auth-extra auth-extra--side auth-note animate-rise">
            <p className="flex items-center gap-2">
              <ShieldIcon className="size-4 text-primary" />
              <span className="auth-note-title">Protected by design</span>
            </p>
            <ul className="mt-2 space-y-1.5">
              {SECURITY_NOTES.map((note) => (
                <li key={note} className="flex items-start gap-1.5">
                  <CheckIcon className="mt-0.5 size-3 shrink-0 text-primary" />
                  <span className="auth-note-copy">{note}</span>
                </li>
              ))}
            </ul>
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
