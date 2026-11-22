import {
  CheckIcon,
  MapPinIcon,
  NavigationIcon,
} from "@/components/ui/icons";
import { PhoneFrame, RouteArt } from "./art";
import { Reveal } from "./Reveal";

const DASH_ORDERS = [
  { id: "#A-2482", who: "Kamuning", status: "Out for delivery", tone: "info" },
  { id: "#A-2481", who: "Cubao Heights", status: "Preparing", tone: "work" },
  { id: "#A-2480", who: "San Roque", status: "Confirmed", tone: "info" },
  { id: "#A-2479", who: "Villa Aurora", status: "Completed", tone: "done" },
];

const METRICS = [
  { value: "Today", label: "Order view" },
  { value: "5 stages", label: "Status clarity" },
  { value: "1 place", label: "Every delivery" },
];

function DashboardMock() {
  return (
    <div className="lp-window">
      <div className="lp-window-bar" aria-hidden>
        <i />
        <i />
        <i />
        <span>Station dashboard — preview</span>
      </div>
      <div className="lp-dash" aria-hidden>
        <div className="lp-dash-top">
          <div className="lp-dash-stat is-accent">
            <span>Orders today</span>
            <strong>18</strong>
          </div>
          <div className="lp-dash-stat">
            <span>Out for delivery</span>
            <strong>4</strong>
          </div>
          <div className="lp-dash-stat">
            <span>Jugs in stock</span>
            <strong>126</strong>
          </div>
        </div>
        <div className="lp-dash-body">
          <div className="lp-dash-side">
            <span className="lp-dash-nav is-active" />
            <span className="lp-dash-nav" />
            <span className="lp-dash-nav" />
            <span className="lp-dash-nav" />
            <span className="lp-dash-nav" />
          </div>
          <div className="lp-dash-orders">
            {DASH_ORDERS.map((order) => (
              <div key={order.id} className="lp-dash-order">
                <b>{order.id}</b>
                <em>{order.who}</em>
                <span className={`lp-pill lp-pill--${order.tone}`}>{order.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SubscriptionMock() {
  return (
    <PhoneFrame className="lp-phone--showcase">
      <div className="lp-phone-ui">
        <div className="lp-phone-ui-head">
          Subscription
          <span>Active</span>
        </div>
        <div className="lp-phone-plan">
          <strong>Weekly refill</strong>
          <span>2 jugs · every Monday</span>
          <em>₱120</em>
        </div>
        <div className="lp-phone-card">
          <strong>Next delivery</strong>
          <span>Monday · 8:00 AM – 10:00 AM</span>
        </div>
        <div className="lp-phone-card">
          <strong>Pause or skip</strong>
          <span>Reschedule any week in the app.</span>
        </div>
        <div className="lp-phone-card">
          <strong>Order history</strong>
          <span>12 completed refills this year.</span>
        </div>
      </div>
    </PhoneFrame>
  );
}

function TrackingMock() {
  return (
    <PhoneFrame className="lp-phone--showcase">
      <div className="lp-phone-ui">
        <div className="lp-phone-ui-head">
          Track order
          <span>8 min</span>
        </div>
        <div className="lp-phone-map">
          <RouteArt id="lp-showcase-route" />
          <span className="lp-track-pin">
            <NavigationIcon className="size-2.5" />
          </span>
        </div>
        <div className="lp-phone-card">
          <strong>Out for delivery</strong>
          <span>Rider is 2 stops away.</span>
        </div>
        <div className="lp-phone-pips" aria-hidden>
          <i className="is-done" />
          <i className="is-done" />
          <i className="is-live" />
          <i />
        </div>
        <div className="lp-phone-card">
          <strong>Delivering to</strong>
          <span>Kamuning, Quezon City</span>
        </div>
      </div>
    </PhoneFrame>
  );
}

/** Realistic dashboard and phone mockups, explicitly labelled as previews. */
export function ShowcaseSection() {
  return (
    <section className="lp-showcase" id="showcase" aria-labelledby="lp-showcase-title">
      <div className="lp-shell">
        <Reveal>
          <div className="lp-section-head">
            <p className="lp-eyebrow">Product showcase</p>
            <h2 className="lp-section-title" id="lp-showcase-title">
              One system for customers and the station.
            </h2>
            <p className="lp-section-copy">
              Subscription management, order history, delivery tracking, and status
              monitoring live in the same interface.
            </p>
          </div>
        </Reveal>

        <div className="lp-showcase-grid">
          <Reveal>
            <div className="lp-showcase-panel">
              <span className="lp-showcase-label">Simulated preview</span>
              <DashboardMock />
            </div>
          </Reveal>

          <div className="lp-showcase-side">
            <Reveal delay={90}>
              <div className="lp-showcase-panel">
                <span className="lp-showcase-label">Simulated preview</span>
                <div className="lp-showcase-phones">
                  <SubscriptionMock />
                  <TrackingMock />
                </div>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="lp-showcase-metrics">
                {METRICS.map((metric) => (
                  <div key={metric.label} className="lp-showcase-metric">
                    <strong>{metric.value}</strong>
                    <span>{metric.label}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={220}>
              <p
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  margin: 0,
                  fontSize: "0.6875rem",
                  lineHeight: 1.55,
                  color: "var(--lp-slate)",
                }}
              >
                <CheckIcon
                  className="size-3.5"
                  style={{ flex: "none", marginTop: 2, color: "#0e9c8a" }}
                />
                Demonstration only: names, figures, and tracking positions are sample
                data and are not a live delivery feed.
              </p>
            </Reveal>

            <Reveal delay={260}>
              <p
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  margin: 0,
                  fontSize: "0.6875rem",
                  color: "var(--lp-slate)",
                }}
              >
                <MapPinIcon className="size-3.5" style={{ color: "#0e6bb8" }} />
                Area names are illustrative and not customer addresses.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
