import type { ReactNode } from "react";

/** Five-gallon jug illustration used across the landing page. */
export function BottleArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 220" className={`lp-bottle ${className}`} aria-hidden focusable="false">
      <rect x="50" y="5" width="20" height="15" rx="4" className="lp-art-clear" />
      <path d="M52 20h16l5 13H47z" className="lp-art-glass" />
      <rect x="16" y="33" width="88" height="175" rx="28" className="lp-art-glass" />
      <path d="M17 116h86v64a27 27 0 0 1-27 27H44a27 27 0 0 1-27-27z" className="lp-art-water" />
      <rect x="17" y="33" width="86" height="175" rx="28" fill="none" className="lp-art-outline" />
      <rect x="29" y="52" width="12" height="118" rx="6" fill="#fff" opacity=".55" />
      <rect x="35" y="124" width="50" height="28" rx="9" fill="#fff" opacity=".92" />
      <path
        d="M55 133c2.2 2.7 3.4 4.2 3.4 5.7a3.4 3.4 0 0 1-6.8 0c0-1.5 1.2-3 3.4-5.7z"
        className="lp-art-mark"
      />
      <rect x="63" y="134" width="15" height="2.6" rx="1.3" className="lp-art-mark" opacity=".8" />
      <rect x="63" y="139" width="11" height="2.6" rx="1.3" className="lp-art-mark" opacity=".5" />
      <g fill="#fff" opacity=".28">
        <rect x="30" y="86" width="60" height="3" rx="1.5" />
        <rect x="30" y="94" width="60" height="3" rx="1.5" />
      </g>
    </svg>
  );
}

/** Simple phone shell with a notch and viewport. */
export function PhoneFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`lp-phone ${className}`}>
      <span className="lp-phone-notch" aria-hidden />
      <div className="lp-phone-screen">{children}</div>
    </div>
  );
}

/** Flat side-view delivery truck. */
export function TruckArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 176 96" className={`lp-truck ${className}`} aria-hidden focusable="false">
      <rect x="8" y="28" width="90" height="44" rx="7" className="lp-art-truck-box" />
      <rect x="8" y="28" width="90" height="8" rx="4" fill="#fff" opacity=".22" />
      <path d="M98 36h30l22 20v16H98z" className="lp-art-truck-cab" />
      <rect x="106" y="42" width="22" height="14" rx="4" className="lp-art-truck-window" />
      <rect x="4" y="68" width="168" height="6" rx="3" fill="#fff" opacity=".4" />
      <circle cx="42" cy="76" r="11" className="lp-art-truck-tyre" />
      <circle cx="42" cy="76" r="4" className="lp-art-truck-hub" />
      <circle cx="132" cy="76" r="11" className="lp-art-truck-tyre" />
      <circle cx="132" cy="76" r="4" className="lp-art-truck-hub" />
      <path
        d="M24 44c2 2.4 3 3.8 3 5.1a3 3 0 1 1-6 0c0-1.3 1-2.7 3-5.1z"
        fill="#fff"
      />
      <text x="36" y="52" fontSize="9" fontWeight="700" letterSpacing="0.6" fill="#fff">
        RAINTECH
      </text>
    </svg>
  );
}

/** Decorative dotted map route with named landmarks. */
export function RouteArt({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 400 180" className="lp-route" aria-hidden focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="hsl(var(--lp-cyan))" stopOpacity=".2" />
          <stop offset="1" stopColor="hsl(var(--lp-aqua))" stopOpacity=".95" />
        </linearGradient>
      </defs>
      <path
        d="M24 140C90 140 96 82 162 82s74 58 126 46 58-62 88-66"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="9 10"
      />
      <circle cx="24" cy="140" r="6" className="lp-art-route-start" />
      <circle cx="376" cy="62" r="7" className="lp-art-route-end" />
    </svg>
  );
}
