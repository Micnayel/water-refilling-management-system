import { DEMO_CUSTOMER_ID, DEMO_TODAY, plans } from "./data";
import type { Delivery, DemoCustomer, NotificationItem, Order, Plan, Subscription, WorkspaceRole } from "./types";
import type { useWorkspaceStore } from "./store";

type WorkspaceState = ReturnType<typeof useWorkspaceStore.getState>;

export interface CustomerMetrics {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  activeSubscription: Subscription | undefined;
  plan: Plan | undefined;
  upcomingDelivery: Delivery | undefined;
  activeDelivery: Delivery | undefined;
  spentCentavos: number;
  unread: number;
}

export function customerMetrics(state: WorkspaceState): CustomerMetrics {
  const orders = state.orders.filter((row) => row.customerId === DEMO_CUSTOMER_ID);
  const subscription = state.subscriptions.find((row) => row.customerId === DEMO_CUSTOMER_ID);
  const upcoming = state.deliveries
    .filter(
      (row) =>
        row.customerId === DEMO_CUSTOMER_ID &&
        (row.status === "Assigned" || row.status === "Preparing" || row.status === "Out for delivery"),
    )
    .sort((a, b) => a.sequence - b.sequence)[0];
  const paid = state.transactions.filter(
    (row) => row.customerId === DEMO_CUSTOMER_ID && row.status === "Paid",
  );
  return {
    totalOrders: orders.length,
    pendingOrders: orders.filter(
      (row) => row.status === "Pending" || row.status === "Confirmed" || row.status === "Preparing",
    ).length,
    completedOrders: orders.filter((row) => row.status === "Completed").length,
    activeSubscription: subscription,
    plan: subscription ? plans.find((row) => row.id === subscription.planId) : undefined,
    upcomingDelivery: upcoming,
    activeDelivery: upcoming,
    spentCentavos: paid.reduce((total, row) => total + row.amountCentavos, 0),
    unread: state.notifications.filter((row) => row.role === "customer" && !row.read).length,
  };
}

export interface AdminMetrics {
  totalCustomers: number;
  activeSubscriptions: number;
  todaysOrders: number;
  pendingOrders: number;
  ongoingDeliveries: number;
  completedDeliveries: number;
  revenueTodayCentavos: number;
  revenueWeekCentavos: number;
  ordersTodayCount: number;
  lowStock: number;
  unread: number;
}

export function adminMetrics(state: WorkspaceState): AdminMetrics {
  const todaysOrders = state.orders.filter((row) => row.scheduledDate === DEMO_TODAY);
  const todayRevenue = state.transactions
    .filter((row) => row.status === "Paid" && row.date.slice(0, 10) === DEMO_TODAY)
    .reduce((total, row) => total + row.amountCentavos, 0);
  return {
    totalCustomers: state.customers.filter((row) => row.status === "active").length,
    activeSubscriptions: state.subscriptions.filter((row) => row.status === "active").length,
    todaysOrders: todaysOrders.length,
    pendingOrders: state.orders.filter(
      (row) => row.status === "Pending" || row.status === "Confirmed",
    ).length,
    ongoingDeliveries: state.deliveries.filter(
      (row) =>
        row.status === "Assigned" || row.status === "Preparing" || row.status === "Out for delivery",
    ).length,
    completedDeliveries: state.deliveries.filter((row) => row.status === "Delivered").length,
    revenueTodayCentavos: todayRevenue,
    revenueWeekCentavos: state.revenue.reduce((total, row) => total + row.revenueCentavos, 0),
    ordersTodayCount: state.revenue.at(-1)?.orders ?? 0,
    lowStock: state.inventory.filter((row) => row.full < row.reorder).length,
    unread: state.notifications.filter((row) => row.role === "admin" && !row.read).length,
  };
}

export function notificationsFor(state: WorkspaceState, role: WorkspaceRole): NotificationItem[] {
  return state.notifications
    .filter((row) => row.role === role)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function unreadCount(state: WorkspaceState, role: WorkspaceRole): number {
  return state.notifications.filter((row) => row.role === role && !row.read).length;
}

export function planFor(state: WorkspaceState, planId: string | undefined): Plan | undefined {
  return state.plans.find((row) => row.id === planId);
}

export function customerFor(state: WorkspaceState, id: string): DemoCustomer | undefined {
  return state.customers.find((row) => row.id === id);
}

export function orderFor(state: WorkspaceState, id: string): Order | undefined {
  return state.orders.find((row) => row.id === id || row.ref === id);
}

export function deliveryFor(state: WorkspaceState, id: string): Delivery | undefined {
  return state.deliveries.find((row) => row.id === id || row.ref === id);
}

export function shortMoney(centavos: number): string {
  const pesos = centavos / 100;
  if (pesos >= 1_000_000) return `₱${(pesos / 1_000_000).toFixed(2)}M`;
  if (pesos >= 1_000) return `₱${(pesos / 1_000).toFixed(1)}k`;
  return `₱${pesos.toFixed(0)}`;
}

export {
  selectActiveDelivery,
  selectCustomerById,
  selectCustomerOrders,
  selectCustomerTransactions,
  selectDemoCustomer,
  selectDemoPlan,
  selectDemoSubscription,
  selectRiderDeliveries,
  selectRiderHistory,
} from "./store";
