import type { ComponentType, SVGProps } from "react";

type CharacterKind = "subscribe" | "monitor" | "schedule" | "deliver";

interface ProcessStep {
  title: string;
  copy: string;
  character: CharacterKind;
  art: ComponentType<SVGProps<SVGSVGElement>>;
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.1,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Customer on the phone, booking a recurring refill. */
function SubscriberArt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 56" aria-hidden {...props}>
      <g {...stroke}>
        <circle cx="17" cy="13" r="5" fill="hsl(0 0% 100% / 0.26)" />
        <path d="M9 27c0-4 3.6-7 8-7s8 3 8 7v12H9z" fill="hsl(0 0% 100% / 0.2)" />
        <g className="auth-char-wave">
          <path d="M24 23l6-6" />
          <rect x="30" y="10" width="7" height="11" rx="1.8" fill="hsl(var(--primary))" stroke="none" />
          <rect className="auth-char-phone" x="31.5" y="12" width="4" height="1.6" rx="0.5" fill="hsl(var(--primary-foreground))" stroke="none" />
        </g>
        <path d="M14 39v9M20 39v9" />
      </g>
      <g className="auth-char-jug">
        <path {...stroke} d="M2 32h8v9H2z" fill="hsl(0 0% 100% / 0.2)" />
        <path {...stroke} d="M4 32v-3h3v3" />
      </g>
      <g className="auth-char-bubble">
        <rect x="29" y="2" width="11" height="5.5" rx="2.75" fill="hsl(var(--primary))" />
        <circle cx="32.5" cy="4.75" r="0.9" fill="hsl(var(--primary-foreground))" />
        <circle cx="35.5" cy="4.75" r="0.9" fill="hsl(var(--primary-foreground))" />
        <circle cx="38.5" cy="4.75" r="0.9" fill="hsl(var(--primary-foreground))" />
      </g>
    </svg>
  );
}

/** Staff watching the order board. */
function MonitorArt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 56" aria-hidden {...props}>
      <g {...stroke}>
        <circle cx="15" cy="14" r="5" fill="hsl(0 0% 100% / 0.26)" />
        <path d="M7 31c0-5 3.6-8 8-8s8 3 8 8v6H7z" fill="hsl(0 0% 100% / 0.2)" />
        <path d="M21 26l4 4" />
        <rect x="26" y="21" width="18" height="13" rx="2" fill="hsl(0 0% 100% / 0.08)" />
        <path d="M35 34v4M30 40h10" />
        <rect x="3" y="40" width="42" height="3" rx="1.5" fill="hsl(0 0% 100% / 0.2)" stroke="none" />
        <path d="M10 40l-2 9M20 40l2 9" />
      </g>
      <g className="auth-char-screen" fill="hsl(var(--primary))">
        <rect className="auth-char-bar" style={{ animationDelay: "0ms" }} x="29" y="29" width="2.5" height="3" rx="0.6" />
        <rect className="auth-char-bar" style={{ animationDelay: "220ms" }} x="33" y="26.5" width="2.5" height="5.5" rx="0.6" />
        <rect className="auth-char-bar" style={{ animationDelay: "440ms" }} x="37" y="24.5" width="2.5" height="7.5" rx="0.6" />
      </g>
    </svg>
  );
}

/** Staff assigning a delivery slot on the calendar. */
function SchedulerArt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 56" aria-hidden {...props}>
      <g {...stroke}>
        <circle cx="14" cy="14" r="5" fill="hsl(0 0% 100% / 0.26)" />
        <path d="M6 29c0-4 3.6-7 8-7s8 3 8 7v14H6z" fill="hsl(0 0% 100% / 0.2)" />
        <path className="auth-char-point" d="M20 23l9-7" />
        <path d="M11 43l-2 8M19 43l2 8" />
        <rect x="30" y="7" width="16" height="19" rx="2.5" fill="hsl(0 0% 100% / 0.08)" />
        <path d="M30 12h16M35 5v4M41 5v4" />
      </g>
      <g className="auth-char-ping">
        <circle cx="41" cy="20" r="2.4" fill="hsl(var(--primary))" />
      </g>
      <g className="auth-char-dots" fill="hsl(0 0% 100% / 0.4)">
        <circle cx="34" cy="16" r="1.1" />
        <circle cx="38" cy="16" r="1.1" />
        <circle cx="42" cy="16" r="1.1" />
        <circle cx="34" cy="22" r="1.1" />
      </g>
    </svg>
  );
}

