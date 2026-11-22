import type { ComponentType, ReactNode, SVGProps } from "react";
import {
  CheckIcon,
  ClipboardIcon,
  NavigationIcon,
  RefreshIcon,
  SmartphoneIcon,
  TruckIcon,
} from "@/components/ui/icons";
import { Reveal } from "./Reveal";
import { TruckArt } from "./art";

interface Feature {
  title: string;
  copy: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  art: ReactNode;
}

function CalendarArt() {
  return (
    <>
      <div className="lp-mini-cal" aria-hidden>
        {Array.from({ length: 28 }, (_, index) => (
          <i key={index} className={[9, 16, 23].includes(index) ? "is-on" : undefined} />
        ))}
      </div>
      <span className="lp-mini-cal-foot">Next: Monday</span>
    </>
  );
}

function TruckRouteArt() {
  return (
    <>
      <span className="lp-mini-road" aria-hidden />
      <span className="lp-mini-truck" aria-hidden>
        <TruckArt />
      </span>
      <span className="lp-mini-home" aria-hidden />
    </>
  );
}

function TrackingArt() {
  return (
    <div className="lp-mini-track" aria-hidden>
      <div className="lp-mini-track-line">
        <span className="lp-mini-pin">
          <NavigationIcon className="size-3" />
        </span>
      </div>
    </div>
  );
}

function StatusArt() {
  return (
    <div className="lp-mini-status" aria-hidden>
      {[0, 1, 2].map((row) => (
        <div key={row} className="lp-mini-status-row">
          <span className="lp-mini-status-dot" />
          <span />
        </div>
      ))}
    </div>
  );
}

function PhoneArt() {
  return (
    <div className="lp-mini-phone" aria-hidden>
      <i />
      <i />
      <i />
    </div>
  );
}

function FlowArt() {
  return (
    <div className="lp-mini-flow" aria-hidden>
      <div className="lp-mini-flow-chips">
        <i />
        <i />
        <i />
      </div>
      <span className="lp-mini-flow-check">
        <CheckIcon className="size-4" />
      </span>
    </div>
  );
}

const FEATURES: Feature[] = [
  {
    title: "Customer subscription",
    copy: "Subscribe to your water needs and enjoy convenient, scheduled deliveries without repeatedly placing orders.",
    icon: RefreshIcon,
    art: <CalendarArt />,
  },
  {
    title: "Free delivery",
    copy: "Enjoy convenient water delivery straight to your doorstep without additional delivery charges.",
    icon: TruckIcon,
    art: <TruckRouteArt />,
  },
  {
    title: "Delivery tracking",
    copy: "Know where your order is and monitor delivery progress through an easy-to-use tracking interface.",
    icon: NavigationIcon,
    art: <TrackingArt />,
  },
  {
    title: "Order monitoring",
    copy: "Monitor your orders from placement to completion with transparent order status updates.",
    icon: ClipboardIcon,
    art: <StatusArt />,
  },
  {
    title: "Easy access",
    copy: "Access your water refilling services anytime through a simple and accessible digital platform.",
    icon: SmartphoneIcon,
    art: <PhoneArt />,
  },
  {
    title: "Hassle-free experience",
    copy: "Spend less time managing water orders and more time enjoying convenience and peace of mind.",
    icon: CheckIcon,
    art: <FlowArt />,
  },
];

/** Six capability cards, each with a small CSS-only demonstration. */
export function FeatureSection() {
  return (
    <section className="lp-features" id="features" aria-labelledby="lp-features-title">
      <div className="lp-shell">
        <Reveal>
          <div className="lp-section-head lp-section-head--center">
            <p className="lp-eyebrow">Everything in one place</p>
            <h2 className="lp-section-title" id="lp-features-title">
              Built for everyday convenience.
            </h2>
            <p className="lp-section-copy">
              Subscriptions, free delivery, tracking, and order updates share one calm,
              considered experience for customers and station staff alike.
            </p>
          </div>
        </Reveal>

        <ul className="lp-features-grid" role="list">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <li key={feature.title} style={{ display: "flex" }}>
                <Reveal delay={index * 60} className="lp-feature">
                  <div className="lp-feature-head">
                    <span className="lp-feature-icon">
                      <Icon className="size-4" />
                    </span>
                    <h3 className="lp-feature-title">{feature.title}</h3>
                  </div>
                  <p className="lp-feature-copy">{feature.copy}</p>
                  <div className="lp-feature-art">{feature.art}</div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
