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
  InfoIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
} from "@/components/ui/icons";
import { Toaster } from "@/components/ui/toaster";
import { initials, cn } from "@/lib/utils";
import { isPreviewMode } from "@/lib/preview";
import { usePermission } from "@/hooks/use-permission";
import { hasGrant, useSessionStore } from "@/stores/session-store";
import { useUiStore } from "@/stores/ui-store";
import { useLogoutMutation } from "@/modules/auth";
import { SessionTimeout } from "@/components/session/SessionTimeout";

function NavEntry({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink to={item.to} end={item.end} onClick={onNavigate} className="nav-pill">
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const user = useSessionStore((state) => state.user);
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
      <Link
        to="/"
        className={cn(
          "flex items-center gap-2.5 border-b border-foreground/10 px-4 py-4",
          collapsed && "justify-center px-2",
        )}
      >
        <span className="brand-mark flex size-9 shrink-0 items-center justify-center rounded-xl">
          <DropletIcon className="size-[1.15rem]" />
        </span>
        {!collapsed ? (
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight">{brand.shortName}</span>
            <span className="block truncate text-[0.625rem] uppercase tracking-[0.18em] text-muted-foreground">
              Management
            </span>
          </span>
        ) : null}
      </Link>

      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-2.5 py-3">
        {navigation.map((group) => {
          const items = group.items.filter((item) => (user ? hasGrant(user, item.grant) : false));
          if (items.length === 0) return null;
          return (
            <div key={group.label} className="mb-4">
              {!collapsed ? (
                <p className="mb-1.5 px-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                  {group.label}
                </p>
              ) : (
                <div className="mx-auto mb-2 h-px w-6 bg-foreground/10" aria-hidden="true" />
              )}
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
        <div className="space-y-2 border-t border-foreground/10 p-3">
          {user ? (
            <div className="flex items-center gap-2 rounded-xl border border-foreground/10 bg-foreground/[0.04] p-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground/10 text-[0.6875rem] font-semibold">
                {initials(user.fullName)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">{user.fullName}</span>
                <span className="flex items-center gap-1 text-[0.625rem] text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
                  Signed in
                </span>
              </span>
              <button
                type="button"
                aria-label="Sign out"
                className="btn-reset rounded-md p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                onClick={() => void onLogout()}
              >
                <LogOutIcon className="size-4" />
              </button>
            </div>
          ) : null}
          <div className="flex items-center gap-2 rounded-lg border border-foreground/10 px-2 py-1.5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-2 animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            <span className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">API operational</span>
          </div>
          <p className="text-[0.625rem] leading-relaxed text-muted-foreground/70">{brand.supportNote}</p>
        </div>
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
  const preview = isPreviewMode();

  const allItems = navigation.flatMap((group) => group.items);
  const activeItem =
    allItems.find((item) => item.end && location.pathname === item.to) ??
    allItems
      .filter((item) => !item.end && location.pathname.startsWith(item.to))
      .sort((a, b) => b.to.length - a.to.length)[0];
  const activeLabel = activeItem?.label ?? "Workspace";
  const activeGroup =
    navigation.find((group) => group.items.some((item) => item.to === activeItem?.to))?.label ??
    "Workspace";

  const onLogout = async () => {
    try {
      await logout.mutateAsync();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="app-canvas flex min-h-screen">
      <a
        href="#main-content"
        className="screen-reader-text focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-primary focus:px-3 focus:py-1.5 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <aside
        className={cn(
          "app-sidebar sticky top-0 hidden h-screen shrink-0 border-r transition-[width] duration-200 lg:block",
          sidebarCollapsed ? "w-[4.5rem]" : "w-[16.5rem]",
        )}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
      </aside>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setMobileNav(false)}
          />
          <div className="app-sidebar relative z-10 h-full w-[17rem] animate-pop-in border-r border-foreground/10">
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
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-foreground/10 bg-background/70 px-3 backdrop-blur-xl lg:px-5">
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
            <p className="truncate text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
              {activeGroup}
            </p>
            <p className="truncate text-sm font-semibold leading-tight">{activeLabel}</p>
          </div>

          {preview ? (
            <span className="hidden items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-wider text-warning sm:inline-flex">
              <InfoIcon className="size-3" />
              Preview
            </span>
          ) : null}

          {canSeeNotifications ? (
            <Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => navigate("/notifications")}>
              <BellIcon />
            </Button>
          ) : null}
          <div className="relative">
            <button
              type="button"
              className="btn-reset flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.04] p-0.5 pr-2.5 transition-colors hover:border-foreground/25 hover:bg-foreground/10"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-[0.6875rem] font-semibold text-primary-foreground ring-2 ring-primary/25">
                {user ? initials(user.fullName) : "?"}
              </span>
              <span className="hidden max-w-[10rem] truncate text-sm sm:block">{user?.fullName}</span>
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="dialog-panel absolute right-0 top-full z-30 mt-2 w-64 animate-pop-in p-2"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <div className="space-y-0.5 border-b border-foreground/10 p-1 pb-2">
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
                    className="block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-foreground/10"
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="btn-reset flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-foreground/10"
                    onClick={() => void onLogout()}
                  >
                    <LogOutIcon /> Sign out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <main id="main-content" className="flex-1 px-3 py-4 lg:px-5 lg:py-5">
          <div className="mx-auto w-full max-w-[96rem]">
            {preview ? (
              <div
                role="status"
                className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-warning/35 bg-warning/10 px-3 py-2 text-xs"
              >
                <InfoIcon className="size-4 text-warning" />
                <span>
                  <strong className="font-semibold">Preview data.</strong> Synthetic sample records for
                  design review. Actions that change data are hidden.
                </span>
              </div>
            ) : null}
            <Outlet />
          </div>
        </main>
      </div>

      <SessionTimeout />
      <Toaster />
    </div>
  );
}
