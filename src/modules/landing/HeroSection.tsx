import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  CheckIcon,
  DropletIcon,
} from "@/components/ui/icons";
import { HeroStage } from "./HeroStage";

const POINTS = [
  "Weekly or one-time refills",
  "Free delivery to your door",
  "Live order and rider updates",
  "Cancel or reschedule anytime",
];

/** Cinematic opening: value proposition beside the auto-playing commercial. */
export function HeroSection() {
  return (
    <section className="lp-hero" id="top" aria-labelledby="lp-hero-title">
      <div className="lp-hero-bg" aria-hidden>
        <span className="lp-hero-orb lp-hero-orb--a" />
        <span className="lp-hero-orb lp-hero-orb--b" />
      </div>

      <div className="lp-shell lp-hero-inner">
        <div className="lp-hero-copy">
          <p className="lp-hero-badge">
            <span className="lp-hero-badge-dot">
              <DropletIcon className="size-3" />
            </span>
            Smart water delivery ecosystem
          </p>

          <h1 className="lp-hero-title" id="lp-hero-title">
            Smart water delivery.
            <span>Made simple.</span>
          </h1>

          <p className="lp-hero-lead">
            Experience a smarter way to order, subscribe, and track your water deliveries.
            Everything you need, right at your fingertips.
          </p>

          <div className="lp-hero-actions">
            <Link className="lp-btn lp-btn--primary" to="/register">
              Sign Up
              <ArrowRightIcon className="size-4" />
            </Link>
            <a className="lp-btn lp-btn--ghost" href="#features">
              Explore Features
            </a>
          </div>

          <ul className="lp-hero-points">
            {POINTS.map((point) => (
              <li key={point}>
                <CheckIcon className="size-3.5" />
                {point}
              </li>
            ))}
          </ul>

          <p className="lp-hero-footnote">
            Simulated product walkthrough. Sample data shown for demonstration only.
          </p>
        </div>

        <div className="lp-hero-stage">
          <HeroStage />
        </div>
      </div>
    </section>
  );
}