/** Delivery rider carrying a gallon to the customer. */
function DeliveryArt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 56" aria-hidden {...props}>
      <g {...stroke}>
        <circle cx="18" cy="13" r="5" fill="hsl(0 0% 100% / 0.26)" />
        <path d="M12 10h13" />
        <path d="M10 27c0-4 3.6-7 8-7s8 3 8 7v13H10z" fill="hsl(0 0% 100% / 0.2)" />
        <path d="M25 22l4 7" />
        <path className="auth-char-leg auth-char-leg--a" d="M14 40l-4 9" />
        <path className="auth-char-leg auth-char-leg--b" d="M21 40l4 9" />
      </g>
      <g className="auth-char-jug">
        <path {...stroke} d="M27 28h6v10h-6z" fill="hsl(var(--primary) / 0.4)" />
        <path {...stroke} d="M29 28v-2h2v2" />
      </g>
      <g className="auth-char-speed" stroke="hsl(0 0% 100% / 0.45)" strokeWidth="1.6" strokeLinecap="round">
        <path d="M2 24h6M1 30h5M3 36h5" />
      </g>
    </svg>
  );
}

const PROCESS: ProcessStep[] = [
  {
    title: "Customer subscribes",
    copy: "Recurring refill plans stay booked week after week.",
    character: "subscribe",
    art: SubscriberArt,
  },
  {
    title: "Staff monitor orders",
    copy: "Follow every order from placed to delivered.",
    character: "monitor",
    art: MonitorArt,
  },
  {
    title: "Deliveries are scheduled",
    copy: "Assign staff and time slots without clashes.",
    character: "schedule",
    art: SchedulerArt,
  },
  {
    title: "Gallon delivered",
    copy: "Completing a stop posts the stock and sale together.",
    character: "deliver",
    art: DeliveryArt,
  },
];

/** Animated operations story for the sign-in hero. */
export function AuthShowcase() {
  return (
    <div className="mt-4 max-w-lg">
      <p className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-white/70">
        <span className="auth-live-dot" aria-hidden />
        How the station runs
      </p>

      <ol className="auth-process mt-3 space-y-1.5">
        <span className="auth-travel" aria-hidden />
        {PROCESS.map(({ title, copy, character, art: Art }, index) => (
          <li key={title} className="auth-step animate-rise" style={{ animationDelay: `${index * 70}ms` }}>
            <span className="auth-step-badge" aria-hidden>
              {index + 1}
            </span>
            <div className="auth-step-card">
              <span className={`auth-char auth-char--${character}`}>
                <Art className="h-full w-full" />
              </span>
              <div>
                <p className="text-[0.9375rem] font-semibold leading-tight text-white">{title}</p>
                <p className="mt-0.5 text-xs leading-snug text-white/70">{copy}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Compact version for small screens where the hero is hidden. */
export function AuthMobileShowcase() {
  return (
    <section className="lg:hidden" aria-label="What the system does">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Built for the station
      </p>
      <ul className="mt-2 grid grid-cols-2 gap-2">
        {PROCESS.map(({ title, art: Art }) => (
          <li
            key={title}
            className="flex items-center gap-2 rounded-lg border border-border bg-card/70 px-2.5 py-1.5"
          >
            <span className="flex size-11 shrink-0 items-center justify-center text-primary">
              <Art className="h-11 w-10" />
            </span>
            <span className="text-xs font-medium leading-tight">{title}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
