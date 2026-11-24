import { Link } from "react-router-dom";
import {
  DropletIcon,
  FacebookIcon,
  InstagramIcon,
  MailIcon,
} from "@/components/ui/icons";

const YEAR = new Date().getFullYear();

/** Marketing footer: brand, section links, contact, socials, copyright. */
export function LandingFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-shell">
        <div className="lp-footer-inner">
          <div id="about">
            <a className="lp-brand" href="#top" aria-label="Raintech Water Refilling Station home">
              <span className="lp-brand-mark">
                <DropletIcon className="size-4" />
              </span>
              <span>
                <span className="lp-brand-name">Raintech</span>
                <span className="lp-brand-sub">Water Refilling Station</span>
              </span>
            </a>
            <p className="lp-footer-blurb">
              A smart water delivery ecosystem: subscribe once, get free delivery, and
              follow every order from placement to doorstep.
            </p>
            <div className="lp-footer-socials">
              <a
                className="lp-footer-social"
                href="https://www.facebook.com"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Facebook (opens in a new tab)"
              >
                <FacebookIcon className="size-4" />
              </a>
              <a
                className="lp-footer-social"
                href="https://www.instagram.com"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Instagram (opens in a new tab)"
              >
                <InstagramIcon className="size-4" />
              </a>
              <a
                className="lp-footer-social"
                href="mailto:hello@wrms.example"
                aria-label="Email the station"
              >
                <MailIcon className="size-4" />
              </a>
            </div>
          </div>

          <div className="lp-footer-cols">
            <div className="lp-footer-col">
              <h2>Product</h2>
              <ul>
                <li>
                  <a href="#features">Features</a>
                </li>
                <li>
                  <a href="#how-it-works">How it works</a>
                </li>
                <li>
                  <a href="#showcase">Showcase</a>
                </li>
                <li>
                  <a href="#about">About us</a>
                </li>
              </ul>
            </div>

            <div className="lp-footer-col" id="contact">
              <h2>Contact</h2>
              <ul>
                <li>
                  <a href="mailto:hello@wrms.example">hello@wrms.example</a>
                </li>
                <li>
                  <p>Station support hours</p>
                </li>
                <li>
                  <p>Mon – Sat · 8:00 AM – 6:00 PM</p>
                </li>
                <li>
                  <p style={{ fontSize: "0.625rem", color: "rgba(255,255,255,.55)" }}>
                    Sample details for this demo.
                  </p>
                </li>
              </ul>
            </div>

            <div className="lp-footer-col">
              <h2>Account</h2>
              <ul>
                <li>
                  <Link to="/register">Sign up</Link>
                </li>
                <li>
                  <Link to="/login">Sign in</Link>
                </li>
                <li>
                  <a href="#top">Back to top</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <p>© {YEAR} Raintech Water Refilling Station. All rights reserved.</p>
          <p>Built for clean water and calmer deliveries.</p>
        </div>
      </div>
    </footer>
  );
}
