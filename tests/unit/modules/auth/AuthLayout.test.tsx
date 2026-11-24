import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthLayout } from "@/modules/auth/AuthLayout";

function renderLayout() {
  return render(
    <MemoryRouter>
      <AuthLayout title="Sign in" description="Use your staff account.">
        <p>form</p>
      </AuthLayout>
    </MemoryRouter>,
  );
}

describe("AuthLayout", () => {
  it("offers a way back to the landing page", () => {
    renderLayout();
    expect(
      screen.getByRole("link", { name: /back to landing page/i }),
    ).toHaveAttribute("href", "/welcome");
  });

  it("keeps the form content inside the auth card", () => {
    renderLayout();
    expect(screen.getByText("form")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Sign in" })).toBeInTheDocument();
  });
});
