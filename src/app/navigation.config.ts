import type { ComponentType, SVGProps } from "react";
import {
  BellIcon,
  CalendarIcon,
  ClipboardIcon,
  DashboardIcon,
  FileTextIcon,
  MapIcon,
  PackageIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/ui/icons";

export interface NavItem {
  label: string;
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  grant: string;
  end?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", to: "/", icon: DashboardIcon, grant: "dashboard:view", end: true },
      { label: "Heat Map", to: "/heat-map", icon: MapIcon, grant: "heatmap:view" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Inventory", to: "/inventory", icon: PackageIcon, grant: "inventory:view" },
      { label: "Customers", to: "/customers", icon: UsersIcon, grant: "customers:view" },
      { label: "Scheduling", to: "/scheduling", icon: CalendarIcon, grant: "scheduling:view" },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Reports", to: "/reports", icon: FileTextIcon, grant: "reports:view" },
      { label: "Audit trail", to: "/audit", icon: ClipboardIcon, grant: "audit:view" },
      { label: "Notifications", to: "/notifications", icon: BellIcon, grant: "notifications:view" },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "User management",
        to: "/administration/users",
        icon: ShieldIcon,
        grant: "admin:view",
      },
      {
        label: "Pending registrations",
        to: "/administration/users/pending",
        icon: UsersIcon,
        grant: "admin:view",
      },
      { label: "Roles", to: "/administration/roles", icon: ShieldIcon, grant: "admin:view" },
      {
        label: "Permissions",
        to: "/administration/permissions",
        icon: ShieldIcon,
        grant: "admin:view",
      },
      {
        label: "System maintenance",
        to: "/administration/system-maintenance",
        icon: SettingsIcon,
        grant: "admin:view",
      },
    ],
  },
  {
    label: "Workspace",
    items: [{ label: "Settings", to: "/settings", icon: SettingsIcon, grant: "settings:view" }],
  },
];
