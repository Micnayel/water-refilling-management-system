import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PendingRegistrationsPage } from "@/modules/users/PendingRegistrationsPage";
import {
  useApproveUser,
  usePendingUsers,
  useRejectUser,
  useRoles,
} from "@/modules/users/hooks";

vi.mock("@/modules/users/hooks", () => ({
  usePendingUsers: vi.fn(),
  useRoles: vi.fn(),
  useApproveUser: vi.fn(),
  useRejectUser: vi.fn(),
}));

vi.mock("@/hooks/use-permission", () => ({ usePermission: () => true }));

const mockedPending = vi.mocked(usePendingUsers);
const mockedRoles = vi.mocked(useRoles);
const mockedApprove = vi.mocked(useApproveUser);
const mockedReject = vi.mocked(useRejectUser);

const customerRole = {
  id: "role-customer",
  name: "Customer",
  description: "Front desk",
  grants: ["dashboard:view", "customers:view"],
  isSystem: false,
  version: 1,
};

const managerRole = {
  id: "role-manager",
  name: "Manager",
  description: "Manager",
  grants: ["dashboard:view"],
  isSystem: false,
  version: 1,
};

const approveMock = {
  isPending: false,
  variables: undefined as { id: string } | undefined,
  mutateAsync: vi.fn().mockResolvedValue({}),
};

function pendingUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    fullName: "Demo Applicant",
    username: "demo",
    email: "demo@example.test",
    roleId: "role-customer",
    status: "pending",
    grants: [],
    template: "default",
    version: 1,
    createdAt: null,
    ...overrides,
  };
}

function renderPage() {
  render(
    <MemoryRouter>
      <PendingRegistrationsPage />
    </MemoryRouter>,
  );
}

describe("PendingRegistrationsPage", () => {
  beforeEach(() => {
    mockedPending.mockReset();
    mockedRoles.mockReset();
    mockedApprove.mockReset();
    mockedReject.mockReset();
    approveMock.mutateAsync.mockClear();
    mockedApprove.mockReturnValue(
      approveMock as unknown as ReturnType<typeof useApproveUser>,
    );
    mockedReject.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof useRejectUser>);
    mockedRoles.mockReturnValue({
      data: { items: [customerRole, managerRole] },
    } as unknown as ReturnType<typeof useRoles>);
  });

  it("approves in one click with the pre-assigned Customer role", async () => {
    mockedPending.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { items: [pendingUser()] },
    } as unknown as ReturnType<typeof usePendingUsers>);

    renderPage();
    expect(screen.getByText("Customer")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Approve" }));

    expect(approveMock.mutateAsync).toHaveBeenCalledWith({ id: "user-1", values: {} });
    expect(screen.queryByLabelText("Role")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Add customers")).not.toBeInTheDocument();
  });

  it("shows Customer for a legacy pending account with no role", () => {
    mockedPending.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { items: [pendingUser({ id: "user-2", roleId: null })] },
    } as unknown as ReturnType<typeof usePendingUsers>);

    renderPage();
    expect(screen.getByText("Customer")).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    mockedPending.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { items: [] },
    } as unknown as ReturnType<typeof usePendingUsers>);

    renderPage();
    expect(screen.getByText("No pending registrations")).toBeInTheDocument();
  });
});
