import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ClipboardIcon,
  PackageIcon,
  TrendingUpIcon,
  TruckIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { formatDateNumeric, formatDateTime } from "@/lib/dates";
import { formatCentavos } from "@/lib/money";
import { useWorkspaceStore } from "../../store";
import { adminMetrics, notificationsFor, planFor, shortMoney } from "../../selectors";
import { OrderDetailDialog, DeliveryDetailDialog } from "../../components/dialogs";
import {
  BarChart,
  Donut,
  LineChart,
  NotificationIcon,
  PageHeading,
  SectionCard,
  StatCard,
  StatusPill,
} from "../../components/ui";
import type { Delivery, Order } from "../../types";

export function AdminOverview() {
  const state = useWorkspaceStore();
  const toast = useToast();
  const metrics = adminMetrics(state);
  const [order, setOrder] = useState<Order | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);

  const revenuePoints = state.revenue.map((row) => ({ label: row.label, value: row.revenueCentavos }));
  const orderPoints = state.revenue.map((row) => ({ label: row.label, value: row.orders }));
  const latestOrders = [...state.orders].sort((a, b) => b.placedAt.localeCompare(a.placedAt)).slice(0, 6);
  const activeDeliveries = state.deliveries
    .filter((row) => row.status === "Assigned" || row.status === "Preparing" || row.status === "Out for delivery")
    .slice(0, 5);
  const notices = notificationsFor(state, "admin").slice(0, 4);
  const pendingRegistrations = state.registrations.filter((row) => row.status === "Pending");

  return (
    <>
      <PageHeading
        eyebrow="Operations overview"
        title="Good day, administrator"
        subtitle="Live picture of customers, orders, deliveries, and stock. All figures are synthetic preview data."
        actions={
          <>
            <Link to="/overview/orders">
              <Button variant="outline"><ClipboardIcon /> Manage orders</Button>
            </Link>
            <Link to="/reports">
              <Button><TrendingUpIcon /> Open reports</Button>
            </Link>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Total customers" value={String(metrics.totalCustomers)} icon={UsersIcon} tone="primary" hint="Active accounts" trend="+3 this week" />
        <StatCard label="Active subscriptions" value={String(metrics.activeSubscriptions)} icon={CalendarIcon} hint="Recurring deliveries" />
        <StatCard label="Today's orders" value={String(metrics.todaysOrders)} icon={ClipboardIcon} hint={`${metrics.pendingOrders} pending`} />
        <StatCard label="Pending orders" value={String(metrics.pendingOrders)} icon={ClipboardIcon} tone="warning" hint="Awaiting confirmation" />
        <StatCard label="Ongoing deliveries" value={String(metrics.ongoingDeliveries)} icon={TruckIcon} hint="On the road now" />
        <StatCard label="Completed deliveries" value={String(metrics.completedDeliveries)} icon={CheckIcon} tone="success" hint="Recorded in the log" />
        <StatCard label="Revenue overview" value={shortMoney(metrics.revenueWeekCentavos)} icon={WalletIcon} tone="success" hint="Last 7 days" trend="+12%" />
        <StatCard label="Low stock lines" value={String(metrics.lowStock)} icon={PackageIcon} tone="warning" hint="Below reorder point" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <SectionCard
            title="Sales and order analytics"
            description="Revenue and order volume for the last seven days."
            action={
              <Link to="/reports" className="ws-link text-xs">
                Full reports
              </Link>
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold">Revenue</span>
                  <Badge tone="success">+12% WoW</Badge>
                </div>
                <LineChart points={revenuePoints} format={shortMoney} label="Revenue for the last seven days" />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold">Orders</span>
                  <span className="text-xs text-muted-foreground">{metrics.ordersTodayCount} today</span>
                </div>
                <BarChart points={orderPoints} label="Orders per day" />
              </div>
            </div>
            <Link
              to="/reports"
              className="mt-2 flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-xs transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <span><strong className="font-semibold">Need a deeper breakdown?</strong> Area, rider, plan, and period comparisons live in Reports.</span>
              <ArrowRightIcon className="size-4 shrink-0 text-primary" />
            </Link>
          </SectionCard>

          <div className="grid gap-4 md:grid-cols-2">
            <SectionCard title="Latest orders" description="Newest first." action={<Link to="/overview/orders" className="ws-link text-xs">All orders</Link>} bodyClassName="p-0">
              <ul className="divide-y divide-border">
                {latestOrders.map((row) => (
                  <li key={row.id}>
                    <button type="button" className="btn-reset flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors hover:bg-muted/40" onClick={() => setOrder(row)}>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{row.ref}</span>
                        <span className="block truncate text-xs text-muted-foreground">{row.customerName} · {row.jugs} gal</span>
                      </span>
                      <span className="flex flex-col items-end gap-1">
                        <StatusPill status={row.status} />
                        <span className="text-[0.6875rem] text-muted-foreground">{formatCentavos(row.amountCentavos)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard title="Delivery monitoring" description="Active stops right now." action={<Link to="/overview/deliveries" className="ws-link text-xs">Manage</Link>} bodyClassName="p-0">
              <ul className="divide-y divide-border">
                {activeDeliveries.map((row) => (
                  <li key={row.id}>
                    <button type="button" className="btn-reset flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors hover:bg-muted/40" onClick={() => setDelivery(row)}>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{row.customerName}</span>
                        <span className="block truncate text-xs text-muted-foreground">{row.rider} · {row.area} · {row.jugs} gal</span>
                      </span>
                      <StatusPill status={row.status} />
                    </button>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>

          <SectionCard title="Inventory status" description="Full stock against each reorder point." action={<Link to="/inventory" className="ws-link text-xs">Open inventory</Link>}>
            <div className="space-y-3">
              {state.inventory.map((row) => {
                const ratio = Math.min(100, Math.round((row.full / Math.max(row.reorder * 2, 1)) * 100));
                const low = row.full < row.reorder;
                return (
                  <div key={row.id}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium">{row.name}</span>
                      <span className={low ? "font-semibold text-warning" : "text-muted-foreground"}>
                        {row.full} full · reorder at {row.reorder}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className={low ? "h-full rounded-full bg-warning" : "h-full rounded-full bg-primary"} style={{ width: `${Math.max(6, ratio)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard
            title="Recent registrations"
            description={`${pendingRegistrations.length} awaiting approval`}
            action={<Link to="/administration/users/pending" className="ws-link text-xs">Review</Link>}
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-border">
              {state.registrations.slice(0, 4).map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.name}</p>
                    <p className="text-[0.6875rem] text-muted-foreground">{row.area} · {formatDateNumeric(row.joinedAt)}</p>
                  </div>
                  {row.status === "Pending" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        state.approveRegistration(row.id);
                        toast(`${row.name} approved in this preview`, "success");
                      }}
                    >
                      Approve
                    </Button>
                  ) : (
                    <Badge tone="success">Approved</Badge>
                  )}
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Subscription mix" description="Share of active plans.">
            <Donut
              value={metrics.activeSubscriptions}
              total={state.subscriptions.length}
              centerLabel={`${metrics.activeSubscriptions}/${state.subscriptions.length}`}
              caption="Active subscriptions across all plans. Paused plans are excluded from the filled share."
            />
            <div className="mt-3 space-y-1.5">
              {state.subscriptions.map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate">{row.customerName}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-muted-foreground">{planFor(state, row.planId)?.name}</span>
                    <StatusPill status={row.status === "active" ? "Active" : "Paused"} />
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Important notifications" description={`${metrics.unread} unread`} bodyClassName="p-2">
            <ul className="space-y-1.5">
              {notices.map((notice) => (
                <li key={notice.id}>
                  <Link to={notice.href ?? "/overview"} className="ws-notice items-start">
                    <NotificationIcon kind={notice.kind} />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold">{notice.title}</span>
                      <span className="block text-[0.6875rem] text-muted-foreground">{formatDateTime(notice.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>

      <OrderDetailDialog order={order} open={order !== null} onOpenChange={(open) => !open && setOrder(null)} />
      <DeliveryDetailDialog delivery={delivery} open={delivery !== null} onOpenChange={(open) => !open && setDelivery(null)} />
    </>
  );
}
