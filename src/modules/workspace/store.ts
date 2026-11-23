import { create } from "zustand";
import { DEMO_CUSTOMER_ID, DEMO_RIDER_ID, customers as seedCustomers, deliveries as seedDeliveries, inventory as seedInventory, notifications as seedNotifications, orders as seedOrders, plans as seedPlans, registrations as seedRegistrations, revenue as seedRevenue, rider as seedRider, subscriptions as seedSubscriptions, transactions as seedTransactions } from "./data";
import type {
  Delivery,
  DeliveryStatus,
  DemoCustomer,
  InventoryRow,
  NotificationItem,
  Order,
  OrderStatus,
  Plan,
  PlaceOrderInput,
  Registration,
  RevenuePoint,
  RiderProfile,
  Subscription,
  Transaction,
  WorkspaceRole,
} from "./types";

let counter = 0;
function nextSuffix(): string {
  counter += 1;
  return `${Date.now().toString(36)}${counter}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export const DELIVERY_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  Assigned: ["Preparing"],
  Preparing: ["Out for delivery"],
  "Out for delivery": ["Delivered", "Failed delivery"],
  Delivered: [],
  "Failed delivery": [],
};

interface WorkspaceState {
  customers: DemoCustomer[];
  orders: Order[];
  deliveries: Delivery[];
  subscriptions: Subscription[];
  transactions: Transaction[];
  notifications: NotificationItem[];
  inventory: InventoryRow[];
  registrations: Registration[];
  revenue: RevenuePoint[];
  plans: Plan[];
  rider: RiderProfile;

  placeOrder: (input: PlaceOrderInput) => Order;
  confirmOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  setSubscriptionStatus: (status: Subscription["status"]) => void;
  setSubscriptionStatusById: (subscriptionId: string, status: Subscription["status"]) => void;
  skipNextDelivery: () => void;
  changePlan: (planId: string) => void;
  updateDeliveryStatus: (deliveryId: string, status: DeliveryStatus, note?: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (role: WorkspaceRole) => void;
  updateCustomerProfile: (patch: Partial<Pick<DemoCustomer, "name" | "email" | "contact" | "address" | "barangay">>) => void;
  updateRiderProfile: (patch: Partial<Pick<RiderProfile, "name" | "email" | "contact" | "zone" | "vehicle" | "shift" | "status">>) => void;
  approveRegistration: (id: string) => void;
}

const demoCustomer = seedCustomers.find((row) => row.id === DEMO_CUSTOMER_ID) ?? seedCustomers[0]!;
const demoPlan = seedPlans[1] ?? seedPlans[0]!;

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  customers: seedCustomers,
  orders: seedOrders,
  deliveries: seedDeliveries,
  subscriptions: seedSubscriptions,
  transactions: seedTransactions,
  notifications: seedNotifications,
  inventory: seedInventory,
  registrations: seedRegistrations,
  revenue: seedRevenue,
  plans: seedPlans,
  rider: seedRider,

  placeOrder: (input) => {
    const suffix = nextSuffix();
    const state = get();
    const subscription = state.subscriptions.find(
      (row) => row.customerId === demoCustomer.id && row.status === "active",
    );
    const ref = `WR-${1050 + state.orders.length}`;
    const amountCentavos = Math.round((input.jugs * 5500) / 1);
    const riderName = state.rider.name;
    const order: Order = {
      id: `ord-${suffix}`,
      ref,
      customerId: demoCustomer.id,
      customerName: demoCustomer.name,
      area: demoCustomer.barangay,
      address: input.address || demoCustomer.address,
      jugs: input.jugs,
      amountCentavos,
      status: "Pending",
      placedAt: nowIso(),
      scheduledDate: input.scheduledDate,
      scheduledWindow: input.scheduledWindow,
      payment: input.payment,
      notes: input.notes,
      riderName,
      timeline: [
        {
          status: "Pending",
          at: nowIso(),
          note: subscription
            ? `Placed from the ${demoPlan.name} subscription.`
            : "Placed from the customer portal.",
        },
      ],
    };
    const delivery: Delivery = {
      id: `dlv-${suffix}`,
      ref: `DLV-${520 + state.deliveries.length}`,
      orderId: order.id,
      customerId: demoCustomer.id,
      customerName: demoCustomer.name,
      area: demoCustomer.barangay,
      address: order.address,
      contact: demoCustomer.contact,
      window: input.scheduledWindow,
      jugs: input.jugs,
      amountCentavos,
      status: "Assigned",
      sequence: state.deliveries.length + 1,
      distanceKm: 2.4,
      etaMinutes: 20,
      rider: riderName,
      note: input.notes,
      updatedAt: nowIso(),
      timeline: [{ status: "Assigned", at: nowIso(), note: "Queued for the north route." }],
    };
    const transaction: Transaction = {
      id: `txn-${suffix}`,
      orderRef: ref,
      customerId: demoCustomer.id,
      customerName: demoCustomer.name,
      amountCentavos,
      method: input.payment,
      status: "Pending",
      date: nowIso(),
    };
    const notice: NotificationItem = {
      id: `ntf-${suffix}`,
      role: "customer",
      title: `Order ${ref} received`,
      body: `${input.jugs} gallons requested for ${input.scheduledDate} · ${input.scheduledWindow}.`,
      kind: "order",
      createdAt: nowIso(),
      read: false,
      href: "/portal/history",
    };
    const adminNotice: NotificationItem = { ...notice, role: "admin", title: `New order ${ref}`, body: `${demoCustomer.name} placed an order for ${input.jugs} gallons.`, href: "/overview/orders" };
    const riderNotice: NotificationItem = { ...notice, role: "rider", title: `New delivery assigned: ${delivery.ref}`, body: `${order.customerName} · ${order.address} · ${input.jugs} gallons.`, href: "/dispatch" };
    set({
      orders: [order, ...state.orders],
      deliveries: [delivery, ...state.deliveries],
      transactions: [transaction, ...state.transactions],
      notifications: [adminNotice, riderNotice, notice, ...state.notifications],
      subscriptions: subscription
        ? state.subscriptions.map((row) =>
            row.id === subscription.id ? { ...row, deliveriesThisMonth: row.deliveriesThisMonth + 1 } : row,
          )
        : state.subscriptions,
    });
    return order;
  },

  confirmOrder: (orderId) => {
    const state = get();
    const order = state.orders.find((row) => row.id === orderId);
    if (!order || order.status !== "Pending") return;
    const at = nowIso();
    set({
      orders: state.orders.map((row) =>
        row.id === orderId
          ? {
              ...row,
              status: "Confirmed",
              timeline: [...row.timeline, { status: "Confirmed", at, note: "Stock reserved by an administrator." }],
            }
          : row,
      ),
      notifications: [
        {
          id: `ntf-${nextSuffix()}`,
          role: "customer",
          title: `Order ${order.ref} confirmed`,
          body: `${order.jugs} gallons reserved for ${order.scheduledDate} · ${order.scheduledWindow}.`,
          kind: "order",
          createdAt: at,
          read: false,
          href: "/portal/history",
        },
        ...state.notifications,
      ],
    });
  },

  cancelOrder: (orderId) => {
    const state = get();
    const order = state.orders.find((row) => row.id === orderId);
    if (!order || (order.status !== "Pending" && order.status !== "Confirmed")) return;
    const at = nowIso();
    set({
      orders: state.orders.map((row) =>
        row.id === orderId
          ? {
              ...row,
              status: "Cancelled",
              timeline: [...row.timeline, { status: "Cancelled", at, note: "Cancelled by the customer." }],
            }
          : row,
      ),
      deliveries: state.deliveries.filter((row) => row.orderId !== orderId),
      notifications: [
        {
          id: `ntf-${nextSuffix()}`,
          role: "customer",
          title: `Order ${order.ref} cancelled`,
          body: "No stock was deducted. You can place a new order anytime.",
          kind: "order",
          createdAt: at,
          read: false,
          href: "/portal/history",
        },
        ...state.notifications,
      ],
    });
  },

  setSubscriptionStatus: (status) => {
    const state = get();
    const subscription = state.subscriptions.find((row) => row.customerId === DEMO_CUSTOMER_ID);
    if (!subscription) return;
    const at = nowIso();
    set({
      subscriptions: state.subscriptions.map((row) =>
        row.id === subscription.id ? { ...row, status } : row,
      ),
      notifications: [
        {
          id: `ntf-${nextSuffix()}`,
          role: "customer",
          title: status === "paused" ? "Subscription paused" : "Subscription resumed",
          body:
            status === "paused"
              ? "No deliveries will be scheduled until you resume."
              : `Next delivery is scheduled for ${subscription.nextDate}.`,
          kind: "billing",
          createdAt: at,
          read: false,
          href: "/portal/subscription",
        },
        ...state.notifications,
      ],
    });
  },

  setSubscriptionStatusById: (subscriptionId, status) => {
    set((state) => ({
      subscriptions: state.subscriptions.map((row) =>
        row.id === subscriptionId ? { ...row, status } : row,
      ),
    }));
  },

  skipNextDelivery: () => {
    const state = get();
    const subscription = state.subscriptions.find((row) => row.customerId === DEMO_CUSTOMER_ID);
    if (!subscription) return;
    const next = new Date(`${subscription.nextDate}T00:00:00`);
    next.setDate(next.getDate() + 7);
    const nextDate = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
    const at = nowIso();
    set({
      subscriptions: state.subscriptions.map((row) =>
        row.id === subscription.id ? { ...row, nextDate } : row,
      ),
      notifications: [
        {
          id: `ntf-${nextSuffix()}`,
          role: "customer",
          title: "Next delivery skipped",
          body: `Your next delivery moved to ${nextDate} · ${subscription.window}.`,
          kind: "billing",
          createdAt: at,
          read: false,
          href: "/portal/subscription",
        },
        ...state.notifications,
      ],
    });
  },

  changePlan: (planId) => {
    const state = get();
    const plan = state.plans.find((row) => row.id === planId);
    const subscription = state.subscriptions.find((row) => row.customerId === DEMO_CUSTOMER_ID);
    if (!plan || !subscription || plan.id === subscription.planId) return;
    const at = nowIso();
    set({
      subscriptions: state.subscriptions.map((row) =>
        row.id === subscription.id ? { ...row, planId } : row,
      ),
      notifications: [
        {
          id: `ntf-${nextSuffix()}`,
          role: "customer",
          title: `Plan changed to ${plan.name}`,
          body: `${plan.jugs} gallons · ${plan.cadence.toLowerCase()}. The new rate applies from the next delivery.`,
          kind: "billing",
          createdAt: at,
          read: false,
          href: "/portal/subscription",
        },
        ...state.notifications,
      ],
    });
  },

  updateDeliveryStatus: (deliveryId, status, note) => {
    const state = get();
    const delivery = state.deliveries.find((row) => row.id === deliveryId);
    if (!delivery) return;
    if (delivery.status === status) return;
    if (!DELIVERY_TRANSITIONS[delivery.status].includes(status)) return;

    const at = nowIso();
    const orderStatus: OrderStatus =
      status === "Delivered"
        ? "Completed"
        : status === "Failed delivery"
          ? "Failed delivery"
          : status === "Out for delivery"
            ? "Out for delivery"
            : "Preparing";

    set({
      deliveries: state.deliveries.map((row) =>
        row.id === deliveryId
          ? {
              ...row,
              status,
              etaMinutes: status === "Delivered" || status === "Failed delivery" ? 0 : row.etaMinutes,
              updatedAt: at,
              timeline: [...row.timeline, { status, at, note }],
            }
          : row,
      ),
      orders: state.orders.map((row) =>
        row.id === delivery.orderId
          ? {
              ...row,
              status: orderStatus,
              timeline: [...row.timeline, { status: orderStatus, at, note }],
            }
          : row,
      ),
      transactions:
        status === "Delivered"
          ? state.transactions.map((row) =>
              row.orderRef === state.orders.find((order) => order.id === delivery.orderId)?.ref
                ? { ...row, status: "Paid" }
                : row,
            )
          : state.transactions,
      notifications: [
        {
          id: `ntf-${nextSuffix()}`,
          role: "rider",
          title: `${delivery.ref} · ${status}`,
          body: `${delivery.customerName} · ${delivery.address}.`,
          kind: "delivery",
          createdAt: at,
          read: false,
          href: "/dispatch",
        },
        ...(status === "Delivered" || status === "Failed delivery"
          ? [
              {
                id: `ntf-${nextSuffix()}`,
                role: "customer" as const,
                title:
                  status === "Delivered"
                    ? `Delivery ${delivery.ref} completed`
                    : `Delivery ${delivery.ref} was unsuccessful`,
                body:
                  status === "Delivered"
                    ? `${delivery.jugs} gallons delivered. ${delivery.amountCentavos > 0 ? "Payment recorded." : ""}`
                    : "The rider could not complete this delivery. Support will follow up.",
                kind: "delivery" as const,
                createdAt: at,
                read: false,
                href: "/portal/tracking",
              },
            ]
          : []),
        ...state.notifications,
      ],
    });
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((row) => (row.id === id ? { ...row, read: true } : row)),
    }));
  },

  markAllNotificationsRead: (role) => {
    set((state) => ({
      notifications: state.notifications.map((row) => (row.role === role ? { ...row, read: true } : row)),
    }));
  },

  updateCustomerProfile: (patch) => {
    set((state) => ({
      customers: state.customers.map((row) =>
        row.id === DEMO_CUSTOMER_ID ? { ...row, ...patch } : row,
      ),
    }));
  },

  updateRiderProfile: (patch) => {
    set((state) => ({ rider: { ...state.rider, ...patch } }));
  },

  approveRegistration: (id) => {
    set((state) => ({
      registrations: state.registrations.map((row) =>
        row.id === id ? { ...row, status: "Approved" } : row,
      ),
    }));
  },
}));

export function selectDemoCustomer(state: WorkspaceState): DemoCustomer {
  return state.customers.find((row) => row.id === DEMO_CUSTOMER_ID) ?? state.customers[0]!;
}

export function selectDemoSubscription(state: WorkspaceState): Subscription | undefined {
  return state.subscriptions.find((row) => row.customerId === DEMO_CUSTOMER_ID);
}

export function selectDemoPlan(state: WorkspaceState, planId?: string): Plan | undefined {
  return state.plans.find((row) => row.id === planId);
}

export function selectCustomerOrders(state: WorkspaceState): Order[] {
  return state.orders
    .filter((row) => row.customerId === DEMO_CUSTOMER_ID)
    .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
}

export function selectCustomerTransactions(state: WorkspaceState): Transaction[] {
  return state.transactions
    .filter((row) => row.customerId === DEMO_CUSTOMER_ID)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function selectActiveDelivery(state: WorkspaceState): Delivery | undefined {
  return state.deliveries.find(
    (row) =>
      row.customerId === DEMO_CUSTOMER_ID &&
      (row.status === "Assigned" || row.status === "Preparing" || row.status === "Out for delivery"),
  );
}

export function selectRiderDeliveries(state: WorkspaceState): Delivery[] {
  return state.deliveries
    .filter((row) => row.status !== "Delivered" && row.status !== "Failed delivery")
    .sort((a, b) => a.sequence - b.sequence);
}

export function selectRiderHistory(state: WorkspaceState): Delivery[] {
  return state.deliveries
    .filter((row) => row.status === "Delivered" || row.status === "Failed delivery")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function selectCustomerById(state: WorkspaceState, id: string): DemoCustomer | undefined {
  return state.customers.find((row) => row.id === id);
}

export function selectRiderId(): string {
  return DEMO_RIDER_ID;
}
