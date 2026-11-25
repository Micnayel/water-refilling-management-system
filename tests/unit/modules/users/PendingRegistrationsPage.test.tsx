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
  mutateAsync: vi.fn().mockResolvedValue({}),
};

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

  it("defaults approval to the pre-assigned Customer role", async () => {
    mockedPending.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          {
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
          },
        ],
      },
    } as unknown as ReturnType<typeof usePendingUsers>);

    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Approve" }));

    expect(screen.getByLabelText("Role")).toHaveValue("role-customer");

    await userEvent.click(screen.getByRole("button", { name: "Approve account" }));
    expect(approveMock.mutateAsync).toHaveBeenCalledWith({
      id: "user-1",
      values: { roleId: "role-customer", grants: customerRole.grants },
    });
  });

  it("falls back to the Customer role when a pending account has none", async () => {
    mockedPending.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          {
            id: "user-2",
            fullName: "Legacy Applicant",
            username: "legacy",
            email: "legacy@example.test",
            roleId: null,
            status: "pending",
            grants: [],
            template: "default",
            version: 1,
            createdAt: null,
          },
        ],
      },
    } as unknown as ReturnType<typeof usePendingUsers>);

    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Approve" }));

    expect(screen.getByLabelText("Role")).toHaveValue("role-customer");
  });
});
