import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useSessionStore } from "@/stores/session-store";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/welcome" element={<p>landing page</p>} />
        <Route path="/login" element={<p>sign in page</p>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <p>dashboard</p>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <p>customers</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    useSessionStore.setState({ user: null, status: "anonymous" });
  });

  it("sends anonymous visitors at the site root to the landing page", () => {
    renderAt("/");
    expect(screen.getByText("landing page")).toBeInTheDocument();
  });

  it("keeps the sign-in redirect for deep links", () => {
    renderAt("/customers");
    expect(screen.getByText("sign in page")).toBeInTheDocument();
  });
});
