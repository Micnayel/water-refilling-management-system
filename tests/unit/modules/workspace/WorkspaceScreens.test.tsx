import type { ReactElement } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { useWorkspaceStore } from "@/modules/workspace/store";
import { CustomerDashboard } from "@/modules/workspace/pages/customer/CustomerDashboard";
import { CustomerOrder } from "@/modules/workspace/pages/customer/CustomerOrder";
import { RiderDeliveries } from "@/modules/workspace/pages/rider/RiderDeliveries";
import { AdminOverview } from "@/modules/workspace/pages/admin/AdminOverview";
import { WorkspaceNotificationsPage } from "@/modules/workspace/components/NotificationsFeed";

const initialState = useWorkspaceStore.getState();

function renderInRouter(element: ReactElement) {
  return render(<MemoryRouter>{element}</MemoryRouter>);
}

describe("workspace screens", () => {
  beforeEach(() => {
    useWorkspaceStore.setState(initialState, true);
  });

  it("opens order details from the customer dashboard", async () => {
    const user = userEvent.setup();
    renderInRouter(<CustomerDashboard />);

    expect(screen.getByRole("heading", { level: 1, name: /maria/i })).toBeInTheDocument();
    expect(screen.getByText("Active subscription")).toBeInTheDocument();
    expect(screen.getByText("Recent order activity")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Details" })[0]!);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Order WR-/ })).toBeInTheDocument();
  });

  it("validates a new order before placing it", async () => {
    const user = userEvent.setup();
    renderInRouter(<CustomerOrder />);

    const gallons = screen.getByLabelText(/gallons/i);
    await user.clear(gallons);
    await user.type(gallons, "0");
    await user.click(screen.getByRole("button", { name: /place order/i }));
    expect(await screen.findByText("Order at least 1 gallon.")).toBeInTheDocument();

    await user.clear(gallons);
    await user.type(gallons, "2");
    await user.click(screen.getByRole("button", { name: /place order/i }));
    expect(await screen.findByRole("heading", { name: "Order placed" })).toBeInTheDocument();
    expect(useWorkspaceStore.getState().orders[0]?.jugs).toBe(2);
  });

  it("advances the next rider stop and removes it from the route", async () => {
    const user = userEvent.setup();
    renderInRouter(<RiderDeliveries />);

    expect(screen.getByText(/next stop/i)).toBeInTheDocument();
    const before = useWorkspaceStore.getState().deliveries.find((row) => row.id === "dlv-501");
    expect(before?.status).toBe("Out for delivery");

    await user.click(screen.getAllByRole("button", { name: /confirm delivery/i })[0]!);
    const after = useWorkspaceStore.getState().deliveries.find((row) => row.id === "dlv-501");
    expect(after?.status).toBe("Delivered");
  });

  it("approves a pending registration from the admin overview", async () => {
    const user = userEvent.setup();
    renderInRouter(<AdminOverview />);

    expect(screen.getByText("Sales and order analytics")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Approve" })[0]!);
    expect(useWorkspaceStore.getState().registrations[0]?.status).toBe("Approved");
  });

  it("marks every customer notification as read", async () => {
    const user = userEvent.setup();
    renderInRouter(<WorkspaceNotificationsPage role="customer" />);

    await user.click(screen.getByRole("button", { name: /mark all as read/i }));
    const unread = useWorkspaceStore
      .getState()
      .notifications.filter((row) => row.role === "customer" && !row.read);
    expect(unread).toHaveLength(0);
  });
});
