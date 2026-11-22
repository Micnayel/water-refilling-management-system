import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LandingPage } from "@/modules/landing";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/welcome"]}>
      <LandingPage />
    </MemoryRouter>,
  );
}

describe("LandingPage", () => {
  it("leads with the primary promise and supporting copy", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: /smart water delivery/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/experience a smarter way to order, subscribe, and track/i),
    ).toBeInTheDocument();
  });

  it("renders the six feature cards", () => {
    renderPage();
    for (const title of [
      "Customer subscription",
      "Free delivery",
      "Delivery tracking",
      "Order monitoring",
      "Easy access",
      "Hassle-free experience",
    ]) {
      expect(screen.getByRole("heading", { level: 3, name: title })).toBeInTheDocument();
    }
  });

  it("renders the five how-it-works steps in order", () => {
    renderPage();
    const steps = screen
      .getAllByRole("heading", { level: 3 })
      .filter((node) => node.closest(".lp-step-card") !== null)
      .map((node) => node.textContent);
    expect(steps).toEqual([
      "Create your account",
      "Choose your subscription",
      "Confirm your order",
      "Track your delivery",
      "Receive your water",
    ]);
  });

  it("labels simulated demonstrations so they cannot be mistaken for live data", () => {
    renderPage();
    expect(screen.getAllByText("Simulated preview")).toHaveLength(2);
    expect(screen.getByText("Simulated commercial")).toBeInTheDocument();
    expect(
      screen.getByText(/not a live delivery feed/i),
    ).toBeInTheDocument();
  });

  it("points primary actions at the auth routes", () => {
    renderPage();
    const getStarted = screen.getAllByRole("link", { name: /get started/i });
    expect(getStarted.length).toBeGreaterThan(0);
    for (const link of getStarted) {
      expect(link).toHaveAttribute("href", "/register");
    }
    expect(screen.getAllByRole("link", { name: /sign in/i })[0]).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
