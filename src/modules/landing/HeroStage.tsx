import { useEffect, useState } from "react";
import { NavigationIcon, PauseIcon, PlayIcon } from "@/components/ui/icons";
import { BottleArt, PhoneFrame, RouteArt, TruckArt } from "./art";
import { prefersReducedMotion } from "./motion";

const DURATION = 6200;

interface Scene {
  kicker: string;
  title: string;
  copy: string;
  art: React.ReactNode;
}

const ORDER_ROWS = [
  { id: "#A-2477", customer: "Barangay Villa", status: "Completed", tone: "done" },
  { id: "#A-2479", customer: "San Roque", status: "Preparing", tone: "work" },
  { id: "#A-2480", customer: "Cubao Heights", status: "Confirmed", tone: "info" },
  { id: "#A-2481", customer: "Kamuning", status: "Pending", tone: "idle" },
] as const;

const STATUS_STEPS = ["Pending", "Confirmed", "Preparing", "Out for delivery", "Completed"];

function NightScene() {
  return (
    <div className="lp-artboard lp-artboard--night">
      <span className="lp-night-aura" aria-hidden />
      <span className="lp-drop" aria-hidden />
      <span className="lp-splash lp-splash--1" aria-hidden />
      <span className="lp-splash lp-splash--2" aria-hidden />
      <span className="lp-splash lp-splash--3" aria-hidden />
      <BottleArt className="lp-s1-bottle" />
      <span className="lp-s1-reflection" aria-hidden />
    </div>
  );
}

function SubscribeScene() {
  return (
    <div className="lp-artboard lp-artboard--day">
      <span className="lp-day-aura" aria-hidden />
      <BottleArt className="lp-s2-bottle" />
      <PhoneFrame className="lp-s2-phone">
        <div className="lp-ui">
          <div className="lp-ui-head">
            <span className="lp-ui-logo">W</span>
            <span>WRMS</span>
          </div>
          <p className="lp-ui-eyebrow">Subscription</p>
          <p className="lp-ui-title">Weekly refill</p>
          <div className="lp-ui-plan">
            <span>2 jugs · every Monday</span>
            <strong>₱120</strong>
          </div>
          <div className="lp-ui-choice is-picked">
            <span className="lp-ui-radio" aria-hidden />
            <span>8:00 AM – 10:00 AM</span>
          </div>
          <div className="lp-ui-choice">
            <span className="lp-ui-radio" aria-hidden />
            <span>1:00 PM – 3:00 PM</span>
          </div>
          <span className="lp-ui-button">Confirm order</span>
        </div>
        <div className="lp-ui-success">
          <span className="lp-ui-check" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <p>Order confirmed</p>
          <span>Monday, 8:00 AM</span>
        </div>
      </PhoneFrame>
      <span className="lp-float-chip lp-float-chip--a">Next: Mon 8:00 AM</span>
    </div>
  );
}

function DeliveryScene() {
  return (
    <div className="lp-artboard lp-artboard--map">
      <div className="lp-map-grid" aria-hidden />
      <RouteArt id="lp-route-delivery" />
      <span className="lp-s3-truck">
        <TruckArt />
      </span>
      <span className="lp-s3-home">
        <span className="lp-s3-house" aria-hidden />
        Your home
      </span>
      <span className="lp-float-chip lp-float-chip--b">Free delivery · 8 min away</span>
    </div>
  );
}

function TrackingScene() {
  return (
    <div className="lp-artboard lp-artboard--track">
      <div className="lp-map-grid" aria-hidden />
      <PhoneFrame className="lp-s4-phone">
        <div className="lp-track-map">
          <RouteArt id="lp-route-tracking" />
          <span className="lp-track-pin" aria-hidden>
            <NavigationIcon className="size-3.5" />
          </span>
        </div>
        <div className="lp-track-card">
          <div className="lp-track-head">
            <span>Out for delivery</span>
            <strong>8 min</strong>
          </div>
          <div className="lp-track-steps" aria-hidden>
            <i className="is-done" />
            <i className="is-done" />
            <i className="is-live" />
            <i />
          </div>
          <span className="lp-track-note">Rider is 2 stops away</span>
        </div>
      </PhoneFrame>
      <span className="lp-float-chip lp-float-chip--c">Live tracking</span>
    </div>
  );
}

