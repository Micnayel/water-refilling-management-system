import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "../store";
import { notificationsFor, unreadCount } from "../selectors";
import { NotificationIcon } from "./ui";
import type { WorkspaceRole } from "../types";

export function NotificationsFeed({ role }: { role: WorkspaceRole }) {
  const state = useWorkspaceStore();
  const notices = notificationsFor(state, role);
  const unread = unreadCount(state, role);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const visible = filter === "unread" ? notices.filter((row) => !row.read) : notices;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="ws-filter">
          <button type="button" className={cn("btn-reset ws-chip", filter === "all" && "is-on")} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
            All <span className="opacity-70">{notices.length}</span>
          </button>
          <button type="button" className={cn("btn-reset ws-chip", filter === "unread" && "is-on")} aria-pressed={filter === "unread"} onClick={() => setFilter("unread")}>
            Unread <span className="opacity-70">{unread}</span>
          </button>
        </div>
        <Button variant="outline" size="sm" disabled={unread === 0} onClick={() => state.markAllNotificationsRead(role)}>
          Mark all as read
        </Button>
      </div>

      {visible.length === 0 ? (
        <div className="ws-card">
          <EmptyState
            title={filter === "unread" ? "You are all caught up" : "No notifications yet"}
            description="Order, delivery, and billing events appear here as they happen."
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((notice) => {
            const content = (
              <>
                <NotificationIcon kind={notice.kind} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{notice.title}</span>
                    {!notice.read ? <span className="ws-chip is-on">New</span> : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{notice.body}</span>
                  <span className="mt-1 block text-[0.625rem] uppercase tracking-wide text-muted-foreground/80">
                    {formatDateTime(notice.createdAt)}
                  </span>
                </span>
                {notice.href ? <span className="ws-link self-center text-xs">Open</span> : null}
              </>
            );
            return (
              <li key={notice.id}>
                {notice.href ? (
                  <Link
                    to={notice.href}
                    className={cn("btn-reset ws-notice", !notice.read && "is-unread")}
                    onClick={() => state.markNotificationRead(notice.id)}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={cn("btn-reset ws-notice w-full text-left", !notice.read && "is-unread")}
                    onClick={() => state.markNotificationRead(notice.id)}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-[0.6875rem] text-muted-foreground">
        Notifications in this preview are generated locally from workspace events. Nothing is sent by email or SMS.
      </p>
    </div>
  );
}

export function WorkspaceNotificationsPage({ role }: { role: WorkspaceRole }) {
  return (
    <>
      <div className="mb-4">
        <p className="ws-eyebrow">Notifications</p>
        <h1 className="ws-title">System activity</h1>
        <p className="ws-subtitle">Order, delivery, billing, and account events for this role.</p>
      </div>
      <NotificationsFeed role={role} />
    </>
  );
}
