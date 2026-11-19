import type { ComponentType, SVGProps } from "react";
import { CalendarIcon, ClipboardIcon, MapPinIcon, WalletIcon } from "@/components/ui/icons";

interface Feature {
  title: string;
  copy: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const FEATURES: Feature[] = [
  {
    title: "Subscriptions",
    copy: "Recurring refill plans stay booked week after week.",
    icon: WalletIcon,
  },
  {
    title: "Order monitoring",
    copy: "Follow every order from placed to delivered.",
    icon: ClipboardIcon,
  },
  {
    title: "Scheduling",
    copy: "Assign staff and time slots without clashes.",
    icon: CalendarIcon,
  },
  {
    title: "Delivering",
    copy: "Completing a stop posts the stock and sale together.",
    icon: MapPinIcon,
  },
];

const STAGES = ["Placed", "Scheduled", "Out for delivery", "Delivered"];

/** Decorative operations board for the sign-in hero. */
export function AuthShowcase() {
  return (
    <div className="mt-8 max-w-lg">
      <p className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-white/70">
        <span className="auth-live-dot" aria-hidden />
        What the station runs on
      </p>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {FEATURES.map(({ title, copy, icon: Icon }, index) => (
          <div
            key={title}
            className="auth-feature animate-rise"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <span className="auth-feature-icon">
              <Icon className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight text-white">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-white/70">{copy}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="auth-tracker mt-3">
        <div className="flex items-center justify-between text-[0.6875rem] text-white/65">
          <span>Order monitoring</span>
          <span className="flex items-center gap-1.5">
            <span className="auth-live-dot" aria-hidden />
            Live dispatch view
          </span>
        </div>
        <ol className="mt-2.5 grid grid-cols-4 gap-1.5">
          {STAGES.map((stage, index) => (
            <li key={stage}>
              <span
                className="auth-stage-bar"
                style={{ animationDelay: `${index * 1.1}s` }}
                aria-hidden
              />
              <span className="mt-1.5 block text-[0.6875rem] text-white/60">{stage}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** Compact capability strip for small screens where the hero is hidden. */
export function AuthMobileShowcase() {
  return (
    <section className="lg:hidden" aria-label="What the system does">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Built for the station
      </p>
      <ul className="mt-2 grid grid-cols-2 gap-2">
        {FEATURES.map(({ title, icon: Icon }) => (
          <li
            key={title}
            className="flex items-center gap-2 rounded-lg border border-border bg-card/70 px-2.5 py-2"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="size-3.5" />
            </span>
            <span className="text-xs font-medium">{title}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
