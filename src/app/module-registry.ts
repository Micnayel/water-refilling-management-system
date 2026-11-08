export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  path: string;
  permission: string;
}

export const modules: ModuleDefinition[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Aggregated sales, clients, locations, and inventory.",
    path: "/",
    permission: "dashboard:view",
  },
  {
    id: "heat-map",
    name: "Heat Map",
    description: "Aggregated demand and customer density by area.",
    path: "/heat-map",
    permission: "heatmap:view",
  },
  {
    id: "inventory",
    name: "Inventory",
    description: "Gallon stock by state and stock movements.",
    path: "/inventory",
    permission: "inventory:view",
  },
  {
    id: "customers",
    name: "Customers",
    description: "Customer profiles, contact details, and locations.",
    path: "/customers",
    permission: "customers:view",
  },
  {
    id: "scheduling",
    name: "Scheduling",
    description: "Refill and delivery schedules through completion.",
    path: "/scheduling",
    permission: "scheduling:view",
  },
  {
    id: "reports",
    name: "Reports",
    description: "Period summaries and exports.",
    path: "/reports",
    permission: "reports:view",
  },
  {
    id: "audit",
    name: "Audit trail",
    description: "Opaque audit events for sensitive actions.",
    path: "/audit",
    permission: "audit:view",
  },
  {
    id: "notifications",
    name: "Notifications",
    description: "Scoped, non-sensitive operational notices.",
    path: "/notifications",
    permission: "notifications:view",
  },
  {
    id: "users",
    name: "User Management",
    description: "Users, roles, grants, and registration approval.",
    path: "/administration/users",
    permission: "admin:view",
  },
  {
    id: "settings",
    name: "Settings",
    description: "Per-user system template and system settings.",
    path: "/settings",
    permission: "settings:view",
  },
];
