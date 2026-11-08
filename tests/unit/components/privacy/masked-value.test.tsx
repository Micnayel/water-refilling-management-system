import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MaskedValue } from "@/components/privacy/masked-value";

describe("MaskedValue", () => {
  it("renders the masked placeholder and exposes a reveal control", async () => {
    const onReveal = vi.fn();
    render(
      <MaskedValue value="••••" revealed={false} canReveal onReveal={onReveal} />,
    );
    expect(screen.getByText("••••")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reveal sensitive value" }));
    expect(onReveal).toHaveBeenCalledTimes(1);
  });

  it("offers a hide control while revealed", async () => {
    const onHide = vi.fn();
    render(
      <MaskedValue value="Maria Santos" revealed canReveal onReveal={vi.fn()} onHide={onHide} />,
    );
    const button = screen.getByRole("button", { name: "Hide sensitive value" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(button);
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("shows no control when the user cannot reveal", () => {
    render(<MaskedValue value="••••" revealed={false} canReveal={false} onReveal={vi.fn()} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
