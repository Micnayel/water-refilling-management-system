import type { ReactNode } from "react";

interface ProcessStep {
  title: string;
  copy: string;
}

const PROCESS: ProcessStep[] = [
  {
    title: "Customer subscribes",
    copy: "Recurring refill plans stay booked week after week.",
  },
  {
    title: "Staff monitor orders",
    copy: "Follow every order from placed to delivered.",
  },
  {
    title: "Deliveries are scheduled",
    copy: "Assign staff and time slots without clashes.",
  },
  {
    title: "Gallon delivered",
    copy: "Completing a stop posts the stock and sale together.",
  },
];

/** Flat illustration of the station workflow, animated on a 12-second loop. */
function StationScene() {
  return (
    <div className="auth-scene">
      <svg className="auth-scene-art" viewBox="0 0 480 200" aria-hidden focusable="false">
        <rect x="0" y="0" width="480" height="170" fill="hsl(var(--primary))" fillOpacity="0.12" />
        {/* City skyline */}
        <g fill="currentColor" fillOpacity="0.1">
          <rect x="4" y="94" width="34" height="74" rx="2" />
          <rect x="44" y="116" width="26" height="52" rx="2" />
          <rect x="248" y="106" width="30" height="62" rx="2" />
          <rect x="284" y="84" width="22" height="84" rx="2" />
          <rect x="312" y="120" width="40" height="48" rx="2" />
          <rect x="358" y="98" width="26" height="70" rx="2" />
          <rect x="410" y="122" width="34" height="46" rx="2" />
          <rect x="450" y="102" width="22" height="66" rx="2" />
        </g>
        <g fill="currentColor" fillOpacity="0.22">
          <rect x="10" y="102" width="5" height="6" rx="1" />
          <rect x="22" y="102" width="5" height="6" rx="1" />
          <rect x="10" y="116" width="5" height="6" rx="1" />
          <rect x="290" y="92" width="4" height="5" rx="1" />
          <rect x="298" y="92" width="4" height="5" rx="1" />
          <rect x="290" y="104" width="4" height="5" rx="1" />
          <rect x="366" y="106" width="4" height="5" rx="1" />
          <rect x="374" y="106" width="4" height="5" rx="1" />
          <rect x="366" y="118" width="4" height="5" rx="1" />
        </g>

        {/* Ground and road */}
        <rect x="0" y="166" width="480" height="3" fill="currentColor" fillOpacity="0.25" />
        <rect x="0" y="169" width="480" height="31" fill="hsl(var(--primary))" fillOpacity="0.16" />
        <g
          className="auth-scene-dashes"
          stroke="currentColor"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="9 13"
        >
          <path d="M-24 185h528" />
        </g>

        {/* Station storefront */}
        <g>
          <rect
            x="52"
            y="64"
            width="188"
            height="102"
            rx="4"
            fill="currentColor"
            fillOpacity="0.08"
            stroke="currentColor"
            strokeOpacity="0.22"
          />
          <rect x="76" y="42" width="140" height="24" rx="5" fill="hsl(var(--primary))" />
          <path
            d="M89 49c2.6 3.2 4 5 4 6.8a4 4 0 1 1-8 0c0-1.8 1.4-3.6 4-6.8z"
            fill="hsl(var(--primary-foreground))"
          />
          <text
            x="98"
            y="58"
            fontSize="9"
            fontWeight="700"
            letterSpacing="0.8"
            fill="hsl(var(--primary-foreground))"
          >
            WATER STATION
          </text>

          {/* Facade trim and awning */}
          <rect x="64" y="74" width="168" height="4" rx="2" fill="hsl(var(--primary))" fillOpacity="0.7" />
          <g fill="hsl(var(--primary-foreground))" fillOpacity="0.22">
            <rect x="68" y="78" width="12" height="4" rx="1" />
            <rect x="92" y="78" width="12" height="4" rx="1" />
            <rect x="116" y="78" width="12" height="4" rx="1" />
            <rect x="140" y="78" width="12" height="4" rx="1" />
            <rect x="164" y="78" width="12" height="4" rx="1" />
            <rect x="188" y="78" width="12" height="4" rx="1" />
            <rect x="212" y="78" width="12" height="4" rx="1" />
          </g>

          {/* Counter window */}
          <rect
            x="70"
            y="86"
            width="94"
            height="56"
            rx="4"
            fill="hsl(var(--primary))"
            fillOpacity="0.32"
            stroke="currentColor"
            strokeOpacity="0.3"
          />
          <g className="auth-scene-staff">
            <circle cx="112" cy="106" r="7" fill="currentColor" fillOpacity="0.92" />
            <path d="M105 103a7 7 0 0 1 14 0z" fill="hsl(var(--primary))" />
            <path
              d="M101 124c0-7 5-11 11-11s11 4 11 11v12h-22z"
              fill="currentColor"
              fillOpacity="0.82"
            />
            <path d="M108 120h8v16h-8z" fill="hsl(var(--primary))" fillOpacity="0.75" />
            <g className="auth-scene-wave">
              <path
                d="M122 122l9-7"
                stroke="currentColor"
                strokeOpacity="0.92"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
            <path
              d="M101 124l-6 7"
              stroke="currentColor"
              strokeOpacity="0.6"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>

          {/* Counter and door */}
          <rect x="62" y="140" width="112" height="5" rx="2" fill="currentColor" fillOpacity="0.38" />
          <rect x="62" y="145" width="112" height="21" fill="currentColor" fillOpacity="0.1" />
          <rect
            x="182"
            y="86"
            width="44"
            height="80"
            rx="3"
            fill="currentColor"
            fillOpacity="0.06"
            stroke="currentColor"
            strokeOpacity="0.24"
          />
          <path d="M204 86v80" stroke="currentColor" strokeOpacity="0.18" />
          <circle cx="197" cy="128" r="1.6" fill="currentColor" fillOpacity="0.65" />
          <rect x="176" y="164" width="56" height="3" rx="1.5" fill="currentColor" fillOpacity="0.22" />
        </g>

        {/* Floating order card */}
        <g className="auth-scene-orders">
          <rect
            x="242"
            y="58"
            width="46"
            height="28"
            rx="5"
            fill="currentColor"
            fillOpacity="0.12"
            stroke="currentColor"
            strokeOpacity="0.32"
          />
          <path d="M249 65h31" stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
          <rect x="249" y="72" width="4" height="9" rx="1" fill="hsl(var(--primary))" />
          <rect x="256" y="69" width="4" height="12" rx="1" fill="hsl(var(--primary))" />
          <rect x="263" y="74" width="4" height="7" rx="1" fill="hsl(var(--primary))" />
        </g>

        {/* Floating schedule card */}
        <g className="auth-scene-calendar">
          <rect
            x="242"
            y="94"
            width="46"
            height="36"
            rx="5"
            fill="currentColor"
            fillOpacity="0.12"
            stroke="currentColor"
            strokeOpacity="0.32"
          />
          <path d="M242 104h46" stroke="currentColor" strokeOpacity="0.32" />
          <g fill="currentColor" fillOpacity="0.45">
            <circle cx="251" cy="112" r="1.6" />
            <circle cx="259" cy="112" r="1.6" />
            <circle cx="267" cy="112" r="1.6" />
            <circle cx="251" cy="120" r="1.6" />
            <circle cx="259" cy="120" r="1.6" />
          </g>
          <circle className="auth-scene-ping" cx="275" cy="116" r="3" fill="hsl(var(--primary))" />
        </g>

        {/* Customer walking in with a jug */}
        <g className="auth-scene-customer">
          <g className="auth-scene-order">
            <rect x="32" y="64" width="48" height="21" rx="6" fill="hsl(var(--primary))" />
            <path d="M42 85l-4 7 9-7z" fill="hsl(var(--primary))" />
            <text
              x="39"
              y="78"
              fontSize="7"
              fontWeight="700"
              letterSpacing="0.6"
              fill="hsl(var(--primary-foreground))"
            >
              ORDER
            </text>
          </g>
          <circle cx="30" cy="112" r="7" fill="currentColor" fillOpacity="0.92" />
          <path d="M23 109a7 7 0 0 1 14 0z" fill="hsl(var(--primary))" />
          <path
            d="M21 132c0-7 4-10 9-10s9 3 9 10v22H21z"
            fill="currentColor"
            fillOpacity="0.82"
          />
          <path
            d="M39 136l7-6"
            stroke="currentColor"
            strokeOpacity="0.9"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <rect x="44" y="121" width="5" height="9" rx="1.2" fill="hsl(var(--primary))" transform="rotate(-14 46.5 125.5)" />
          <g className="auth-scene-legs">
            <path d="M26 153v13" stroke="currentColor" strokeOpacity="0.8" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M35 153v13" stroke="currentColor" strokeOpacity="0.8" strokeWidth="3.5" strokeLinecap="round" />
          </g>
          <g className="auth-scene-carry">
            <rect
              x="8"
              y="138"
              width="13"
              height="22"
              rx="2.5"
              fill="hsl(var(--primary))"
              stroke="currentColor"
              strokeOpacity="0.5"
            />
            <rect x="12" y="134" width="5" height="5" rx="1" fill="currentColor" fillOpacity="0.8" />
          </g>
        </g>

        {/* Delivery truck */}
        <g className="auth-scene-truck">
          <g className="auth-scene-wheel">
            <circle cx="330" cy="154" r="13" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeOpacity="0.55" strokeWidth="3" />
            <path d="M330 144v20M320 154h20" stroke="currentColor" strokeOpacity="0.6" strokeWidth="2" />
            <circle cx="330" cy="154" r="3.5" fill="currentColor" fillOpacity="0.7" />
          </g>
          <g className="auth-scene-wheel">
            <circle cx="436" cy="154" r="13" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeOpacity="0.55" strokeWidth="3" />
            <path d="M436 144v20M426 154h20" stroke="currentColor" strokeOpacity="0.6" strokeWidth="2" />
            <circle cx="436" cy="154" r="3.5" fill="currentColor" fillOpacity="0.7" />
          </g>
          <rect x="300" y="94" width="112" height="58" rx="5" fill="hsl(var(--primary))" />
          <rect x="300" y="134" width="112" height="6" fill="hsl(var(--primary-foreground))" fillOpacity="0.35" />
          <path
            d="M313 110c2 2.4 3 3.8 3 5.1a3 3 0 1 1-6 0c0-1.3 1-2.7 3-5.1z"
            fill="hsl(var(--primary-foreground))"
          />
          <text
            x="321"
            y="120"
            fontSize="11"
            fontWeight="700"
            letterSpacing="1.2"
            fill="hsl(var(--primary-foreground))"
          >
            WRMS
          </text>
          <path d="M414 108h28c6 0 10 4 12 9l3 9v26h-43z" fill="currentColor" fillOpacity="0.92" />
          <path d="M421 114h20c4 0 6 3 7 7l2 5h-29z" fill="hsl(var(--primary))" fillOpacity="0.35" />
          <circle cx="431" cy="118" r="3.4" fill="currentColor" fillOpacity="0.9" />
          <path d="M425 130c0-4 2.6-6 6-6s6 2 6 6z" fill="currentColor" fillOpacity="0.9" />
          <rect x="408" y="149" width="52" height="5" rx="2" fill="currentColor" fillOpacity="0.6" />
          <circle cx="451" cy="139" r="3" fill="hsl(var(--primary-foreground))" />
        </g>

        {/* Gallon being loaded */}
        <g className="auth-scene-load">
          <rect
            x="208"
            y="140"
            width="16"
            height="22"
            rx="2.5"
            fill="hsl(var(--primary))"
            stroke="currentColor"
            strokeOpacity="0.55"
          />
          <rect x="213" y="136" width="6" height="5" rx="1" fill="currentColor" fillOpacity="0.85" />
        </g>

        {/* Delivered badge */}
        <g className="auth-scene-done">
          <circle cx="240" cy="146" r="13" fill="hsl(var(--primary))" />
          <path
            d="M234 146l4.4 4.4L247 141"
            fill="none"
            stroke="hsl(var(--primary-foreground))"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
}

function SceneCaptions() {
  return (
    <>
      <div className="auth-scene-copy">
        {PROCESS.map(({ title, copy }, index) => (
          <p
            key={title}
            className="auth-scene-line"
            style={{ animationDelay: `${index * 3}s` }}
          >
            <span className="auth-scene-line-title">{title}</span>
            <span className="auth-scene-line-copy">{copy}</span>
          </p>
        ))}
      </div>
      <div className="auth-scene-track" aria-hidden>
        {PROCESS.map(({ title }, index) => (
          <span
            key={title}
            className="auth-scene-seg"
            style={{ animationDelay: `${index * 3}s` }}
          />
        ))}
      </div>
    </>
  );
}

function SceneLabel({ children }: { children: ReactNode }) {
  return (
    <p className="auth-scene-label">
      <span className="auth-live-dot" aria-hidden />
      {children}
    </p>
  );
}

/** Animated operations scene for the sign-in hero. */
export function AuthShowcase() {
  return (
    <div className="mt-4 max-w-xl 2xl:max-w-2xl">
      <SceneLabel>How the station runs</SceneLabel>
      <div className="mt-2.5">
        <StationScene />
        <SceneCaptions />
      </div>
    </div>
  );
}

/** Same scene for small screens, where the hero panel is hidden. */
export function AuthMobileShowcase() {
  return (
    <section className="auth-scene-mobile lg:hidden" aria-label="How the station runs">
      <SceneLabel>Built for the station</SceneLabel>
      <div className="mt-2.5">
        <StationScene />
        <SceneCaptions />
      </div>
    </section>
  );
}
