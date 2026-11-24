import { Link } from "react-router-dom";
import { ArrowRightIcon, DropletIcon } from "@/components/ui/icons";

/** Closing conversion panel with animated ripples and floating droplets. */
export function CtaSection() {
  return (
    <section className="lp-cta" aria-labelledby="lp-cta-title">
      <div className="lp-cta-ripples" aria-hidden>
        <span className="lp-cta-ripple" />
        <span className="lp-cta-ripple" />
        <span className="lp-cta-ripple" />
        <span className="lp-cta-ripple" />
      </div>
      <div className="lp-cta-drops" aria-hidden>
        <span className="lp-cta-drop" />
        <span className="lp-cta-drop" />
        <span className="lp-cta-drop" />
        <span className="lp-cta-drop" />
      </div>

      <div className="lp-cta-inner">
        <p className="lp-cta-kicker">
          <DropletIcon className="size-3.5" />
          Your next refill is one tap away
        </p>
        <h2 className="lp-cta-title" id="lp-cta-title">
          Pure convenience.
          <br />
          Smarter delivery.
        </h2>
        <p className="lp-cta-copy">
          Your daily water needs, simplified through technology.
        </p>
        <div className="lp-cta-actions">
          <Link className="lp-btn lp-btn--light" to="/register">
            Sign up to get started
            <ArrowRightIcon className="size-4" />
          </Link>
          <a className="lp-btn lp-btn--outline-light" href="#features">
            Explore features
          </a>
        </div>
        <p className="lp-cta-note">
          Demonstration site. Ordering, tracking, and statuses shown here are simulated.
        </p>
      </div>
    </section>
  );
}
