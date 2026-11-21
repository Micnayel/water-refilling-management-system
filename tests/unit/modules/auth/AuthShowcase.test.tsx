import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthMobileShowcase, AuthShowcase } from "@/modules/auth/AuthShowcase";

const STEPS = [
  "Customer subscribes",
  "Staff monitor orders",
  "Deliveries are scheduled",
  "Gallon delivered",
];

describe("AuthShowcase", () => {
  it("tells the station process in order", () => {
    render(<AuthShowcase />);
    const rendered = screen.getAllByRole("listitem").map((item) => item.textContent ?? "");
    expect(rendered).toHaveLength(STEPS.length);
    STEPS.forEach((step, index) => {
      expect(rendered[index]).toContain(step);
    });
  });

  it("renders a character for every step", () => {
    const { container } = render(<AuthShowcase />);
    expect(container.querySelectorAll(".auth-char svg")).toHaveLength(STEPS.length);
    expect(container.querySelectorAll(".auth-step-badge")).toHaveLength(STEPS.length);
  });

  it("renders a compact version for small screens", () => {
    render(<AuthMobileShowcase />);
    for (const step of STEPS) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
  });
});
