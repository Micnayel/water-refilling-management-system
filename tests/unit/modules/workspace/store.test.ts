import { beforeEach, describe, expect, it } from "vitest";
import { DEMO_CUSTOMER_ID, DEMO_TODAY } from "@/modules/workspace/data";
import { useWorkspaceStore } from "@/modules/workspace/store";
import { adminMetrics, customerMetrics } from "@/modules/workspace/selectors";

const initialState = useWorkspaceStore.getState();

function reset() {
  useWorkspaceStore.setState(initialState, true);
}

function demoOrder(ref: string) {
  return useWorkspaceStore.getState().orders.find((row) => row.ref === ref)!;
}

describe("workspace store", () => {
  beforeEach(reset);

  it("derives customer metrics from orders and the active subscription", () => {
    const metrics = customerMetrics(useWorkspaceStore.getState());
    expect(metrics.activeSubscription?.customerId).toBe(DEMO_CUSTOMER_ID);
    expect(metrics.totalOrders).toBeGreaterThan(0);
    expect(metrics.plan?.name).toBe("Family Flow");
    expect(metrics.completedOrders).toBeGreaterThan(0);
    expect(metrics.upcomingDelivery).toBeDefined();
  });

  it("places an order with a delivery, transaction, and notifications", () => {
    const before = useWorkspaceStore.getState();
    const order = before.placeOrder({
      jugs: 3,
      scheduledDate: DEMO_TODAY,
      scheduledWindow: "7:00 AM – 10:00 AM",
      payment: "GCash",
      notes: "Synthetic test order",
      address: "18 Mabini St., Brgy. San Roque",
    });
    const after = useWorkspaceStore.getState();

    expect(after.orders).toHaveLength(before.orders.length + 1);
    expect(after.deliveries[0]?.orderId).toBe(order.id);
    expect(after.deliveries[0]?.status).toBe("Assigned");
    expect(after.transactions[0]?.orderRef).toBe(order.ref);
    expect(after.transactions[0]?.status).toBe("Pending");
    expect(order.amountCentavos).toBe(3 * 5500);
    expect(after.notifications.filter((row) => row.title.includes(order.ref))).toHaveLength(2);
    expect(
      after.notifications.filter((row) => row.title.includes(after.deliveries[0]!.ref)),
    ).toHaveLength(1);
  });

  it("cancels only pending or confirmed orders and releases the delivery", () => {
    const pending = useWorkspaceStore.getState().orders.find((row) => row.status === "Pending")!;
    useWorkspaceStore.getState().cancelOrder(pending.id);
    expect(useWorkspaceStore.getState().orders.find((row) => row.id === pending.id)?.status).toBe(
      "Cancelled",
    );
    expect(useWorkspaceStore.getState().deliveries.some((row) => row.orderId === pending.id)).toBe(false);

    const completed = demoOrder("WR-1038");
    useWorkspaceStore.getState().cancelOrder(completed.id);
    expect(demoOrder("WR-1038").status).toBe("Completed");
  });

  it("confirms a pending order and notifies the customer", () => {
    const pending = useWorkspaceStore.getState().orders.find((row) => row.status === "Pending")!;
    useWorkspaceStore.getState().confirmOrder(pending.id);
    expect(useWorkspaceStore.getState().orders.find((row) => row.id === pending.id)?.status).toBe(
      "Confirmed",
    );
  });

  it("enforces delivery status order and updates the product order and payment", () => {
    const delivery = useWorkspaceStore.getState().deliveries.find((row) => row.id === "dlv-501")!;
    expect(delivery.status).toBe("Out for delivery");
    useWorkspaceStore.getState().updateDeliveryStatus(delivery.id, "Preparing");
    expect(useWorkspaceStore.getState().deliveries.find((row) => row.id === delivery.id)?.status).toBe(
      "Out for delivery",
    );

    useWorkspaceStore.getState().updateDeliveryStatus(delivery.id, "Delivered", "Handed over.");

    const updated = useWorkspaceStore.getState().deliveries.find((row) => row.id === delivery.id)!;
    const order = useWorkspaceStore.getState().orders.find((row) => row.id === delivery.orderId)!;
    const transaction = useWorkspaceStore
      .getState()
      .transactions.find((row) => row.orderRef === order.ref)!;
    expect(updated.status).toBe("Delivered");
    expect(order.status).toBe("Completed");
    expect(transaction.status).toBe("Paid");
  });

  it("pauses, resumes, and skips subscription deliveries", () => {
    const before = useWorkspaceStore.getState().subscriptions[0]!;
    useWorkspaceStore.getState().setSubscriptionStatus("paused");
    expect(useWorkspaceStore.getState().subscriptions[0]?.status).toBe("paused");

    useWorkspaceStore.getState().setSubscriptionStatus("active");
    expect(useWorkspaceStore.getState().subscriptions[0]?.status).toBe("active");

    useWorkspaceStore.getState().skipNextDelivery();
    const after = useWorkspaceStore.getState().subscriptions[0]!;
    const original = new Date(`${before.nextDate}T00:00:00`);
    const shifted = new Date(`${after.nextDate}T00:00:00`);
    expect(Math.round((shifted.getTime() - original.getTime()) / 86_400_000)).toBe(7);
  });

  it("changes the plan that drives the next delivery", () => {
    useWorkspaceStore.getState().changePlan("plan-office");
    const subscription = useWorkspaceStore.getState().subscriptions[0]!;
    expect(subscription.planId).toBe("plan-office");
  });

  it("marks notifications read per role without affecting other roles", () => {
    const customerUnread = useWorkspaceStore
      .getState()
      .notifications.filter((row) => row.role === "customer" && !row.read);
    expect(customerUnread.length).toBeGreaterThan(0);
    useWorkspaceStore.getState().markAllNotificationsRead("customer");
    const state = useWorkspaceStore.getState();
    expect(state.notifications.filter((row) => row.role === "customer" && !row.read)).toHaveLength(0);
    expect(state.notifications.some((row) => row.role === "admin" && !row.read)).toBe(true);
  });

  it("derives admin metrics and approves a pending registration", () => {
    const before = adminMetrics(useWorkspaceStore.getState());
    expect(before.totalCustomers).toBeGreaterThan(0);
    expect(before.ongoingDeliveries).toBeGreaterThan(0);

    const pending = useWorkspaceStore.getState().registrations.find((row) => row.status === "Pending")!;
    useWorkspaceStore.getState().approveRegistration(pending.id);
    expect(
      useWorkspaceStore.getState().registrations.find((row) => row.id === pending.id)?.status,
    ).toBe("Approved");
  });
});
