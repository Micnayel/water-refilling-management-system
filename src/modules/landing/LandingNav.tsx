import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DropletIcon, MenuIcon, XIcon } from "@/components/ui/icons";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#showcase", label: "Showcase" },
  { href: "#contact", label: "Contact" },
];

/** Sticky marketing navigation with a compact mobile sheet. */
export function LandingNav() {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`lp-nav ${stuck ? "is-stuck" : ""}`}>
      <div className="lp-shell lp-nav-inner">
        <a className="lp-brand" href="#top" aria-label="WRMS home">
          <span className="lp-brand-mark">
            <DropletIcon className="size-4" />
          </span>
          <span>
            <span className="lp-brand-name">Smart Water</span>
            <span className="lp-brand-sub">Refilling Station</span>
          </span>
        </a>

        <nav className="lp-nav-links" aria-label="Landing sections">
          {LINKS.map((link) => (
            <a key={link.href} className="lp-nav-link" href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="lp-nav-actions">
          <Link className="lp-nav-signin" to="/login">
            Sign in
          </Link>
          <Link className="lp-btn lp-btn--primary lp-nav-cta" to="/register">
            Sign up
          </Link>
          <button
            type="button"
            className="lp-nav-toggle"
            aria-expanded={open}
            aria-controls="lp-mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <XIcon className="size-4" /> : <MenuIcon className="size-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="lp-mobile-nav" className="lp-shell" style={{ paddingBottom: 16 }}>
          <nav
            aria-label="Landing sections, mobile"
            style={{
              display: "grid",
              gap: 4,
              padding: 10,
              borderRadius: 16,
              border: "1px solid var(--lp-line)",
              background: "rgba(255,255,255,.96)",
              boxShadow: "var(--lp-shadow-md)",
            }}
          >
            {LINKS.map((link) => (
              <a
                key={link.href}
                className="lp-nav-link"
                href={link.href}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link className="lp-nav-link" to="/login" onClick={() => setOpen(false)}>
              Sign in
            </Link>
            <Link className="lp-nav-link" to="/register" onClick={() => setOpen(false)}>
              Sign up
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
