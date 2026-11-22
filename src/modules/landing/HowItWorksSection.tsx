import { Reveal } from "./Reveal";

const STEPS = [
  {
    title: "Create your account",
    copy: "Customers register and access their personal dashboard.",
  },
  {
    title: "Choose your subscription",
    copy: "Select a suitable water subscription or place an individual order.",
  },
  {
    title: "Confirm your order",
    copy: "Review and confirm the delivery request.",
  },
  {
    title: "Track your delivery",
    copy: "Monitor the order and delivery progress.",
  },
  {
    title: "Receive your water",
    copy: "Enjoy convenient delivery right at your doorstep.",
  },
];

/** Five-step scroll-revealed process timeline. */
export function HowItWorksSection() {
  return (
    <section className="lp-how" id="how-it-works" aria-labelledby="lp-how-title">
      <div className="lp-shell">
        <Reveal>
          <div className="lp-section-head">
            <p className="lp-eyebrow">How it works</p>
            <h2 className="lp-section-title" id="lp-how-title">
              From sign-up to doorstep in five steps.
            </h2>
            <p className="lp-section-copy">
              A clear path from first order to repeat subscription, with every stage
              visible to both the customer and the station.
            </p>
          </div>
        </Reveal>

        <ol className="lp-steps" style={{ listStyle: "none", margin: "42px 0 0", padding: 0 }}>
          {STEPS.map((step, index) => (
            <li key={step.title} style={{ display: "contents" }}>
              <Reveal delay={index * 80} className="lp-step">
                <span className="lp-step-num" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="lp-step-card">
                  <h3 className="lp-step-title">{step.title}</h3>
                  <p className="lp-step-copy">{step.copy}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
