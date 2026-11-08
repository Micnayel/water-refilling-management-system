import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuditPage } from "@/modules/audit/AuditPage";
import { useAuditList } from "@/modules/audit/hooks";

vi.mock("@/modules/audit/hooks", () => ({ useAuditList: vi.fn() }));

const mockedUseAuditList = vi.mocked(useAuditList);

function queryResult(overrides: Record<string, unknown>) {
  return {
    isLoading: false,
    isError: false,
    error: null,
    items: [],
    hasNext: false,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useAuditList>;
}

describe("AuditPage", () => {
  beforeEach(() => {
    mockedUseAuditList.mockReset();
  });

  it("shows a loading state", () => {
    mockedUseAuditList.mockReturnValue(queryResult({ isLoading: true }));
    render(
      <MemoryRouter>
        <AuditPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Audit trail")).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    mockedUseAuditList.mockReturnValue(queryResult({}));
    render(
      <MemoryRouter>
        <AuditPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("No audit events")).toBeInTheDocument();
  });

  it("shows an error state with a retry action", () => {
    mockedUseAuditList.mockReturnValue(queryResult({ isError: true, error: new Error("failed") }));
    render(
      <MemoryRouter>
        <AuditPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("renders opaque audit rows", () => {
    mockedUseAuditList.mockReturnValue(
      queryResult({
        items: [
          {
            id: "audit-1",
            actorId: "actor-1",
            event: "CUSTOMER_UPDATE",
            entityType: "customer",
            entityId: "entity-1",
            detail: "status changed",
            createdAt: "2026-01-05T03:04:00.000Z",
          },
        ],
      }),
    );
    render(
      <MemoryRouter>
        <AuditPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("cell", { name: "CUSTOMER_UPDATE" })).toBeInTheDocument();
    expect(screen.getByText("entity-1")).toBeInTheDocument();
    expect(screen.getByText("actor-1")).toBeInTheDocument();
  });
});
