export type WorkspaceRole = "customer" | "admin" | "rider";

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Preparing"
  | "Out for delivery"
  | "Completed"
  | "Cancelled"
  | "Failed delivery";

export type DeliveryStatus =
  | "Assigned"
  | "Preparing"
  | "Out for delivery"
  | "Delivered"
  | "Failed delivery";

export type SubscriptionStatus = "active" | "paused";

export type NotificationKind = "order" | "delivery" | "billing" | "account" | "stock";

export interface Plan {
  id: string;
  name: string;
  jugs: number;
  priceCentavos: number;
  cadence: string;
  description: string;
}

export interface TimelineEntry {
  status: string;
  at: string;
  note?: string;
}

export interface DemoCustomer {
  id: string;
  code: string;
  name: string;
  email: string;
  contact: string;
  address: string;
  barangay: string;
  joinedAt: string;
  status: "active" | "inactive";
  notes: string;
}

export interface Order {
  id: string;
  ref: string;
  customerId: string;
  customerName: string;
  area: string;
  address: string;
  jugs: number;
  amountCentavos: number;
  status: OrderStatus;
  placedAt: string;
  scheduledDate: string;
  scheduledWindow: string;
  payment: "Cash on delivery" | "GCash";
  notes: string;
  riderName: string;
  timeline: TimelineEntry[];
}

export interface Delivery {
  id: string;
  ref: string;
  orderId: string;
  customerId: string;
  customerName: string;
  area: string;
  address: string;
  contact: string;
  window: string;
  jugs: number;
  amountCentavos: number;
  status: DeliveryStatus;
  sequence: number;
  distanceKm: number;
  etaMinutes: number;
  rider: string;
  note: string;
  updatedAt: string;
  timeline: TimelineEntry[];
}

export interface Subscription {
  id: string;
  customerId: string;
  customerName: string;
  planId: string;
  status: SubscriptionStatus;
  nextDate: string;
  window: string;
  startedAt: string;
  deliveriesThisMonth: number;
}

export interface Transaction {
  id: string;
  orderRef: string;
  customerId: string;
  customerName: string;
  amountCentavos: number;
  method: "Cash on delivery" | "GCash";
  status: "Paid" | "Pending";
  date: string;
}

export interface NotificationItem {
  id: string;
  role: WorkspaceRole;
  title: string;
  body: string;
  kind: NotificationKind;
  createdAt: string;
  read: boolean;
  href?: string;
}

export interface RiderProfile {
  id: string;
  name: string;
  email: string;
  contact: string;
  zone: string;
  vehicle: string;
  shift: string;
  status: "On duty" | "Off duty";
}

export interface InventoryRow {
  id: string;
  name: string;
  sku: string;
  full: number;
  empty: number;
  withCustomer: number;
  damaged: number;
  reorder: number;
}

export interface Registration {
  id: string;
  name: string;
  area: string;
  joinedAt: string;
  status: "Pending" | "Approved";
}

export interface RevenuePoint {
  label: string;
  revenueCentavos: number;
  orders: number;
}

export interface PlaceOrderInput {
  jugs: number;
  scheduledDate: string;
  scheduledWindow: string;
  payment: "Cash on delivery" | "GCash";
  notes: string;
  address: string;
}
