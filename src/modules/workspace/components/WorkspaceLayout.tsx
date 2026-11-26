import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BellIcon,
  CalendarIcon,
  ClipboardIcon,
  DashboardIcon,
  DropletIcon,
  FileTextIcon,
  InfoIcon,
  LogOutIcon,
  MapIcon,
  MenuIcon,
  PackageIcon,
  SettingsIcon,
  ShieldIcon,
  TruckIcon,
  UsersIcon,
  XIcon,
} from "@/components/ui/icons";
import { brand } from "@/config/brand";
import { useLogoutMutation } from "@/modules/auth";
import { hasGrant, useSessionStore } from "@/stores/session-store";
import { initials } from "@/lib/utils";
import { SessionTimeout } from "@/components/session/SessionTimeout";
import { Toaster } from "@/components/ui/toaster";
import { useWorkspaceStore } from "../store";
import { DEMO_CUSTOMER_ID } from "../data";
import { unreadCount } from "../selectors";
import type { WorkspaceRole } from "../types";
import { RolesBadge } from "./ui";
import "../workspace.css";

interface WorkspaceNavItem {
  label: string;
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  end?: boolean;
  badge?: number;
  grant?: string;
}

interface WorkspaceNavGroup {
  label: string;
  items: WorkspaceNavItem[];
}

const roleMeta: Record<WorkspaceRole, { name: string; home: string; blurb: string }> = {
  customer: { name: "Customer portal", home: "/portal", blurb: "Orders, plans, and deliveries" },
  admin: { name: "Administrator", home: "/overview", blurb: "Operations and insights" },
  rider: { name: "Delivery personnel", home: "/dispatch", blurb: "Today's route and stops" },
};

const liveAdminGroups: WorkspaceNavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Overview", to: "/", icon: DashboardIcon, end: true, grant: "dashboard:view" },
      { label: "Heat Map", to: "/heat-map", icon: MapIcon, grant: "heatmap:view" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Customer Management", to: "/customers", icon: UsersIcon, grant: "customers:view" },
      { label: "Scheduling", to: "/scheduling", icon: CalendarIcon, grant: "scheduling:view" },
      { label: "Inventory Management", to: "/inventory", icon: PackageIcon, grant: "inventory:view" },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Reports and Analytics", to: "/reports", icon: FileTextIcon, grant: "reports:view" },
      { label: "Audit trail", to: "/audit", icon: ClipboardIcon, grant: "audit:view" },
      { label: "Notifications", to: "/notifications", icon: BellIcon, grant: "notifications:view" },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "User Management", to: "/administration/users", icon: ShieldIcon, grant: "admin:view" },
      {
        label: "Pending registrations",
        to: "/administration/users/pending",
        icon: UsersIcon,
        grant: "admin:view",
      },
      { label: "Roles", to: "/administration/roles", icon: ShieldIcon, grant: "admin:view" },
      { label: "System Settings", to: "/settings", icon: SettingsIcon, grant: "settings:view" },
    ],
  },
];

function useNavGroups(role: WorkspaceRole, sample: boolean): WorkspaceNavGroup[] {
  const unread = useWorkspaceStore((state) =>
    role === "admin" && !sample ? 0 : unreadCount(state, role),
  );

  if (role === "customer") {
    return [
      {
        label: "My water",
        items: [
          { label: "Dashboard", to: "/portal", icon: DashboardIcon, end: true },
          { label: "My Subscription", to: "/portal/subscription", icon: CalendarIcon },
          { label: "Place an Order", to: "/portal/order", icon: DropletIcon },
        ],
      },
      {
        label: "Activity",
        items: [
          { label: "Order History", to: "/portal/history", icon: ClipboardIcon },
          { label: "Delivery Tracking", to: "/portal/tracking", icon: TruckIcon },
          { label: "Notifications", to: "/portal/notifications", icon: BellIcon, badge: unread },
        ],
      },
      {
        label: "Account",
        items: [{ label: "My Profile", to: "/portal/profile", icon: UsersIcon }],
      },
    ];
  }

  if (role === "rider") {
    return [
      {
        label: "Route",
        items: [
          { label: "My Deliveries", to: "/dispatch", icon: TruckIcon, end: true },
          { label: "Delivery History", to: "/dispatch/history", icon: ClipboardIcon },
          { label: "Customer Information", to: "/dispatch/customers", icon: UsersIcon },
        ],
      },
      {
        label: "Account",
        items: [
          { label: "Notifications", to: "/dispatch/notifications", icon: BellIcon, badge: unread },
          { label: "My Profile", to: "/dispatch/profile", icon: UsersIcon },
        ],
      },
    ];
  }

  if (!sample) return liveAdminGroups;

  return [
    {
      label: "Overview",
      items: [
        { label: "Overview", to: "/overview", icon: DashboardIcon, end: true },
        { label: "Heat Map", to: "/heat-map", icon: MapIcon },
        { label: "Scheduling", to: "/scheduling", icon: CalendarIcon },
        { label: "Delivery Tracking", to: "/overview/tracking", icon: MapIcon },
      ],
    },
    {
      label: "Operations",
      items: [
        { label: "Customer Management", to: "/customers", icon: UsersIcon },
        { label: "Subscription Management", to: "/overview/subscriptions", icon: CalendarIcon },
        { label: "Order Management", to: "/overview/orders", icon: ClipboardIcon },
        { label: "Delivery Management", to: "/overview/deliveries", icon: TruckIcon },
        { label: "Inventory Management", to: "/inventory", icon: PackageIcon },
      ],
    },
    {
      label: "Administration",
      items: [
        { label: "Reports and Analytics", to: "/reports", icon: FileTextIcon },
        { label: "Audit trail", to: "/audit", icon: ClipboardIcon },
        { label: "Notifications", to: "/notifications", icon: BellIcon },
        { label: "User Management", to: "/administration/users", icon: ShieldIcon },
        { label: "Pending registrations", to: "/administration/users/pending", icon: UsersIcon },
        { label: "Roles", to: "/administration/roles", icon: ShieldIcon },
        { label: "System Settings", to: "/settings", icon: SettingsIcon },
      ],
    },
  ];
}

function NavBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="ws-nav-badge" aria-label={`${count} unread`}>
      {count > 9 ? "9+" : count}
    </span>
  );
}

function SidebarContent({
  role,
  sample,
  onNavigate,
}: {
  role: WorkspaceRole;
  sample: boolean;
  onNavigate?: () => void;
}) {
  const groups = useNavGroups(role, sample);
  const user = useSessionStore((state) => state.user);
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.grant || hasGrant(user, item.grant)),
    }))
    .filter((group) => group.items.length > 0);
  const home = role === "admin" && !sample ? "/" : roleMeta[role].home;
  const personaName = useWorkspaceStore((state) =>
    role === "customer"
      ? (state.customers.find((row) => row.id === DEMO_CUSTOMER_ID)?.name ?? "Maria Santos")
      : role === "rider"
        ? state.rider.name
        : null,
  );
  const displayName = personaName ?? user?.fullName ?? "User";
  const navigate = useNavigate();
  const logout = useLogoutMutation();

  const onLogout = async () => {
    try {
      await logout.mutateAsync();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="flex h-full flex-col">
      <Link to={home} className="ws-brand" onClick={onNavigate}>
        <span className="ws-brand-mark">
          <DropletIcon className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold tracking-tight text-white">
            {brand.shortName}
          </span>
          <RolesBadge role={role} />
        </span>
      </Link>

      <nav aria-label="Workspace navigation" className="ws-nav">
        {visibleGroups.map((group) => (
          <div key={group.label} className="ws-nav-group">
            <p className="ws-nav-label">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className="ws-nav-link"
                    onClick={onNavigate}
                  >
                    <Icon />
                    <span className="truncate">{item.label}</span>
                    <NavBadge count={item.badge ?? 0} />
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="ws-sidebar-foot">
        <div className="ws-sidebar-user">
          <span className="ws-avatar">{initials(displayName)}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-white">
              {displayName}
            </span>
            <span className="block truncate text-[0.625rem] text-white/55">{roleMeta[role].blurb}</span>
          </span>
          <button
            type="button"
            aria-label="Sign out"
            className="btn-reset ws-ghost-btn"
            onClick={() => void onLogout()}
          >
            <LogOutIcon className="size-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 px-1">
          {sample ? (
            <Link to="/" className="text-[0.625rem] text-white/55 transition-colors hover:text-white">
              Standard console
            </Link>
          ) : (
            <span className="text-[0.625rem] text-white/55">Live operations</span>
          )}
          <Link to="/welcome" className="text-[0.625rem] text-white/55 transition-colors hover:text-white">
            About
          </Link>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceLayout({
  role,
  sample = role !== "admin",
}: {
  role: WorkspaceRole;
  sample?: boolean;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const user = useSessionStore((state) => state.user);
  const unread = useWorkspaceStore((state) =>
    role === "admin" && !sample ? 0 : unreadCount(state, role),
  );
  const groups = useNavGroups(role, sample);
  const notificationsPath =
    role === "customer" ? "/portal/notifications" : role === "rider" ? "/dispatch/notifications" : "/notifications";
  const profilePath = role === "customer" ? "/portal/profile" : role === "rider" ? "/dispatch/profile" : "/settings";
  const roleLinks: Array<{ role: WorkspaceRole; label: string; to: string }> = [
    { role: "customer", label: "Customer", to: "/portal" },
    { role: "admin", label: "Admin", to: "/" },
    { role: "rider", label: "Delivery", to: "/dispatch" },
  ];
  const navigate = useNavigate();
  const logout = useLogoutMutation();

  useEffect(() => {
    if (!sample) return;
    const root = document.documentElement;
    const previousTheme = root.dataset.theme;
    const previousBs = root.dataset.bsTheme;
    root.dataset.theme = "default";
    root.dataset.bsTheme = "light";
    return () => {
      if (previousTheme) root.dataset.theme = previousTheme;
      else delete root.dataset.theme;
      if (previousBs) root.dataset.bsTheme = previousBs;
      else delete root.dataset.bsTheme;
    };
  }, [sample]);

  useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  const activeItem =
    groups
      .flatMap((group) => group.items)
      .filter((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)))
      .sort((a, b) => b.to.length - a.to.length)[0] ?? groups[0]?.items[0];

  const onLogout = async () => {
    try {
      await logout.mutateAsync();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="ws-root">
      <div className="ws-shell">
        <aside className="ws-sidebar">
          <SidebarContent role={role} sample={sample} />
        </aside>

        {drawerOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              aria-hidden="true"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="ws-sidebar is-drawer relative z-10 h-full w-[17rem] animate-pop-in">
              <div className="absolute right-2 top-3">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close navigation"
                  className="text-white/80 hover:text-white"
                  onClick={() => setDrawerOpen(false)}
                >
                  <XIcon />
                </Button>
              </div>
              <SidebarContent role={role} sample={sample} onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        ) : null}

        <div className="ws-main">
          <header className="ws-topbar">
            <button
              type="button"
              className="ws-icon-btn ws-mobile-bar"
              aria-label="Open navigation"
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon className="size-4" />
            </button>

            <div className="hidden min-w-0 flex-1 sm:block">
              <p className="truncate text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {roleMeta[role].name}
              </p>
              <p className="truncate text-sm font-semibold leading-tight">{activeItem?.label ?? "Workspace"}</p>
            </div>

            {sample ? (
              <span className="hidden items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-wider text-warning sm:inline-flex">
                <InfoIcon className="size-3" /> Sample records
              </span>
            ) : null}

            <div className="ws-role-switch" role="navigation" aria-label="Switch role view">
              {roleLinks.map((link) => (
                <NavLink key={link.role} to={link.to} end={link.role === "admin"}>
                  {link.label}
                </NavLink>
              ))}
            </div>

            <Link to={notificationsPath} className="ws-icon-btn" aria-label={`Notifications (${unread} unread)`}>
              <BellIcon className="size-4" />
              {unread > 0 ? <span className="ws-dot" /> : null}
            </Link>

            <div className="relative">
              <button
                type="button"
                className="btn-reset flex items-center gap-2 rounded-full border border-border bg-card p-0.5 pr-2 transition-colors hover:border-primary/40"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-[0.6875rem] font-semibold text-primary-foreground">
                  {initials(user?.fullName ?? roleMeta[role].name)}
                </span>
                <span className="hidden max-w-[9rem] truncate text-xs font-medium sm:block">
                  {user?.fullName ?? "User"}
                </span>
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-30 mt-2 w-60 animate-pop-in rounded-xl border border-border bg-card p-2 shadow-[var(--shadow-raised)]"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <div className="border-b border-border/70 p-1.5 pb-2">
                    <p className="truncate text-sm font-medium">{user?.fullName ?? "User"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user?.email ?? (sample ? "Sample workspace" : "Signed in")}
                    </p>
                  </div>
                  <div className="pt-1">
                    <Link
                      to={profilePath}
                      role="menuitem"
                      className="block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                      onClick={() => setMenuOpen(false)}
                    >
                      My profile
                    </Link>
                    <Link
                      to={notificationsPath}
                      role="menuitem"
                      className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                      onClick={() => setMenuOpen(false)}
                    >
                      Notifications
                      {unread > 0 ? <span className="ws-nav-badge">{unread}</span> : null}
                    </Link>
                    {sample ? (
                      <Link
                        to="/"
                        role="menuitem"
                        className="block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                        onClick={() => setMenuOpen(false)}
                      >
                        Standard console
                      </Link>
                    ) : null}
                    {!sample && role === "admin" ? (
                      <Link
                        to="/overview"
                        role="menuitem"
                        className="block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                        onClick={() => setMenuOpen(false)}
                      >
                        Sample workspace
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      role="menuitem"
                      className="btn-reset flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
                      onClick={() => void onLogout()}
                    >
                      <LogOutIcon className="size-4" /> Sign out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </header>

          <main id="workspace-content" className="ws-content">
            <div className="ws-page" key={location.pathname}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <div className="sr-only" aria-live="polite">
        {activeItem ? `Current page: ${activeItem.label}` : ""}
      </div>
      <SessionTimeout />
      <Toaster />
    </div>
  );
}
