import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationsPage } from "@/modules/notifications/NotificationsPage";
import { useMarkNotificationRead, useNotifications } from "@/modules/notifications/hooks";

vi.mock("@/modules/notifications/hooks", () => ({
  useNotifications: vi.fn(),
  useMarkNotificationRead: vi.fn(),
}));

const mockedUseNotifications = vi.mocked(useNotifications);
const mockedMarkRead = vi.mocked(useMarkNotificationRead);

const markReadMock = {
  isPending: false,
  variables: undefined as string | undefined,
  mutateAsync: vi.fn().mockResolvedValue({ ok: true }),
};

function queryResult(overrides: Record<string, unknown>) {
  return {
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    data: { items: [] },
    ...overrides,
  } as unknown as ReturnType<typeof useNotifications>;
}

describe("NotificationsPage", () => {
  beforeEach(() => {
    mockedUseNotifications.mockReset();
    mockedMarkRead.mockReset();
    mockedMarkRead.mockReturnValue(markReadMock as unknown as ReturnType<typeof useMarkNotificationRead>);
    markReadMock.mutateAsync.mockClear();
  });

  it("shows an empty state", () => {
    mockedUseNotifications.mockReturnValue(queryResult({}));
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("No notifications")).toBeInTheDocument();
  });

  it("shows an error state", () => {
    mockedUseNotifications.mockReturnValue(queryResult({ isError: true, error: new Error("failed") }));
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("marks an unread notification as read", async () => {
    mockedUseNotifications.mockReturnValue(
      queryResult({
        data: {
          items: [
            {
              id: "note-1",
              kind: "info",
              message: "A schedule is due for review.",
              readAt: null,
              createdAt: "2026-01-05T03:04:00.000Z",
            },
          ],
        },
      }),
    );
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("A schedule is due for review.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Mark read" }));
    expect(markReadMock.mutateAsync).toHaveBeenCalledWith("note-1");
  });

  it("hides the read action for read notifications", () => {
    mockedUseNotifications.mockReturnValue(
      queryResult({
        data: {
          items: [
            {
              id: "note-2",
              kind: "info",
              message: "Already handled.",
              readAt: "2026-01-05T04:00:00.000Z",
              createdAt: "2026-01-05T03:04:00.000Z",
            },
          ],
        },
      }),
    );
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("button", { name: "Mark read" })).not.toBeInTheDocument();
  });
});
