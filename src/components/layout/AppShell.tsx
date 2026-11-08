import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { navigation, type NavItem } from "@/app/navigation.config";
import { brand } from "@/config/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DropletIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
} from "@/components/ui/icons";
import { Toaster } from "@/components/ui/toaster";
import { initials, cn } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";
import { hasGrant, useSessionStore } from "@/stores/session-store";
import { useUiStore } from "@/stores/ui-store";
import { useLogoutMutation } from "@/modules/auth";
import { SessionTimeout } from "@/components/session/SessionTimeout";

function NavEntry({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          isActive && "bg-accent font-medium text-accent-foreground",
        )
      }
    >
      <Icon className="size-4" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const user = useSessionStore((state) => state.user);
  return (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex items-center gap-2 border-b border-border px-3 py-3">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <DropletIcon className="size-4" />
        </span>
        {!collapsed ? (
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{brand.shortName}</span>
            <span className="block truncate text-xs text-muted-foreground">Management</span>
          </span>
        ) : null}
      </Link>
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto p-2">
        {navigation.map((group) => {
          const items = group.items.filter((item) => (user ? hasGrant(user, item.grant) : false));
          if (items.length === 0) return null;
          return (
            <div key={group.label} className="mb-3">
              {!collapsed ? (
                <p className="mb-1 px-2 text-[0.625rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
              ) : null}
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavEntry key={item.to} item={item} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>
      {!collapsed ? (
        <p className="border-t border-border p-3 text-xs text-muted-foreground">{brand.supportNote}</p>
      ) : null}
    </div>
  );
}

export function AppShell() {
  const user = useSessionStore((state) => state.user);
  const { sidebarCollapsed, toggleSidebar, mobileNavOpen, setMobileNav } = useUiStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useLogoutMutation();
  const canSeeNotifications = usePermission("notifications:view");

  const activeLabel =
    navigation.flatMap((group) => group.items).find((item) => item.to === location.pathname)?.label ??
    "Workspace";

  const onLogout = async () => {
    try {
      await logout.mutateAsync();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <a
        href="#main-content"
        className="screen-reader-text focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-primary focus:px-3 focus:py-1.5 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <aside
        className={cn(
          "hidden shrink-0 border-r border-border bg-card transition-[width] lg:block",
          sidebarCollapsed ? "w-16" : "w-60",
        )}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
      </aside>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            aria-hidden="true"
            onClick={() => setMobileNav(false)}
          />
          <div className="relative z-10 h-full w-64 border-r border-border bg-card">
            <div className="absolute right-2 top-2">
              <Button variant="ghost" size="icon" aria-label="Close navigation" onClick={() => setMobileNav(false)}>
                <XIcon />
              </Button>
            </div>
            <SidebarContent collapsed={false} onNavigate={() => setMobileNav(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b border-border bg-card/95 px-3 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileNav(true)}
          >
            <MenuIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{activeLabel}</p>
          </div>
          {canSeeNotifications ? (
            <Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => navigate("/notifications")}>
              <BellIcon />
            </Button>
          ) : null}
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {user ? initials(user.fullName) : "?"}
              </span>
              <span className="hidden max-w-[10rem] truncate text-sm sm:block">{user?.fullName}</span>
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-full z-30 mt-1 w-56 rounded-md border border-border bg-popover p-2 shadow-lg"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <div className="space-y-0.5 border-b border-border p-1 pb-2">
                  <p className="truncate text-sm font-medium">{user?.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                  <Badge tone="primary" className="mt-1">
                    {user?.grants.length ?? 0} grants
                  </Badge>
                </div>
                <div className="pt-1">
                  <Link
                    to="/settings"
                    role="menuitem"
                    className="block rounded px-2 py-1.5 text-sm hover:bg-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                    onClick={() => void onLogout()}
                  >
                    <LogOutIcon /> Sign out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <main id="main-content" className="flex-1 p-3 lg:p-4">
          <Outlet />
        </main>
      </div>

      <SessionTimeout />
      <Toaster />
    </div>
  );
}
