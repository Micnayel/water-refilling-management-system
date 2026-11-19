import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthMobileShowcase, AuthShowcase } from "@/modules/auth/AuthShowcase";

describe("AuthShowcase", () => {
  it("advertises the four station capabilities", () => {
    render(<AuthShowcase />);
    for (const title of ["Subscriptions", "Order monitoring", "Scheduling", "Delivering"]) {
      expect(screen.getAllByText(title).length).toBeGreaterThan(0);
    }
    expect(screen.getByText("Live dispatch view")).toBeInTheDocument();
  });

  it("shows the order stages in delivery order", () => {
    render(<AuthShowcase />);
    const stages = ["Placed", "Scheduled", "Out for delivery", "Delivered"];
    const rendered = screen.getAllByRole("listitem").map((item) => item.textContent?.trim());
    expect(rendered).toEqual(stages);
  });

  it("renders a compact version for small screens", () => {
    render(<AuthMobileShowcase />);
    expect(screen.getByText("Subscriptions")).toBeInTheDocument();
    expect(screen.getByText("Delivering")).toBeInTheDocument();
  });
});
