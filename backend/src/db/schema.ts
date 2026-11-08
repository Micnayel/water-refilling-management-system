import {
  boolean,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  roleId: varchar("role_id", { length: 36 }),
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  grants: text("grants").notNull().default("[]"),
  template: varchar("template", { length: 64 }).notNull().default("default"),
  version: int("version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const roles = mysqlTable("roles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  description: varchar("description", { length: 255 }).notNull().default(""),
  grants: text("grants").notNull().default("[]"),
  isSystem: boolean("is_system").notNull().default(false),
  version: int("version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const customers = mysqlTable("customers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  contact: varchar("contact", { length: 32 }).notNull().default(""),
  email: varchar("email", { length: 255 }).notNull().default(""),
  address: text("address").notNull(),
  barangay: varchar("barangay", { length: 120 }).notNull().default(""),
  latitude: varchar("latitude", { length: 24 }),
  longitude: varchar("longitude", { length: 24 }),
  gallonsOnHand: int("gallons_on_hand").notNull().default(0),
  status: varchar("status", { length: 16 }).notNull().default("active"),
  version: int("version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const inventoryItems = mysqlTable("inventory_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  sku: varchar("sku", { length: 48 }).notNull().unique(),
  gallonsFull: int("gallons_full").notNull().default(0),
  gallonsEmpty: int("gallons_empty").notNull().default(0),
  gallonsWithCustomer: int("gallons_with_customer").notNull().default(0),
  gallonsDamaged: int("gallons_damaged").notNull().default(0),
  reorderLevel: int("reorder_level").notNull().default(0),
  version: int("version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const stockMovements = mysqlTable("stock_movements", {
  id: varchar("id", { length: 36 }).primaryKey(),
  itemId: varchar("item_id", { length: 36 }).notNull(),
  type: varchar("type", { length: 16 }).notNull(),
  quantity: int("quantity").notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  actorId: varchar("actor_id", { length: 36 }).notNull(),
  scheduleId: varchar("schedule_id", { length: 36 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const schedules = mysqlTable("schedules", {
  id: varchar("id", { length: 36 }).primaryKey(),
  customerId: varchar("customer_id", { length: 36 }).notNull(),
  assignedUserId: varchar("assigned_user_id", { length: 36 }).notNull(),
  type: varchar("type", { length: 16 }).notNull().default("delivery"),
  recurrence: varchar("recurrence", { length: 16 }).notNull().default("one-time"),
  scheduledDate: varchar("scheduled_date", { length: 10 }).notNull(),
  scheduledTime: varchar("scheduled_time", { length: 5 }).notNull().default("09:00"),
  status: varchar("status", { length: 24 }).notNull().default("Scheduled"),
  gallons: int("gallons").notNull().default(1),
  amountCentavos: int("amount_centavos").notNull().default(0),
  notes: varchar("notes", { length: 500 }).notNull().default(""),
  version: int("version").notNull().default(1),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const sales = mysqlTable("sales", {
  id: varchar("id", { length: 36 }).primaryKey(),
  scheduleId: varchar("schedule_id", { length: 36 }).notNull().unique(),
  customerId: varchar("customer_id", { length: 36 }).notNull(),
  amountCentavos: int("amount_centavos").notNull(),
  gallons: int("gallons").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditEvents = mysqlTable("audit_events", {
  id: varchar("id", { length: 36 }).primaryKey(),
  actorId: varchar("actor_id", { length: 36 }),
  event: varchar("event", { length: 64 }).notNull(),
  entityType: varchar("entity_type", { length: 48 }).notNull(),
  entityId: varchar("entity_id", { length: 36 }),
  detail: varchar("detail", { length: 255 }).notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }),
  kind: varchar("kind", { length: 32 }).notNull().default("info"),
  message: varchar("message", { length: 255 }).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const systemSettings = mysqlTable("system_settings", {
  settingKey: varchar("setting_key", { length: 64 }).primaryKey(),
  value: varchar("value", { length: 255 }).notNull(),
  version: int("version").notNull().default(1),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});
