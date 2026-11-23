import type { ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoginPage, RegisterPage } from "@/modules/auth";
import { LandingPage } from "@/modules/landing";
import { DashboardPage } from "@/modules/dashboard";
import { HeatMapPage } from "@/modules/heat-map";
import {
  InventoryDetailPage,
  InventoryEditPage,
  InventoryListPage,
  InventoryNewPage,
} from "@/modules/inventory";
import {
  CustomerDetailPage,
  CustomerEditPage,
  CustomerListPage,
  CustomerNewPage,
} from "@/modules/customers";
import {
  ScheduleDetailPage,
  ScheduleEditPage,
  ScheduleListPage,
  ScheduleNewPage,
} from "@/modules/scheduling";
import { ReportsPage } from "@/modules/reports";
import { AuditPage } from "@/modules/audit";
import { NotificationsPage } from "@/modules/notifications";
import {
  PendingRegistrationsPage,
  PermissionsPage,
  RolesPage,
  UserEditPage,
  UserListPage,
  UserNewPage,
} from "@/modules/users";
import { SettingsPage, SystemMaintenancePage } from "@/modules/settings";
import {
  AdminDeliveries,
  AdminOrders,
  AdminOverview,
  AdminSubscriptions,
  AdminTracking,
  CustomerDashboard,
  CustomerHistory,
  CustomerOrder,
  CustomerSubscription,
  CustomerTracking,
  PreviewOnlyRoute,
  ProfilePage,
  RiderCustomers,
  RiderDeliveries,
  RiderHistory,
  WorkspaceLayout,
  WorkspaceNotificationsPage,
} from "@/modules/workspace";
import { NotFoundPage } from "@/pages/NotFoundPage";

function guard(permission: string, element: ReactNode) {
  return <ProtectedRoute grant={permission}>{element}</ProtectedRoute>;
}

function workspace(role: "customer" | "admin" | "rider") {
  return (
    <ProtectedRoute>
      <PreviewOnlyRoute>
        <WorkspaceLayout role={role} />
      </PreviewOnlyRoute>
    </ProtectedRoute>
  );
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/welcome", element: <LandingPage /> },
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: guard("dashboard:view", <DashboardPage />) },
      { path: "heat-map", element: guard("heatmap:view", <HeatMapPage />) },

      { path: "inventory", element: guard("inventory:view", <InventoryListPage />) },
      { path: "inventory/new", element: guard("inventory:add", <InventoryNewPage />) },
      { path: "inventory/:id", element: guard("inventory:view", <InventoryDetailPage />) },
      { path: "inventory/:id/edit", element: guard("inventory:edit", <InventoryEditPage />) },

      { path: "customers", element: guard("customers:view", <CustomerListPage />) },
      { path: "customers/new", element: guard("customers:add", <CustomerNewPage />) },
      { path: "customers/:id", element: guard("customers:view", <CustomerDetailPage />) },
      { path: "customers/:id/edit", element: guard("customers:edit", <CustomerEditPage />) },

      { path: "scheduling", element: guard("scheduling:view", <ScheduleListPage />) },
      { path: "scheduling/new", element: guard("scheduling:add", <ScheduleNewPage />) },
      { path: "scheduling/:id", element: guard("scheduling:view", <ScheduleDetailPage />) },
      { path: "scheduling/:id/edit", element: guard("scheduling:edit", <ScheduleEditPage />) },

      { path: "reports", element: guard("reports:view", <ReportsPage />) },
      { path: "audit", element: guard("audit:view", <AuditPage />) },
      { path: "notifications", element: guard("notifications:view", <NotificationsPage />) },

      {
        path: "administration/users",
        element: guard("admin:view", <UserListPage />),
      },
      {
        path: "administration/users/pending",
        element: guard("admin:view", <PendingRegistrationsPage />),
      },
      {
        path: "administration/users/new",
        element: guard("admin:add", <UserNewPage />),
      },
      {
        path: "administration/users/:id/edit",
        element: guard("admin:edit", <UserEditPage />),
      },
      { path: "administration/roles", element: guard("admin:view", <RolesPage />) },
      {
        path: "administration/permissions",
        element: guard("admin:view", <PermissionsPage />),
      },
      {
        path: "administration/system-maintenance",
        element: guard("admin:view", <SystemMaintenancePage />),
      },

      { path: "settings", element: guard("settings:view", <SettingsPage />) },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    path: "/portal",
    element: workspace("customer"),
    children: [
      { index: true, element: <CustomerDashboard /> },
      { path: "subscription", element: <CustomerSubscription /> },
      { path: "order", element: <CustomerOrder /> },
      { path: "history", element: <CustomerHistory /> },
      { path: "tracking", element: <CustomerTracking /> },
      { path: "profile", element: <ProfilePage role="customer" /> },
      { path: "notifications", element: <WorkspaceNotificationsPage role="customer" /> },
      { path: "*", element: <Navigate to="/portal" replace /> },
    ],
  },
  {
    path: "/overview",
    element: workspace("admin"),
    children: [
      { index: true, element: <AdminOverview /> },
      { path: "orders", element: <AdminOrders /> },
      { path: "subscriptions", element: <AdminSubscriptions /> },
      { path: "deliveries", element: <AdminDeliveries /> },
      { path: "tracking", element: <AdminTracking /> },
      { path: "profile", element: <ProfilePage role="admin" /> },
      { path: "notifications", element: <WorkspaceNotificationsPage role="admin" /> },
      { path: "*", element: <Navigate to="/overview" replace /> },
    ],
  },
  {
    path: "/dispatch",
    element: workspace("rider"),
    children: [
      { index: true, element: <RiderDeliveries /> },
      { path: "history", element: <RiderHistory /> },
      { path: "customers", element: <RiderCustomers /> },
      { path: "notifications", element: <WorkspaceNotificationsPage role="rider" /> },
      { path: "profile", element: <ProfilePage role="rider" /> },
      { path: "*", element: <Navigate to="/dispatch" replace /> },
    ],
  },
]);
