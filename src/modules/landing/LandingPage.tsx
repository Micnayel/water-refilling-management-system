import { useEffect } from "react";
import { CtaSection } from "./CtaSection";
import { FeatureSection } from "./FeatureSection";
import { HeroSection } from "./HeroSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";
import { ShowcaseSection } from "./ShowcaseSection";
import "./landing.css";

const TITLE = "Smart Water Refilling Station — Smart water delivery, made simple";
const DESCRIPTION =
  "Subscribe to scheduled water refills, enjoy free delivery, and track every order from placement to doorstep.";

/** Public marketing page for the smart water delivery ecosystem. */
export function LandingPage() {
  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector('meta[name="description"]');
    const previousDescription = description?.getAttribute("content") ?? null;

    document.title = TITLE;
    if (description) description.setAttribute("content", DESCRIPTION);
    document.documentElement.classList.add("lp-html");

    return () => {
      document.title = previousTitle;
      if (description && previousDescription !== null) {
        description.setAttribute("content", previousDescription);
      }
      document.documentElement.classList.remove("lp-html");
    };
  }, []);

  return (
    <div className="lp-root">
      <a className="lp-skip" href="#landing-main">
        Skip to content
      </a>
      <LandingNav />
      <main id="landing-main">
        <HeroSection />
        <FeatureSection />
        <HowItWorksSection />
        <ShowcaseSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