function MonitoringScene() {
  return (
    <div className="lp-artboard lp-artboard--day lp-artboard--orders">
      <span className="lp-day-aura" aria-hidden />
      <div className="lp-orders">
        <div className="lp-orders-head">
          <strong>Order monitoring</strong>
          <span>Today</span>
        </div>
        <div className="lp-order lp-order--active">
          <span className="lp-order-id">#A-2482</span>
          <span className="lp-order-who">Kamuning</span>
          <span className="lp-order-states">
            {STATUS_STEPS.map((status) => (
              <span key={status} className="lp-order-state">
                {status}
              </span>
            ))}
          </span>
          <span className="lp-order-bar" aria-hidden>
            <i />
          </span>
        </div>
        {ORDER_ROWS.map((row) => (
          <div key={row.id} className="lp-order lp-order--row">
            <span className="lp-order-id">{row.id}</span>
            <span className="lp-order-who">{row.customer}</span>
            <span className={`lp-pill lp-pill--${row.tone}`}>{row.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FinalScene() {
  return (
    <div className="lp-artboard lp-artboard--final">
      <span className="lp-final-ripple lp-final-ripple--1" aria-hidden />
      <span className="lp-final-ripple lp-final-ripple--2" aria-hidden />
      <span className="lp-final-ripple lp-final-ripple--3" aria-hidden />
      <BottleArt className="lp-s6-bottle" />
      <PhoneFrame className="lp-s6-phone">
        <div className="lp-s6-screen">
          <span className="lp-s6-mark">W</span>
          <p>WRMS</p>
          <span>Delivered</span>
          <strong>2 jugs</strong>
        </div>
      </PhoneFrame>
      <div className="lp-s6-copy">
        <p>Smart water delivery.</p>
        <p className="lp-s6-accent">Made simple.</p>
        <span>Order · Subscribe · Track · Delivered</span>
      </div>
    </div>
  );
}

const SCENES = [
  {
    kicker: "The water experience",
    title: "Filtered, sealed, and ready.",
    copy: "A five-stage purification line keeps every jug clean.",
    art: <NightScene />,
  },
  {
    kicker: "The smart system",
    title: "Your water. Your schedule. Your convenience.",
    copy: "Choose a refill plan once and the system keeps it booked.",
    art: <SubscribeScene />,
  },
  {
    kicker: "Free delivery",
    title: "Straight to your door.",
    copy: "No delivery charge and no missed stops.",
    art: <DeliveryScene />,
  },
  {
    kicker: "Delivery tracking",
    title: "Track your delivery in real time.",
    copy: "Follow the rider and the ETA from your phone.",
    art: <TrackingScene />,
  },
  {
    kicker: "Order monitoring",
    title: "Every order, one clear view.",
    copy: "Pending to completed, updated as it happens.",
    art: <MonitoringScene />,
  },
  {
    kicker: "The brand",
    title: "Smart water delivery. Made simple.",
    copy: "Order, subscribe, and track everything in one place.",
    art: <FinalScene />,
  },
] as const satisfies readonly Scene[];

/** Auto-playing product commercial with manual scene controls. */
export function HeroStage() {
  const reduced = prefersReducedMotion();
  const [index, setIndex] = useState(reduced ? 5 : 0);
  const [paused, setPaused] = useState(reduced);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % SCENES.length);
      setCycle((current) => current + 1);
    }, DURATION);
    return () => window.clearTimeout(timer);
  }, [index, paused]);

  const goTo = (next: number) => {
    setIndex(next);
    setCycle((current) => current + 1);
  };

  const scene = SCENES[index] ?? SCENES[0];

  return (
    <div className="lp-stage">
      <div className="lp-stage-bar">
        <span className="lp-stage-live">
          <span className="lp-live-dot" aria-hidden />
          Simulated commercial
        </span>
        <span className="lp-stage-count">
          {String(index + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
        </span>
      </div>

      <div className="lp-stage-viewport">
        <div key={index} className="lp-stage-scene">
          {scene.art}
        </div>
      </div>

      <div key={`meta-${index}`} className="lp-stage-meta" aria-live="off">
        <p className="lp-stage-kicker">{scene.kicker}</p>
        <p className="lp-stage-title">{scene.title}</p>
        <p className="lp-stage-copy">{scene.copy}</p>
      </div>

      <div className="lp-stage-foot">
        <div className="lp-dots" role="group" aria-label="Commercial scenes">
          {SCENES.map((item, dot) => (
            <button
              key={item.kicker}
              type="button"
              className={`lp-dot ${dot === index ? "is-active" : ""}`}
              aria-label={`Scene ${dot + 1}: ${item.kicker}`}
              aria-current={dot === index ? "true" : undefined}
              onClick={() => goTo(dot)}
            />
          ))}
        </div>
        <button
          type="button"
          className="lp-stage-toggle"
          onClick={() => setPaused((current) => !current)}
          aria-label={paused ? "Play commercial" : "Pause commercial"}
        >
          {paused ? <PlayIcon className="size-4" /> : <PauseIcon className="size-4" />}
          <span>{paused ? "Play" : "Pause"}</span>
        </button>
      </div>

      <div className="lp-stage-progress" aria-hidden>
        <span
          key={`progress-${index}-${cycle}`}
          style={{
            animationDuration: `${DURATION}ms`,
            animationPlayState: paused ? "paused" : "running",
          }}
        />
      </div>
    </div>
  );
}
