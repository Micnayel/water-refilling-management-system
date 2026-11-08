export interface GrantDefinition {
  key: string;
  label: string;
}

export interface GrantGroup {
  label: string;
  grants: GrantDefinition[];
}

export const GRANT_GROUPS: GrantGroup[] = [
  {
    label: "Dashboard",
    grants: [
      { key: "dashboard:view", label: "View dashboard" },
      { key: "dashboard:export", label: "Export dashboard" },
    ],
  },
  {
    label: "Heat Map",
    grants: [
      { key: "heatmap:view", label: "View heat map" },
      { key: "heatmap:export", label: "Export heat map" },
    ],
  },
  {
    label: "Inventory",
    grants: [
      { key: "inventory:view", label: "View inventory" },
      { key: "inventory:add", label: "Add items" },
      { key: "inventory:edit", label: "Record movements" },
      { key: "inventory:delete", label: "Remove items" },
      { key: "inventory:export", label: "Export inventory" },
    ],
  },
  {
    label: "Customers",
    grants: [
      { key: "customers:view", label: "View customers" },
      { key: "customers:add", label: "Add customers" },
      { key: "customers:edit", label: "Edit customers" },
      { key: "customers:delete", label: "Archive customers" },
      { key: "customers:export", label: "Export customers" },
      { key: "customers:reveal", label: "Reveal sensitive data" },
    ],
  },
  {
    label: "Scheduling",
    grants: [
      { key: "scheduling:view", label: "View schedules" },
      { key: "scheduling:add", label: "Create schedules" },
      { key: "scheduling:edit", label: "Edit and complete schedules" },
      { key: "scheduling:delete", label: "Cancel schedules" },
      { key: "scheduling:export", label: "Export schedules" },
    ],
  },
  {
    label: "Reports and audit",
    grants: [
      { key: "reports:view", label: "View reports" },
      { key: "reports:export", label: "Export reports" },
      { key: "audit:view", label: "View audit trail" },
      { key: "notifications:view", label: "View notifications" },
    ],
  },
  {
    label: "Administration",
    grants: [
      { key: "admin:view", label: "View administration" },
      { key: "admin:add", label: "Create users and roles" },
      { key: "admin:edit", label: "Edit users and roles" },
      { key: "admin:delete", label: "Deactivate users" },
      { key: "admin:export", label: "Export users" },
    ],
  },
  {
    label: "Settings",
    grants: [
      { key: "settings:view", label: "Choose own template" },
      { key: "settings:edit", label: "Edit system settings" },
    ],
  },
];

export const ALL_GRANTS = GRANT_GROUPS.flatMap((group) => group.grants.map((grant) => grant.key));
