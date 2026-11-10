/**
 * Synthetic records for preview mode. Every value is invented, and the
 * fixtures are only served when `VITE_PREVIEW_DATA=true`; the real API remains
 * the only source in normal operation. Keep the shapes in sync with the Zod
 * schemas in each module.
 */

const UUID = {
  customer: (n: number) => `c0000000-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`,
  item: (n: number) => `10000000-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`,
  schedule: (n: number) => `50000000-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`,
  user: (n: number) => `a0000000-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`,
  role: (n: number) => `70000000-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`,
  movement: (n: number) => `20000000-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`,
  audit: (n: number) => `90000000-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`,
  notification: (n: number) => `b0000000-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`,
};

const pad = (value: number) => String(value).padStart(2, "0");

function dateIso(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function timestamp(offsetDays: number, hour = 9, minute = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

const VIEW_ONLY = [
  "dashboard:view",
  "heatmap:view",
  "inventory:view",
  "customers:view",
  "scheduling:view",
  "reports:view",
  "audit:view",
  "notifications:view",
  "settings:view",
];

const EDITOR = [...VIEW_ONLY, "inventory:add", "inventory:edit", "customers:add", "customers:edit", "scheduling:add", "scheduling:edit", "reports:export"];

const ADMIN = [
  ...EDITOR,
  "inventory:delete",
  "customers:delete",
  "customers:reveal",
  "scheduling:delete",
  "audit:export",
  "settings:edit",
  "admin:view",
  "admin:add",
  "admin:edit",
  "admin:delete",
];

const AREAS = [
  { area: "Batasan Hills", latitude: 14.6856, longitude: 121.0951, count: 46 },
  { area: "Commonwealth", latitude: 14.7004, longitude: 121.0798, count: 38 },
  { area: "Fairview", latitude: 14.7355, longitude: 121.0601, count: 31 },
  { area: "Tandang Sora", latitude: 14.6901, longitude: 121.0402, count: 27 },
  { area: "Cubao", latitude: 14.6197, longitude: 121.0531, count: 24 },
  { area: "Diliman", latitude: 14.6551, longitude: 121.0456, count: 21 },
  { area: "Novaliches", latitude: 14.7298, longitude: 121.0311, count: 18 },
  { area: "Kamuning", latitude: 14.6302, longitude: 121.0362, count: 14 },
];

const customers = [
  { name: "Maria Santos", barangay: "Batasan Hills", address: "18 Sampaguita St., Batasan Hills", gallons: 4, status: "active" },
  { name: "Juan Dela Cruz", barangay: "Commonwealth", address: "221 Commonwealth Ave., Unit 4", gallons: 2, status: "active" },
  { name: "Ana Reyes", barangay: "Fairview", address: "7 Narra Lane, Fairview", gallons: 3, status: "active" },
  { name: "Paolo Mendoza", barangay: "Tandang Sora", address: "64 Tandang Sora Ave.", gallons: 1, status: "active" },
  { name: "Liza Fernandez", barangay: "Cubao", address: "12 Aurora Blvd., Cubao", gallons: 5, status: "active" },
  { name: "Mark Villanueva", barangay: "Diliman", address: "3 Maginhawa St., Diliman", gallons: 2, status: "active" },
  { name: "Grace Aquino", barangay: "Novaliches", address: "88 Quirino Hwy., Novaliches", gallons: 4, status: "active" },
  { name: "Ramon Bautista", barangay: "Kamuning", address: "31 Kamuning Rd.", gallons: 3, status: "active" },
  { name: "Cecilia Lim", barangay: "Batasan Hills", address: "9 Ipil St., Batasan Hills", gallons: 2, status: "active" },
  { name: "Eduardo Ramos", barangay: "Commonwealth", address: "45 Don Antonio Dr.", gallons: 1, status: "active" },
  { name: "Teresita Gomez", barangay: "Fairview", address: "6 Acacia Ct., Fairview", gallons: 0, status: "archived" },
  { name: "Benito Cruz", barangay: "Diliman", address: "102 Sikatuna Village", gallons: 0, status: "archived" },
];

const customerItems = customers.map((entry, index) => ({
  id: UUID.customer(index + 1),
  code: `CUS-${String(1041 + index).padStart(4, "0")}`,
  name: entry.name,
  contact: `0917 ${String(220 + index).padStart(3, "0")} ${String(4100 + index).slice(-4)}`,
  email: `customer${index + 1}@example.test`,
  address: entry.address,
  barangay: entry.barangay,
  latitude: null,
  longitude: null,
  gallonsOnHand: entry.gallons,
  status: entry.status,
  version: 2 + (index % 3),
  createdAt: timestamp(-(40 - index * 3), 10, 15),
  masked: true as const,
}));

const users = [
  { fullName: "Administrator", username: "admin", email: "admin@wrms.local", role: "Administrator", grants: ADMIN, status: "active" },
  { fullName: "Maria Dela Cruz", username: "mdelacruz", email: "maria@wrms.local", role: "Operations Manager", grants: EDITOR, status: "active" },
  { fullName: "Jose Ramos", username: "jramos", email: "jose@wrms.local", role: "Dispatch Staff", grants: VIEW_ONLY, status: "active" },
  { fullName: "Angelica Lim", username: "alim", email: "angelica@wrms.local", role: "Cashier", grants: VIEW_ONLY, status: "active" },
  { fullName: "Paolo Santos", username: "psantos", email: "paolo@wrms.local", role: "Dispatch Staff", grants: VIEW_ONLY, status: "active" },
  { fullName: "Rita Gomez", username: "rgomez", email: "rita@wrms.local", role: "Dispatch Staff", grants: VIEW_ONLY, status: "inactive" },
  { fullName: "Noel Bautista", username: "nbautista", email: "noel@wrms.local", role: "—", grants: [], status: "pending" },
  { fullName: "Carla Mendoza", username: "cmendoza", email: "carla@wrms.local", role: "—", grants: [], status: "pending" },
];

const roles = [
  { id: UUID.role(1), name: "Administrator", description: "Full access to every module and administration.", grants: ADMIN, isSystem: true, version: 2 },
  { id: UUID.role(2), name: "Operations Manager", description: "Runs daily operations, inventory, and customer records.", grants: EDITOR, isSystem: false, version: 3 },
  { id: UUID.role(3), name: "Dispatch Staff", description: "View schedules and record deliveries.", grants: VIEW_ONLY, isSystem: false, version: 2 },
  { id: UUID.role(4), name: "Cashier", description: "View-only access for counter sales and reports.", grants: VIEW_ONLY, isSystem: false, version: 1 },
];

const userItems = users.map((entry, index) => ({
  id: UUID.user(index + 1),
  username: entry.username,
  email: entry.email,
  fullName: entry.fullName,
  roleId: entry.role === "—" ? null : UUID.role(Math.max(1, roles.findIndex((role) => role.name === entry.role) + 1)),
  status: entry.status,
  grants: entry.grants,
  template: index % 2 === 0 ? "default" : "ocean",
  version: 3 + (index % 4),
  createdAt: timestamp(-(120 - index * 9), 8, 30),
}));

const inventory = [
  { name: "5-Gallon Round Slim", sku: "WTR-5G-SLIM", full: 420, empty: 186, withCustomer: 312, damaged: 12, reorder: 150, low: false },
  { name: "5-Gallon Round Standard", sku: "WTR-5G-RND", full: 96, empty: 64, withCustomer: 205, damaged: 8, reorder: 120, low: false },
  { name: "5-Gallon Square", sku: "WTR-5G-SQ", full: 42, empty: 30, withCustomer: 88, damaged: 4, reorder: 60, low: true },
  { name: "1-Gallon Bottle", sku: "WTR-1G", full: 210, empty: 90, withCustomer: 120, damaged: 6, reorder: 80, low: false },
  { name: "Seal Cap (box of 100)", sku: "SUP-CAP-100", full: 24, empty: 0, withCustomer: 0, damaged: 0, reorder: 30, low: true },
];

const inventoryItems = inventory.map((entry, index) => ({
  id: UUID.item(index + 1),
  name: entry.name,
  sku: entry.sku,
  gallonsFull: entry.full,
  gallonsEmpty: entry.empty,
  gallonsWithCustomer: entry.withCustomer,
  gallonsDamaged: entry.damaged,
  reorderLevel: entry.reorder,
  lowStock: entry.low,
  version: 5 + index,
  createdAt: timestamp(-(200 - index * 4), 9, 0),
}));

const movements = [
  { type: "in", quantity: 120, reason: "Refilling batch output" },
  { type: "deliver", quantity: 24, reason: "Completed delivery routes" },
  { type: "return", quantity: 18, reason: "Empty gallon pickup" },
  { type: "damaged", quantity: 3, reason: "Cracked during handling" },
  { type: "adjust", quantity: -2, reason: "Cycle count correction" },
  { type: "out", quantity: 6, reason: "Issued to walk-in customer" },
];

const movementItems = movements.map((entry, index) => ({
  id: UUID.movement(index + 1),
  itemId: UUID.item(1),
  type: entry.type,
  quantity: entry.quantity,
  reason: entry.reason,
  actorId: UUID.user(2),
  scheduleId: null,
  createdAt: timestamp(-(index + 1), 8 + index, 20),
}));

const scheduleSeed = [
  { customer: 0, staff: 2, type: "refill", recurrence: "weekly", day: 0, time: "08:30", status: "Out for delivery", gallons: 4, amount: 10000 },
  { customer: 1, staff: 4, type: "delivery", recurrence: "one-time", day: 0, time: "10:00", status: "Scheduled", gallons: 2, amount: 5000 },
  { customer: 2, staff: 2, type: "refill", recurrence: "monthly", day: 0, time: "13:30", status: "Completed", gallons: 3, amount: 7500 },
  { customer: 6, staff: 4, type: "delivery", recurrence: "one-time", day: 0, time: "16:00", status: "Scheduled", gallons: 2, amount: 5000 },
  { customer: 3, staff: 4, type: "delivery", recurrence: "one-time", day: 1, time: "09:15", status: "Scheduled", gallons: 1, amount: 2500 },
  { customer: 4, staff: 2, type: "refill", recurrence: "weekly", day: -1, time: "15:00", status: "Completed", gallons: 5, amount: 12500 },
  { customer: 5, staff: 4, type: "delivery", recurrence: "one-time", day: 2, time: "11:30", status: "Scheduled", gallons: 2, amount: 5000 },
  { customer: 6, staff: 2, type: "refill", recurrence: "monthly", day: -2, time: "08:00", status: "Cancelled", gallons: 4, amount: 10000 },
  { customer: 7, staff: 4, type: "delivery", recurrence: "one-time", day: -1, time: "16:45", status: "Completed", gallons: 3, amount: 7500 },
  { customer: 1, staff: 2, type: "refill", recurrence: "weekly", day: 3, time: "08:00", status: "Scheduled", gallons: 4, amount: 10000 },
  { customer: 2, staff: 4, type: "delivery", recurrence: "one-time", day: 4, time: "10:30", status: "Scheduled", gallons: 2, amount: 5000 },
  { customer: 5, staff: 2, type: "refill", recurrence: "monthly", day: 5, time: "14:00", status: "Scheduled", gallons: 3, amount: 7500 },
  { customer: 0, staff: 4, type: "delivery", recurrence: "one-time", day: 7, time: "09:00", status: "Scheduled", gallons: 1, amount: 2500 },
  { customer: 3, staff: 2, type: "refill", recurrence: "weekly", day: 9, time: "11:15", status: "Scheduled", gallons: 5, amount: 12500 },
  { customer: 7, staff: 4, type: "delivery", recurrence: "one-time", day: 11, time: "15:30", status: "Scheduled", gallons: 2, amount: 5000 },
  { customer: 4, staff: 2, type: "refill", recurrence: "monthly", day: 13, time: "08:45", status: "Scheduled", gallons: 4, amount: 10000 },
  { customer: 6, staff: 4, type: "delivery", recurrence: "one-time", day: 15, time: "13:00", status: "Scheduled", gallons: 3, amount: 7500 },
  { customer: 1, staff: 2, type: "refill", recurrence: "weekly", day: 17, time: "09:30", status: "Scheduled", gallons: 4, amount: 10000 },
  { customer: 5, staff: 4, type: "delivery", recurrence: "one-time", day: 20, time: "16:15", status: "Scheduled", gallons: 2, amount: 5000 },
  { customer: 2, staff: 2, type: "refill", recurrence: "weekly", day: -3, time: "10:00", status: "Completed", gallons: 3, amount: 7500 },
  { customer: 7, staff: 4, type: "delivery", recurrence: "one-time", day: -4, time: "14:30", status: "Completed", gallons: 2, amount: 5000 },
  { customer: 0, staff: 2, type: "refill", recurrence: "monthly", day: -5, time: "08:15", status: "Completed", gallons: 4, amount: 10000 },
  { customer: 3, staff: 4, type: "delivery", recurrence: "one-time", day: -6, time: "11:00", status: "Cancelled", gallons: 1, amount: 2500 },
  { customer: 6, staff: 2, type: "refill", recurrence: "weekly", day: -8, time: "15:45", status: "Completed", gallons: 5, amount: 12500 },
  { customer: 1, staff: 4, type: "delivery", recurrence: "one-time", day: -10, time: "09:45", status: "Completed", gallons: 2, amount: 5000 },
  { customer: 4, staff: 2, type: "refill", recurrence: "monthly", day: -12, time: "13:15", status: "Completed", gallons: 3, amount: 7500 },
  { customer: 5, staff: 4, type: "delivery", recurrence: "one-time", day: -14, time: "10:30", status: "Completed", gallons: 2, amount: 5000 },
  { customer: 2, staff: 2, type: "refill", recurrence: "weekly", day: -16, time: "08:30", status: "Completed", gallons: 4, amount: 10000 },
  { customer: 7, staff: 4, type: "delivery", recurrence: "one-time", day: -18, time: "16:00", status: "Completed", gallons: 1, amount: 2500 },
];

const scheduleItems = scheduleSeed.map((entry, index) => {
  const customer = customerItems[entry.customer];
  const staff = userItems[entry.staff];
  return {
    id: UUID.schedule(index + 1),
    customerId: customer?.id ?? UUID.customer(1),
    customerCode: customer?.code ?? "CUS-1041",
    customerName: customer?.name ?? "Maria Santos",
    assignedUserId: staff?.id ?? UUID.user(2),
    assignedUserName: staff?.fullName ?? "Maria Dela Cruz",
    type: entry.type,
    recurrence: entry.recurrence,
    scheduledDate: dateIso(entry.day),
    scheduledTime: entry.time,
    status: entry.status,
    gallons: entry.gallons,
    amountCentavos: entry.amount,
    notes: index % 3 === 0 ? "Leave empties by the gate." : "",
    version: 2 + (index % 3),
    completedAt: entry.status === "Completed" ? timestamp(entry.day, 17, 0) : null,
    createdAt: timestamp(entry.day - 2, 14, 0),
  };
});

const auditEvents = [
  { event: "AUTH_LOGIN", entityType: "session", detail: "Signed in successfully" },
  { event: "SCHEDULE_UPDATE", entityType: "schedule", detail: "Status changed to Out for delivery" },
  { event: "INVENTORY_UPDATE", entityType: "inventory_item", detail: "Stock movement recorded" },
  { event: "CUSTOMER_UPDATE", entityType: "customer", detail: "Contact details updated" },
  { event: "SETTINGS_UPDATE", entityType: "system_setting", detail: "Session timeout updated" },
  { event: "USER_CREATE", entityType: "user", detail: "Staff account created" },
  { event: "CUSTOMER_EXPORT", entityType: "customer", detail: "Masked export downloaded" },
  { event: "ACCESS", entityType: "customer", detail: "Sensitive fields revealed" },
  { event: "AUTH_LOGIN_FAILED", entityType: "session", detail: "Invalid credentials" },
  { event: "SCHEDULE_CREATE", entityType: "schedule", detail: "Recurring refill created" },
  { event: "INVENTORY_CREATE", entityType: "inventory_item", detail: "Supply item added" },
  { event: "AUTH_REGISTER", entityType: "user", detail: "Registration submitted for approval" },
].map((entry, index) => ({
  id: UUID.audit(index + 1),
  actorId: UUID.user(1 + (index % 5)),
  event: entry.event,
  entityType: entry.entityType,
  entityId: index % 4 === 0 ? null : UUID.customer(1 + (index % 8)),
  detail: entry.detail,
  createdAt: timestamp(0, 17 - index, 5),
}));

const notifications = [
  { kind: "schedule_due", message: "3 deliveries are due before noon.", read: false, hoursAgo: 1 },
  { kind: "low_stock", message: "5-Gallon Square is at 42 full gallons.", read: false, hoursAgo: 3 },
  { kind: "pending_registration", message: "A new registration is waiting for approval.", read: false, hoursAgo: 6 },
  { kind: "inventory", message: "Refilling batch 18 posted 120 new gallons.", read: true, hoursAgo: 26 },
  { kind: "system", message: "Scheduled maintenance completed successfully.", read: true, hoursAgo: 50 },
].map((entry, index) => ({
  id: UUID.notification(index + 1),
  kind: entry.kind,
  message: entry.message,
  readAt: entry.read ? timestamp(0, 8, 0) : null,
  createdAt: timestamp(0, 8, 0),
}));

const systemSettings = {
  items: [
    {
      key: "sessionTimeoutMinutes",
      value: "30",
      version: 3,
      updatedAt: timestamp(-4, 11, 0),
    },
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 20;
}

function page<T>(items: T[], input: Record<string, unknown>): { items: T[]; nextCursor: null } {
  const pageSize = Math.max(1, Math.min(100, numberValue(input.pageSize)));
  return { items: items.slice(0, pageSize), nextCursor: null };
}

function matches(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.trim().toLowerCase());
}

function reportSummary(from: string, to: string) {
  return {
    from,
    to,
    salesCentavos: 8_742_000,
    salesCount: 486,
    gallonsDelivered: 1_284,
    newCustomers: 37,
    schedulesByStatus: [
      { status: "Completed", count: 214 },
      { status: "Scheduled", count: 46 },
      { status: "Out for delivery", count: 12 },
      { status: "Cancelled", count: 9 },
    ],
  };
}

export function previewResponse(path: string, method: string, body: unknown): unknown {
  const [pathname = "", search = ""] = path.split("?");
  const query = new URLSearchParams(search);
  const input = isRecord(body) ? body : {};

  if (method === "GET" && pathname === "/dashboard/summary") {
    return {
      salesTodayCentavos: 486_000,
      salesTodayCount: 27,
      salesMonthCentavos: 8_742_000,
      salesMonthCount: 486,
      clientCount: 248,
      inventoryFull: 792,
      inventoryWithCustomer: 725,
      lowStockCount: 2,
      clientLocationStats: AREAS.map(({ area, count }) => ({ area, count })),
    };
  }

  if (method === "GET" && pathname === "/dashboard/map") {
    return {
      masked: true,
      points: AREAS.map(({ area, latitude, longitude, count }) => ({
        label: area,
        latitude,
        longitude,
        count,
      })),
    };
  }

  if (method === "POST" && pathname === "/heat-map/points") {
    const metric = text(input.metric);
    return {
      bucket: "barangay",
      minCellSize: 10,
      cells: AREAS.map(({ area, latitude, longitude, count }) => ({
        area,
        latitude,
        longitude,
        count: metric === "completed-deliveries" ? Math.round(count * 0.6) : count,
      })),
      suppressedCells: 3,
    };
  }

  if (method === "POST" && pathname === "/customers/query") {
    const status = text(input.status);
    const term = text(input.search);
    const filtered = customerItems.filter(
      (customer) =>
        (!status || customer.status === status) &&
        (!term || matches(`${customer.name} ${customer.code} ${customer.barangay}`, term)),
    );
    return page(filtered, input);
  }

  if (method === "GET" && pathname.startsWith("/customers/")) {
    const id = pathname.slice("/customers/".length);
    return customerItems.find((customer) => customer.id === id) ?? customerItems[0];
  }

  if (method === "POST" && pathname === "/inventory/query") {
    const lowStock = input.lowStock === true;
    const filtered = lowStock ? inventoryItems.filter((item) => item.lowStock) : inventoryItems;
    return page(filtered, input);
  }

  if (method === "GET" && pathname.endsWith("/movements")) {
    return { items: movementItems };
  }

  if (method === "GET" && pathname.startsWith("/inventory/")) {
    const id = pathname.slice("/inventory/".length);
    return inventoryItems.find((item) => item.id === id) ?? inventoryItems[0];
  }

  if (method === "POST" && pathname === "/schedules/query") {
    const status = text(input.status);
    const date = text(input.date);
    const from = text(input.from);
    const to = text(input.to);
    const filtered = scheduleItems.filter(
      (schedule) =>
        (!status || schedule.status === status) &&
        (!date || schedule.scheduledDate === date) &&
        (!from || schedule.scheduledDate >= from) &&
        (!to || schedule.scheduledDate <= to),
    );
    return page(filtered, input);
  }

  if (method === "GET" && pathname === "/schedules/assignees") {
    return {
      items: userItems
        .filter((user) => user.status === "active")
        .map((user) => ({ id: user.id, fullName: user.fullName })),
    };
  }

  if (method === "GET" && pathname.startsWith("/schedules/")) {
    const id = pathname.slice("/schedules/".length);
    return scheduleItems.find((schedule) => schedule.id === id) ?? scheduleItems[0];
  }

  if (method === "GET" && pathname === "/reports/summary") {
    return reportSummary(query.get("from") ?? dateIso(-29), query.get("to") ?? dateIso(0));
  }

  if (method === "POST" && pathname === "/audit/query") {
    const event = text(input.event);
    const filtered = event ? auditEvents.filter((entry) => entry.event === event) : auditEvents;
    return { items: filtered.slice(0, numberValue(input.pageSize)), nextCursor: null };
  }

  if (method === "GET" && pathname === "/notifications") {
    return { items: notifications };
  }

  if (method === "POST" && pathname === "/users/query") {
    const status = text(input.status);
    const term = text(input.search);
    const filtered = userItems.filter(
      (user) =>
        (!status || user.status === status) &&
        (!term || matches(`${user.fullName} ${user.username} ${user.email}`, term)),
    );
    return page(filtered, input);
  }

  if (method === "GET" && pathname === "/users/pending") {
    return {
      items: userItems.filter((user) => user.status === "pending"),
      nextCursor: null,
    };
  }

  if (method === "GET" && pathname === "/users") {
    return { items: userItems, nextCursor: null };
  }

  if (method === "GET" && pathname.startsWith("/users/")) {
    const id = pathname.slice("/users/".length);
    return userItems.find((user) => user.id === id) ?? userItems[0];
  }

  if (method === "GET" && pathname === "/roles") {
    return { items: roles };
  }

  if (method === "GET" && pathname === "/settings/preferences") {
    return { template: "default" };
  }

  if (method === "PUT" && pathname === "/settings/preferences") {
    return { template: text(input.template) || "default" };
  }

  if (method === "GET" && pathname === "/settings/system") {
    return systemSettings;
  }

  return undefined;
}
