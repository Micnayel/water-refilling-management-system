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
  it("narrates the station workflow in order", () => {
    render(<AuthShowcase />);
    const captions = screen.getAllByText((_, node) => node?.className === "auth-scene-line");
    expect(captions).toHaveLength(STEPS.length);
    STEPS.forEach((step, index) => {
      expect(captions[index]).toHaveTextContent(step);
    });
  });

  it("renders the animated scene and stage track", () => {
    const { container } = render(<AuthShowcase />);
    expect(container.querySelectorAll(".auth-scene-art")).toHaveLength(1);
    expect(container.querySelectorAll(".auth-scene-seg")).toHaveLength(STEPS.length);
    for (const layer of ["auth-scene-customer", "auth-scene-truck", "auth-scene-staff", "auth-scene-load"]) {
      expect(container.querySelectorAll(`.${layer}`)).toHaveLength(1);
    }
  });

  it("renders the same scene for small screens", () => {
    render(<AuthMobileShowcase />);
    expect(screen.getAllByText("Customer subscribes").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Gallon delivered").length).toBeGreaterThan(0);
  });
});
